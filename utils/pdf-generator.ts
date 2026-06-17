import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import fs from 'fs';
import path from 'path';

dayjs.locale('id');

// Helper function to convert image to base64
function getLogoBase64() {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const imageBuffer = fs.readFileSync(logoPath);
    const base64Image = imageBuffer.toString('base64');
    return `data:image/png;base64,${base64Image}`;
  } catch (error) {
    console.error('Error loading logo:', error);
    return null;
  }
}

// Helper function to add header with logo
function addHeader(doc: jsPDF, title: string, nomorSurat: string) {
  const logo = getLogoBase64();
  
  // Add logo if available (left side)
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', 15, 10, 20, 20);
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
    }
  }
  
  // Header - RT Info (centered)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PEMERINTAH KABUPATEN/KOTA', 105, 15, { align: 'center' });
  doc.text('KECAMATAN [NAMA KECAMATAN]', 105, 22, { align: 'center' });
  doc.text('RT/RW [NOMOR RT/RW]', 105, 29, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Alamat: [Alamat RT Lengkap]', 105, 35, { align: 'center' });
  
  // Optional: Add logo on right side too (mirror)
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', 175, 10, 20, 20);
    } catch (error) {
      console.error('Error adding right logo to PDF:', error);
    }
  }
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.line(20, 40, 190, 40);
  doc.setLineWidth(0.2);
  doc.line(20, 41, 190, 41);
}

// Helper function to add footer with signature
function addFooter(doc: jsPDF, data: any, yPosition: number) {
  const tanggal = dayjs().format('DD MMMM YYYY');
  const tempat = data.kelurahan || 'Bekasi';
  
  doc.setFontSize(11);
  doc.text(`${tempat}, ${tanggal}`, 130, yPosition);
  doc.text('Ketua RT', 145, yPosition + 7);
  
  // Space for signature
  doc.text('( _____________________ )', 130, yPosition + 35);
}

export function generateSuratDomisili(data: any) {
  const doc = new jsPDF();
  const nomorSurat = `${Math.floor(Math.random() * 1000)}/SK-DOM/${new Date().getFullYear()}`;
  
  addHeader(doc, 'SURAT KETERANGAN DOMISILI', nomorSurat);

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SURAT KETERANGAN DOMISILI', 105, 50, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor: ${nomorSurat}`, 105, 57, { align: 'center' });
  
  doc.setLineWidth(0.3);
  doc.line(80, 59, 130, 59);

  // Content
  doc.setFontSize(11);
  let y = 70;
  
  doc.text('Yang bertanda tangan di bawah ini, Kepala RT/RW setempat, dengan ini', 20, y);
  doc.text('menerangkan bahwa:', 20, y + 7);
  
  y += 20;
  
  // Data table
  const dataRows = [
    ['Nama', ': ' + (data.nama || '-')],
    ['Tempat / Tgl Lahir', `: ${data.tempatLahir || '-'}, ${data.tanggalLahir ? dayjs(data.tanggalLahir).format('DD MMMM YYYY') : '-'}`],
    ['Jenis Kelamin', ': ' + (data.jenisKelamin || 'Laki-laki')],
    ['Kewarganegaraan', ': Indonesia'],
    ['Pekerjaan', ': ' + (data.pekerjaan || '-')],
    ['No. NIK', ': ' + (data.nik || '-')],
    ['Alamat', `: ${data.alamat || '-'}`],
    ['', `  RT ${data.rt || '001'} / RW ${data.rw || '001'}, Kel. ${data.kelurahan || '-'}`],
    ['', `  Kec. ${data.kecamatan || '-'}`],
  ];
  
  dataRows.forEach(([label, value]) => {
    doc.setFont('helvetica', label ? 'normal' : 'normal');
    doc.text(label, 30, y);
    doc.text(value, label ? 65 : 65, y);
    y += 6;
  });
  
  y += 5;
  
  // Purpose text
  const keperluan = data.keperluan || data.purpose || 'keperluan administrasi';
  const purposeLines = doc.splitTextToSize(
    `Berdasarkan Surat Keterangan dari RT, dengan ini menerangkan bahwa yang bersangkutan benar-benar berdomisili di alamat tersebut dan terdaftar sebagai warga kami. Surat keterangan ini dibuat untuk keperluan ${keperluan}.`,
    170
  );
  
  purposeLines.forEach((line: string) => {
    doc.text(line, 20, y);
    y += 6;
  });
  
  y += 5;
  doc.text('Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat', 20, y);
  doc.text('dipergunakan sebagaimana mestinya.', 20, y + 6);
  
  addFooter(doc, data, y + 20);

  return doc;
}


export function generateSuratPengantar(data: any) {
  const doc = new jsPDF();
  const nomorSurat = `${Math.floor(Math.random() * 1000)}/SK-PEN/${new Date().getFullYear()}`;
  
  addHeader(doc, 'SURAT PENGANTAR', nomorSurat);

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SURAT PENGANTAR', 105, 50, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor: ${nomorSurat}`, 105, 57, { align: 'center' });
  
  doc.setLineWidth(0.3);
  doc.line(85, 59, 125, 59);

  // Content
  doc.setFontSize(11);
  let y = 70;
  
  doc.text('Yang bertanda tangan di bawah ini:', 20, y);
  
  y += 10;
  doc.text('Nama', 30, y);
  doc.text(`: ${data.ketuaRT || 'Ketua RT'}`, 70, y);
  
  y += 6;
  doc.text('Jabatan', 30, y);
  doc.text(`: Ketua RT ${data.rt || '001'} / RW ${data.rw || '001'}`, 70, y);
  
  y += 10;
  doc.text('Dengan ini menerangkan bahwa:', 20, y);
  
  y += 10;
  const dataRows = [
    ['Nama', ': ' + (data.nama || '-')],
    ['Tempat / Tgl Lahir', `: ${data.tempatLahir || '-'}, ${data.tanggalLahir ? dayjs(data.tanggalLahir).format('DD MMMM YYYY') : '-'}`],
    ['NIK', ': ' + (data.nik || '-')],
    ['Pekerjaan', ': ' + (data.pekerjaan || '-')],
    ['Alamat', `: ${data.alamat || '-'}`],
  ];
  
  dataRows.forEach(([label, value]) => {
    doc.text(label, 30, y);
    doc.text(value, 70, y);
    y += 6;
  });
  
  y += 8;
  
  const keperluan = data.keperluan || data.purpose || '-';
  doc.text('Adalah benar warga kami yang akan mengurus:', 20, y);
  y += 7;
  
  const keperluanLines = doc.splitTextToSize(keperluan, 160);
  keperluanLines.forEach((line: string) => {
    doc.text(line, 30, y);
    y += 6;
  });
  
  y += 5;
  doc.text('Demikian surat pengantar ini kami buat dengan sebenarnya, untuk dapat', 20, y);
  doc.text('dipergunakan sebagaimana mestinya.', 20, y + 6);
  
  addFooter(doc, data, y + 20);

  return doc;
}


export function generateSuratIzinUsaha(data: any) {
  const doc = new jsPDF();
  const nomorSurat = `${Math.floor(Math.random() * 1000)}/SK-IU/${new Date().getFullYear()}`;
  
  addHeader(doc, 'SURAT KETERANGAN USAHA', nomorSurat);

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SURAT KETERANGAN USAHA', 105, 50, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor: ${nomorSurat}`, 105, 57, { align: 'center' });
  
  doc.setLineWidth(0.3);
  doc.line(80, 59, 130, 59);

  // Content
  doc.setFontSize(11);
  let y = 70;
  
  doc.text('Yang bertanda tangan di bawah ini, Ketua RT setempat, dengan ini', 20, y);
  doc.text('menerangkan bahwa:', 20, y + 7);
  
  y += 20;
  
  const dataRows = [
    ['Nama', ': ' + (data.nama || '-')],
    ['Tempat / Tgl Lahir', `: ${data.tempatLahir || '-'}, ${data.tanggalLahir ? dayjs(data.tanggalLahir).format('DD MMMM YYYY') : '-'}`],
    ['Jenis Kelamin', ': ' + (data.jenisKelamin || 'Laki-laki')],
    ['Agama', ': ' + (data.agama || 'Islam')],
    ['Pekerjaan', ': ' + (data.pekerjaan || 'Wiraswasta')],
    ['NIK', ': ' + (data.nik || '-')],
    ['Alamat', `: ${data.alamat || '-'}`],
    ['No. Telp', ': ' + (data.noTelp || '-')],
  ];
  
  dataRows.forEach(([label, value]) => {
    doc.text(label, 30, y);
    doc.text(value, 70, y);
    y += 6;
  });
  
  y += 8;
  
  const jenisUsaha = data.jenisUsaha || data.purpose || 'usaha';
  const lokasiUsaha = data.lokasiUsaha || data.alamat || '-';
  
  doc.text('Memohon izin untuk membuka usaha:', 20, y);
  y += 7;
  doc.text(`Jenis Usaha`, 30, y);
  doc.text(`: ${jenisUsaha}`, 70, y);
  y += 6;
  doc.text(`Lokasi Usaha`, 30, y);
  doc.text(`: ${lokasiUsaha}`, 70, y);
  
  y += 10;
  doc.text('Demikian Surat Keterangan Usaha ini dibuat agar dapat dipergunakan', 20, y);
  doc.text('sebagaimana mestinya.', 20, y + 6);
  
  addFooter(doc, data, y + 20);

  return doc;
}


export function generateSuratKeteranganTidakMampu(data: any) {
  const doc = new jsPDF();
  const nomorSurat = `${Math.floor(Math.random() * 1000)}/SKTM/${new Date().getFullYear()}`;
  
  addHeader(doc, 'SURAT KETERANGAN TIDAK MAMPU', nomorSurat);

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SURAT KETERANGAN TIDAK MAMPU', 105, 50, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor: ${nomorSurat}`, 105, 57, { align: 'center' });
  
  doc.setLineWidth(0.3);
  doc.line(75, 59, 135, 59);

  // Content
  doc.setFontSize(11);
  let y = 70;
  
  doc.text('Yang bertanda tangan di bawah ini, Ketua RT/RW setempat, menerangkan', 20, y);
  doc.text('dengan sebenarnya bahwa:', 20, y + 7);
  
  y += 20;
  
  const dataRows = [
    ['Nama', ': ' + (data.nama || '-')],
    ['Tempat / Tanggal Lahir', `: ${data.tempatLahir || '-'}, ${data.tanggalLahir ? dayjs(data.tanggalLahir).format('DD MMMM YYYY') : '-'}`],
    ['Jenis Kelamin', ': ' + (data.jenisKelamin || 'Laki-laki')],
    ['Status/Hubungan', ': ' + (data.statusHubungan || 'Kepala Keluarga')],
    ['Alamat', `: ${data.alamat || '-'}`],
  ];
  
  dataRows.forEach(([label, value]) => {
    doc.text(label, 30, y);
    doc.text(value, 75, y);
    y += 6;
  });
  
  y += 8;
  doc.text('Adalah benar - benar tidak dari orang tua:', 20, y);
  
  y += 10;
  
  // Parent data
  const orangTua1 = data.namaOrangTua1 || data.namaBapak || '-';
  const umur1 = data.umurOrangTua1 || data.umurBapak || '-';
  const pekerjaan1 = data.pekerjaanOrangTua1 || data.pekerjaanBapak || '-';
  const alamat1 = data.alamatOrangTua1 || data.alamat || '-';
  
  doc.setFont('helvetica', 'bold');
  doc.text('I.  Nama Bapak', 25, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${orangTua1}`, 70, y);
  y += 6;
  doc.text('Umur', 30, y);
  doc.text(`: ${umur1} Tahun`, 70, y);
  y += 6;
  doc.text('Pekerjaan', 30, y);
  doc.text(`: ${pekerjaan1}`, 70, y);
  y += 6;
  doc.text('Alamat', 30, y);
  doc.text(`: ${alamat1}`, 70, y);
  
  y += 10;
  
  const orangTua2 = data.namaOrangTua2 || data.namaIbu || '-';
  const umur2 = data.umurOrangTua2 || data.umurIbu || '-';
  const pekerjaan2 = data.pekerjaanOrangTua2 || data.pekerjaanIbu || 'Ibu Rumah Tangga';
  
  doc.setFont('helvetica', 'bold');
  doc.text('II. Nama Ibu', 25, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${orangTua2}`, 70, y);
  y += 6;
  doc.text('Umur', 30, y);
  doc.text(`: ${umur2} Tahun`, 70, y);
  y += 6;
  doc.text('Pekerjaan', 30, y);
  doc.text(`: ${pekerjaan2}`, 70, y);
  
  y += 10;
  doc.text('Sesuai pengamatan kami, keluarga tersebut tidak dapat memenuhi', 20, y);
  doc.text('kehidupan sehari-hari. Oleh karena itu, dimohon bantuan dari pihak terkait.', 20, y + 6);
  
  y += 15;
  const keperluan = data.keperluan || data.purpose || 'mendapatkan bantuan';
  doc.text(`Demikian Surat Keterangan Tidak Mampu ini dibuat untuk ${keperluan}.`, 20, y);
  
  addFooter(doc, data, y + 15);

  return doc;
}


export function generateSuratLainnya(data: any) {
  const doc = new jsPDF();
  const nomorSurat = `${Math.floor(Math.random() * 1000)}/SK-LAIN/${new Date().getFullYear()}`;
  
  addHeader(doc, data.title || 'SURAT KETERANGAN', nomorSurat);

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const title = (data.title || 'SURAT KETERANGAN').toUpperCase();
  doc.text(title, 105, 50, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor: ${nomorSurat}`, 105, 57, { align: 'center' });
  
  doc.setLineWidth(0.3);
  doc.line(80, 59, 130, 59);

  // Content
  doc.setFontSize(11);
  let y = 70;
  
  doc.text('Yang bertanda tangan di bawah ini:', 20, y);
  
  y += 10;
  doc.text('Nama', 30, y);
  doc.text(`: ${data.ketuaRT || 'Ketua RT'}`, 70, y);
  y += 6;
  doc.text('Jabatan', 30, y);
  doc.text(`: Ketua RT ${data.rt || '001'} / RW ${data.rw || '001'}`, 70, y);
  
  y += 10;
  doc.text('Dengan ini menerangkan bahwa:', 20, y);
  
  y += 10;
  doc.text('Nama', 30, y);
  doc.text(`: ${data.nama || '-'}`, 70, y);
  y += 6;
  doc.text('NIK', 30, y);
  doc.text(`: ${data.nik || '-'}`, 70, y);
  y += 6;
  doc.text('Alamat', 30, y);
  doc.text(`: ${data.alamat || '-'}`, 70, y);
  
  y += 10;
  
  const keperluan = data.keperluan || data.purpose || '-';
  const keperluanLines = doc.splitTextToSize(keperluan, 170);
  keperluanLines.forEach((line: string) => {
    doc.text(line, 20, y);
    y += 6;
  });
  
  y += 8;
  doc.text('Demikian surat keterangan ini dibuat untuk dapat dipergunakan', 20, y);
  doc.text('sebagaimana mestinya.', 20, y + 6);
  
  addFooter(doc, data, y + 20);

  return doc;
}

export function generateLaporanKeuangan(data: {
  startDate: Date;
  endDate: Date;
  transactions: any[];
  saldoAwal: number;
}) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('LAPORAN KEUANGAN RT', 105, 20, { align: 'center' });

  doc.setFontSize(11);
  doc.text(
    `Periode: ${dayjs(data.startDate).format('DD MMMM YYYY')} - ${dayjs(data.endDate).format('DD MMMM YYYY')}`,
    105,
    30,
    { align: 'center' }
  );

  doc.setFontSize(12);
  doc.text(`Saldo Awal: Rp ${data.saldoAwal.toLocaleString('id-ID')}`, 20, 45);

  const totalPemasukan = data.transactions
    .filter((t) => t.type === 'PEMASUKAN')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPengeluaran = data.transactions
    .filter((t) => t.type === 'PENGELUARAN')
    .reduce((sum, t) => sum + t.amount, 0);

  const saldoAkhir = data.saldoAwal + totalPemasukan - totalPengeluaran;

  autoTable(doc, {
    startY: 55,
    head: [['Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Jumlah']],
    body: data.transactions.map((t) => [
      dayjs(t.date).format('DD/MM/YYYY'),
      t.type,
      t.category,
      t.description,
      `Rp ${t.amount.toLocaleString('id-ID')}`,
    ]),
    foot: [
      ['', '', '', 'Total Pemasukan', `Rp ${totalPemasukan.toLocaleString('id-ID')}`],
      ['', '', '', 'Total Pengeluaran', `Rp ${totalPengeluaran.toLocaleString('id-ID')}`],
      ['', '', '', 'Saldo Akhir', `Rp ${saldoAkhir.toLocaleString('id-ID')}`],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 66, 66] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 55;

  doc.text(`${dayjs().format('DD MMMM YYYY')}`, 150, finalY + 20);
  doc.text('Bendahara RT', 155, finalY + 27);
  doc.text('(.....................)', 150, finalY + 50);

  return doc;
}
