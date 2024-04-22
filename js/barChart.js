var svg = d3.select("#bar-chart"),
    margin = { top: 100, right: 100, bottom: 100, left: 150 },
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;

svg.append("text")
    .attr("transform", "translate(100,0)")
    .attr("x", 50)
    .attr("y", 50)
    .attr("font-size", "24px")

var xScale = d3.scaleBand().range([0, width]).padding(0.4),
    yScale = d3.scaleLinear().range([height, 0]);

var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Baca data dari file CSV
d3.dsv(';', "./data/airQuality_out.csv").then(function (data) {
    // Kelompokkan data berdasarkan kode negara (Country Label)
    var groupedData = d3.group(data, d => d["Country Label"]); // Menggunakan "Country Label" sebagai kelompok

    // Hitung total nilai polutan NO dan jumlah kemunculan NO untuk setiap negara
    var noData = [];
    groupedData.forEach(function (countryData, countryLabel) {
        var totalNO = d3.sum(countryData, d => d.Pollutant === "NO" ? +d.Value_standard : 0);
        var countNO = countryData.filter(d => d.Pollutant === "NO").length;
        var averageNO = countNO > 0 ? totalNO / countNO : 0; // Rata-rata polutan NO
        noData.push({ "Country Label": countryLabel, "Average NO": averageNO });
    });

    // Urutkan data berdasarkan rata-rata nilai polutan NO secara menurun
    noData.sort((a, b) => b["Average NO"] - a["Average NO"]);

    // Ambil 10 negara teratas
    var top10 = noData.slice(0, 10);

    // Update domain untuk skala x dan y
    xScale.domain(top10.map(d => d["Country Label"])); // Menggunakan "Country Label" sebagai domain
    yScale.domain([0, d3.max(noData, d => d["Average NO"]) * 1.1]); // Menggunakan nilai maksimum + 10% sebagai domain y

    // Gambar sumbu x dan sumbu y
    g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em");

    g.append("g")
        .call(d3.axisLeft(yScale).tickFormat(d => d + " µg/m³").ticks(10)) // mengatur langkah tick dan format
        .append("text")
        .attr("y", 6)
        .attr("dy", "-2em")
        .attr("dx", "3em")
        .attr("text-anchor", "end")
        .attr("fill", "#0E0B16")
        .attr("font-weight", 900)
        .text("Average NO Value (µg/m³)");

    // Merubah warna teks pada sumbu y menjadi lightgray
    g.selectAll(".tick text")
        .style("fill", "#0E0B16");


    // Gambar grafik batang
    g.selectAll(".bar")
        .data(top10)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (d) { return xScale(d["Country Label"]); })
        .attr("y", function (d) { return yScale(d["Average NO"]); })
        .attr("width", xScale.bandwidth())
        .attr("height", function (d) { return height - yScale(d["Average NO"]); });
}).catch(function (error) {
    console.log(error);
});
