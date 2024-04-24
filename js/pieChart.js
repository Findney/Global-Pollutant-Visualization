const URL_CSV = '../data/airQuality_out.csv';
const SVG_SELECTOR = '#pie-chart';
const OTHER_THRESHOLD = 2;
const OTHER_PIECHART = '#other-pie-chart';

// Fungsi untuk mengambil data CSV
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        return await response.text();
    } catch (error) {
        console.error('Error fetching data:', error.message);
        throw error;
    }
}

function calculatePollutantPercentage(csvText) {
    const data = Papa.parse(csvText, { header: true, skipEmptyLines: true }).data;
    const totalJumlahPolutan = data.reduce((acc, item) => {
        const polutan = item.Pollutant;
        const jumlah = parseFloat(item.Value_standard);
        acc[polutan] = (acc[polutan] || 0) + jumlah;
        return acc;
    }, {});

    const totalKeseluruhan = Object.values(totalJumlahPolutan).reduce((acc, val) => acc + val, 0);

    // Menghitung polutan dengan persentase kurang dari threshold
    const otherPolutanEntries = Object.entries(totalJumlahPolutan)
        .filter(([polutan, total]) => (total / totalKeseluruhan) * 100 < OTHER_THRESHOLD);

    const otherPolutanTotal = otherPolutanEntries.reduce((acc, [polutan, total]) => acc + total, 0);

    // Membuat array untuk polutan 'Other'
    const otherPolutanData = otherPolutanEntries.map(([polutan, total]) => ({
        polutan,
        persentase: (total / totalKeseluruhan) * 100,
        jumlahPolutan: total // Menambahkan jumlah polutan
    }));

    // Menghapus polutan yang termasuk dalam kategori 'Other' dari totalJumlahPolutan
    otherPolutanEntries.forEach(([polutan, total]) => {
        delete totalJumlahPolutan[polutan];
    });

    // Menambahkan kategori 'Other' ke totalJumlahPolutan
    totalJumlahPolutan['Other'] = otherPolutanTotal;

    // Mengembalikan data untuk pie chart utama dan pie chart 'Other'
    return {
        mainData: Object.entries(totalJumlahPolutan).map(([polutan, total]) => ({
            polutan,
            persentase: (total / totalKeseluruhan) * 100,
            jumlahPolutan: total // Menambahkan jumlah polutan
        })),
        otherData: otherPolutanData
    };
}


// Fungsi untuk membuat pie chart
function createPieChart(data, svgSelector) {
    const div = d3.select('body');
    const width = window.innerWidth;
    const height = window.innerHeight;
    const radius = Math.min(width, height) / 2;
    const colorScale = d3.scaleOrdinal(d3.schemeSet3);

    const svg = div.select(svgSelector)
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie().value(d => d.persentase).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(radius * 0.75);
    const hoverArc = d3.arc().innerRadius(0).outerRadius(radius * 0.85);

    const g = svg.selectAll('.arc')
        .data(pie(data))
        .enter().append('g')
        .attr('class', 'arc');

    // Menghitung lebar dan tinggi untuk legenda
    const legendRectSize = 18; // Ukuran persegi legenda
    const legendSpacing = 4; // Jarak antar item legenda
    const legendHeight = data.length * (legendRectSize + legendSpacing); // Tinggi total legenda

    // Membuat kotak deskripsi untuk legenda
    const legendBox = svg.append('g')
        .attr('class', 'legend-box')
        // Posisikan kotak legenda sejajar dengan pusat pie chart
        .attr('transform', `translate(${radius + 40}, ${-legendHeight / 2})`);

    // Membuat background untuk legenda
    legendBox.append('rect')
        .attr('class', 'legend-bg')
        .attr('width', 150) // Lebar kotak legenda
        .attr('height', legendHeight) // Tinggi kotak legenda
        .attr('fill', '#f9f9f9')
        .attr('stroke', '#ccc')
        .attr('stroke-width', '1px');

    // Membuat legenda
    const legend = legendBox.selectAll('.legend')
        .data(pie(data))
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', (d, i) => `translate(10, ${i * (legendRectSize + legendSpacing)})`);

    // Membuat persegi sebagai warna legenda
    legend.append('rect')
        .attr('width', legendRectSize)
        .attr('height', legendRectSize)
        .style('fill', (d, i) => colorScale(i))
        .style('stroke', (d, i) => colorScale(i));

    // Menambahkan teks ke legenda
    legend.append('text')
        .attr('x', legendRectSize + legendSpacing)
        .attr('y', legendRectSize - legendSpacing)
        .text(d => `${d.data.polutan}: ${d.data.persentase.toFixed(2)}%`)
        .style('font-size', '12px')
        .style('font-weight', 'normal')
        .style('fill', '#333');

    // Membuat tooltip
    const tooltip = div.append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', '#FFF')
        .style('border', '1px solid #0E0B16')
        .style('border-radius', '4px')
        .style('padding', '8px')
        .style('text-align', 'left')
        .style('font-size', '16px')
        .style('font-weight', '500')
        .style('border', 'none')
        .style('box-shadow', '2px 4px 8px rgba(0, 0, 0, 0.3)')
        .style('pointer-events', 'none'); // Memastikan tooltip tidak mengganggu interaksi mouse

    // Menambahkan path tanpa teks
    g.append('path')
        .attr('d', arc)
        .style('fill', (d, i) => colorScale(i))
        .style('fill-opacity', 0.8)
        .style('stroke', '#0E0B16')
        .style('stroke-width', '1px')
        .on('mouseover', function (event, d) {
            const jumlahPolutan = d.data.jumlahPolutan.toFixed(2); // Memformat jumlah polutan dengan dua angka di belakang koma
            const tooltipText = `${d.data.polutan}: ${d.data.persentase.toFixed(2)}% <br> Total: <span style="font-weight: bold">${jumlahPolutan}</span> µg/m³`; // Menggunakan <br> untuk baris baru
            tooltip.style('visibility', 'visible')
                .html(tooltipText);
            d3.select(this)
                .transition().duration(500)
                .attr('d', hoverArc);
        })
        .on('mousemove', function (event) {
            tooltip.style('top', (event.pageY - 10) + 'px')
                .style('left', (event.pageX + 10) + 'px');
        })
        .on('mouseout', function () {
            tooltip.style('visibility', 'hidden');
            d3.select(this)
                .transition().duration(500)
                .attr('d', arc);
        });
}

async function main() {
    try {
        const csvText = await fetchData(URL_CSV);
        const { mainData, otherData } = calculatePollutantPercentage(csvText);
        createPieChart(mainData, SVG_SELECTOR);

        // Membuat pie chart terpisah untuk kategori 'Other'
        if (otherData.length > 0) {
            createPieChart(otherData, OTHER_PIECHART);
        }
    } catch (error) {
        console.error('Main error:', error.message);
    }
}

// Panggil main function untuk memulai proses
main();
