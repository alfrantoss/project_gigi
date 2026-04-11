import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

export function generateSuratDomisili(data: any) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('SURAT KETERANGAN DOMISILI', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Nomor: ${data.nomor || '-'}`, 105, 30, { align: 'center' });

  doc.setFontSize(12);
  doc.text('Yang bertanda tangan di bawah ini:', 20, 50);

  doc.setFontSize(11);
  doc.text(`Nama: ${data.ketuaRT || 'Ketua RT'}`, 30, 60);
  doc.text(`Jabatan: Ketua RT ${data.rt || '001'} / RW ${data.rw || '001'}`, 30, 67);

  doc.text('Menerangkan bahwa:', 20, 80);
  doc.text(`Nama: ${data.nama}`, 30, 90);
  doc.text(`NIK: ${data.nik}`, 30, 97);
  doc.text(`Tempat/Tgl Lahir: ${data.tempatLahir || '-'}, ${data.tanggalLahir || '-'}`, 30, 104);
  doc.text(`Pekerjaan: ${data.pekerjaan || '-'}`, 30, 111);
  doc.text(`Alamat: ${data.alamat}`, 30, 118);

  doc.text('Adalah benar berdomisili di wilayah RT kami dan merupakan warga yang baik.', 20, 130);

  doc.text('Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.', 20, 145);

  doc.text(`${data.kelurahan || 'Sukamaju'}, ${dayjs().format('DD MMMM YYYY')}`, 130, 165);
  doc.text('Ketua RT', 145, 172);

  doc.text(`${data.ketuaRT || '(...................)'}`, 140, 200);

  return doc;
}

export function generateSuratPengantar(data: any) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('SURAT PENGANTAR', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Nomor: ${data.nomor || '-'}`, 105, 30, { align: 'center' });

  doc.setFontSize(12);
  doc.text('Yang bertanda tangan di bawah ini:', 20, 50);

  doc.setFontSize(11);
  doc.text(`Nama: ${data.ketuaRT || 'Ketua RT'}`, 30, 60);
  doc.text(`Jabatan: Ketua RT ${data.rt || '001'} / RW ${data.rw || '001'}`, 30, 67);

  doc.text('Menerangkan bahwa:', 20, 80);
  doc.text(`Nama: ${data.nama}`, 30, 90);
  doc.text(`NIK: ${data.nik}`, 30, 97);
  doc.text(`Alamat: ${data.alamat}`, 30, 104);

  doc.text(`Keperluan: ${data.keperluan}`, 20, 120);

  doc.text('Demikian surat pengantar ini dibuat untuk dapat dipergunakan sebagaimana mestinya.', 20, 135);

  doc.text(`${data.kelurahan || 'Sukamaju'}, ${dayjs().format('DD MMMM YYYY')}`, 130, 155);
  doc.text('Ketua RT', 145, 162);

  doc.text(`${data.ketuaRT || '(...................)'}`, 140, 190);

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
