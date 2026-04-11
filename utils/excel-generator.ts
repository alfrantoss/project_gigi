import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

export function generateTransactionExcel(transactions: any[]) {
  const data = transactions.map((t) => ({
    Tanggal: dayjs(t.date).format('DD/MM/YYYY'),
    Jenis: t.type,
    Kategori: t.category,
    Keterangan: t.description,
    Jumlah: t.amount,
    Pembuat: t.user?.name || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaksi');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function generateWargaExcel(warga: any[]) {
  const data = warga.map((w) => ({
    Nama: w.user.name,
    NIK: w.nik,
    'Nomor Rumah': w.nomorRumah,
    Alamat: w.alamat,
    RT: w.rt,
    RW: w.rw,
    Kelurahan: w.kelurahan,
    Kecamatan: w.kecamatan,
    'Status Perkawinan': w.statusPerkawinan,
    Pekerjaan: w.pekerjaan,
    Telepon: w.user.phone || '-',
    Email: w.user.email,
    'Iuran Bulanan': w.monthlyFee,
    'Total Dibayar': w.totalPaid,
    'Total Hutang': w.totalDebt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Warga');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function generatePaymentExcel(payments: any[]) {
  const data = payments.map((p) => ({
    Nama: p.user.name,
    Periode: p.period,
    Jumlah: p.amount,
    Status: p.status,
    'Metode Pembayaran': p.paymentMethod || '-',
    'Tanggal Jatuh Tempo': dayjs(p.dueDate).format('DD/MM/YYYY'),
    'Tanggal Bayar': p.paidAt ? dayjs(p.paidAt).format('DD/MM/YYYY') : '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pembayaran');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function parseWargaExcel(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  return data.map((row: any) => ({
    name: row['Nama'],
    nik: row['NIK'],
    nomorRumah: row['Nomor Rumah'],
    alamat: row['Alamat'],
    rt: row['RT'] || '001',
    rw: row['RW'] || '001',
    kelurahan: row['Kelurahan'],
    kecamatan: row['Kecamatan'],
    statusPerkawinan: row['Status Perkawinan'],
    pekerjaan: row['Pekerjaan'],
    phone: row['Telepon'],
    email: row['Email'],
    monthlyFee: row['Iuran Bulanan'] || 50000,
  }));
}
