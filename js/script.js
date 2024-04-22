// Contoh penggunaan fungsi
const urlCsv = '../data/airQuality_out.csv';

// Fungsi untuk mengambil data CSV dan mengembalikan promise dengan data yang telah diparse
function ambilDataCsv(urlCsv) {
  return fetch(urlCsv)
    .then(response => response.text())
    .then(csvText => Papa.parse(csvText, { header: true, skipEmptyLines: true }).data)
    .catch(error => console.error('Error:', error));
}

// Fungsi untuk menampilkan jenis polutan dalam dataset
function tampilkanJenisPolutan(data) {
  const setPolutan = new Set(data.map(item => item.Pollutant).filter(Boolean));
  console.log('Jenis polutan dalam dataset:');
  setPolutan.forEach(polutan => console.log(polutan));
  console.log(`========== Total Jenis Polutan adalah ${setPolutan.size} ==========`)
}

// Fungsi untuk menghitung total jumlah polutan
function hitungTotalJumlahPolutan(data) {
  const totalJumlahPolutan = data.reduce((acc, item) => {
    const jumlah = parseFloat(item.Value_standard);
    acc[item.Pollutant] = (acc[item.Pollutant] || 0) + jumlah;
    return acc;
  }, {});

  console.log('\n')

  for (const [polutan, total] of Object.entries(totalJumlahPolutan)) {
    console.log(`Polutan ${polutan} memiliki jumlah total ${total}`);
  }
}

// Fungsi untuk menghitung persentase polutan
function hitungPersentasePolutan(data) {
  const totalJumlahPolutan = {};
  let totalKeseluruhan = 0;

  data.forEach(item => {
    const jumlah = parseFloat(item.Value_standard);
    totalJumlahPolutan[item.Pollutant] = (totalJumlahPolutan[item.Pollutant] || 0) + jumlah;
    totalKeseluruhan += jumlah;
  });

  console.log(`========== Total Keseluruhan Polutan adalah ${totalKeseluruhan} ==========`)
  console.log('\n')

  for (const [polutan, total] of Object.entries(totalJumlahPolutan)) {
    const persentase = (total / totalKeseluruhan) * 100;
    console.log(`Polutan ${polutan} memiliki persentase ${persentase.toFixed(2)}% dari total keseluruhan`);
  }
}

function hitungDanTampilkanTotalPersentasePolutan(data) {
  const totalJumlahPolutan = {};
  let totalKeseluruhan = 0;

  data.forEach(item => {
    const jumlah = parseFloat(item.Value_standard);
    totalJumlahPolutan[item.Pollutant] = (totalJumlahPolutan[item.Pollutant] || 0) + jumlah;
    totalKeseluruhan += jumlah;
  });

  let totalPersentase = 0;
  for (const total of Object.values(totalJumlahPolutan)) {
    const persentase = (total / totalKeseluruhan) * 100;
    totalPersentase += persentase;
  }

  console.log(`========== Total keseluruhan persentase polutan adalah: ${totalPersentase.toFixed(2)}% ==========`);
}

// Contoh penggunaan fungsi
ambilDataCsv(urlCsv).then(data => {
  hitungDanTampilkanTotalPersentasePolutan(data);
  // Fungsi lainnya
});

ambilDataCsv(urlCsv).then(data => {
  console.log("HALLO UDAH MALAM TIDUR SANA")
  tampilkanJenisPolutan(data);
  hitungTotalJumlahPolutan(data);
  hitungPersentasePolutan(data);
  hitungDanTampilkanTotalPersentasePolutan(data)
});
