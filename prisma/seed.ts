import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Realistic Indonesian data
const firstNames = [
  'Budi', 'Ahmad', 'Siti', 'Rini', 'Wayan', 'Bambang', 'Dwi', 'Eka', 'Farah', 'Gita',
  'Hendra', 'Indah', 'Joko', 'Kusuma', 'Lestari', 'Mohamad', 'Nur', 'Oka', 'Putri', 'Rudi',
  'Sinta', 'Toni', 'Umar', 'Vina', 'Wahyu', 'Xenia', 'Yanti', 'Zainab', 'Arif', 'Bella',
  'Citra', 'Dani', 'Eka', 'Fitri', 'Gatot', 'Halim', 'Intan', 'Joko', 'Karim', 'Lina',
  'Mardi', 'Nadia', 'Oky', 'Prima', 'Qori', 'Rado', 'Suci', 'Tarno', 'Uli', 'Verry',
];

const lastNames = [
  'Santoso', 'Hidayat', 'Sutrisno', 'Pratama', 'Wijaya', 'Kusuma', 'Rahmad', 'Setiawan',
  'Rahmat', 'Gunawan', 'Hartono', 'Ismanto', 'Jayadhi', 'Kartono', 'Lestari', 'Mantra',
  'Nugroho', 'Oktavian', 'Putra', 'Raharjito', 'Suryanto', 'Trisno', 'Udanarta', 'Vidianto',
];

const jobs = [
  'Karyawan Swasta', 'Ibu Rumah Tangga', 'Wiraswasta', 'Pegawai Negeri', 'Pensiunan',
  'Buruh Pabrik', 'Tukang Bangunan', 'Pedagang Kaki Lima', 'Guru', 'Perawat', 'Ojek Online',
];

const statuses = ['Kawin', 'Belum Kawin', 'Cerai Hidup'];

function generateNIK(index: number): string {
  // Format: KKDDBBTTGG
  // KK = Kode Kabupaten Bekasi (3275)
  // DD = Kode Desa
  // BBTTGG = Tanggal Lahir
  const kabupaten = '327506'; // Bekasi Timur
  const birthYear = Math.floor(Math.random() * 50) + 60; // 60-110 for age range
  const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  const counter = String(index).padStart(4, '0');

  return `${kabupaten}${birthDay}${birthMonth}${birthYear}${counter}`;
}

function generatePhone(): string {
  const operators = ['0812', '0813', '0814', '0821', '0822', '0823'];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  const number = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
  return `${operator}${number}`;
}

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Keep admin users
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@rt.com' },
    update: {},
    create: {
      email: 'admin@rt.com',
      password: hashedPassword,
      name: 'Super Admin',
      phone: '081234567890',
      role: 'SUPER_ADMIN',
    },
  });

  const ketuaRT = await prisma.user.upsert({
    where: { email: 'ketua@rt.com' },
    update: {},
    create: {
      email: 'ketua@rt.com',
      password: hashedPassword,
      name: 'Bapak Ketua RT',
      phone: '081234567891',
      role: 'KETUA_RT',
    },
  });

  const bendahara = await prisma.user.upsert({
    where: { email: 'bendahara@rt.com' },
    update: {},
    create: {
      email: 'bendahara@rt.com',
      password: hashedPassword,
      name: 'Ibu Bendahara',
      phone: '081234567892',
      role: 'BENDAHARA',
    },
  });

  // Delete all existing warga data and all related records in correct order
  // Delete all warga-related data
  const existingWargaUsers = await prisma.user.findMany({ where: { role: 'WARGA' } });
  const wargaUserIds = existingWargaUsers.map(u => u.id);
  
  // Delete in correct order to avoid foreign key constraints
  await prisma.notification.deleteMany({ where: { userId: { in: wargaUserIds } } });
  await prisma.auditLog.deleteMany({ where: { userId: { in: wargaUserIds } } });
  await prisma.payment.deleteMany({ where: { userId: { in: wargaUserIds } } });
  await prisma.surat.deleteMany({ where: { userId: { in: wargaUserIds } } });
  await prisma.transaction.deleteMany({ where: { createdBy: { in: wargaUserIds } } });
  await prisma.activity.deleteMany({ where: { createdBy: { in: wargaUserIds } } });
  await prisma.announcement.deleteMany({ where: { createdBy: { in: wargaUserIds } } });
  await prisma.warga.deleteMany({ where: { userId: { in: wargaUserIds } } });
  
  // Now delete the users
  for (const userId of wargaUserIds) {
    await prisma.user.delete({ where: { id: userId } });
  }

  // Create 120 warga (10 streets × 12 house numbers)
  const wargaUsers = [];
  let userIndex = 0;

  for (let street = 1; street <= 10; street++) {
    for (let houseNum = 1; houseNum <= 12; houseNum++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const fullName = `${firstName} ${lastName}`;
      const email = `warga${street}${houseNum}@rt.com`;
      const nomorRumah = String(houseNum).padStart(2, '0');
      const nik = generateNIK(userIndex);
      const phone = generatePhone();
      const job = jobs[Math.floor(Math.random() * jobs.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const totalPaid = Math.floor(Math.random() * 500000 / 50000) * 50000;
      const totalDebt = Math.random() > 0.8 ? 50000 * Math.floor(Math.random() * 3 + 1) : 0;

      const wargaUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: fullName,
          phone,
          role: 'WARGA',
        },
      });

      await prisma.warga.create({
        data: {
          userId: wargaUser.id,
          nik,
          nomorRumah,
          alamat: `Jl. Pesona Gading ${street}, Cluster Pesona Gading Cibitung 1, Bekasi`,
          rt: '001',
          rw: '016',
          kelurahan: 'Bekasi Timur',
          kecamatan: 'Bekasi Timur',
          statusPerkawinan: status,
          pekerjaan: job,
          monthlyFee: 50000,
          totalPaid,
          totalDebt,
        },
      });

      wargaUsers.push(wargaUser);
      userIndex++;
    }
  }

  // Create sample transactions
  for (let i = 0; i < 5; i++) {
    await prisma.transaction.create({
      data: {
        type: 'PEMASUKAN',
        category: 'Iuran Bulanan',
        description: `Iuran kas bulan ${new Date(2025, i, 1).toLocaleString('id-ID', { month: 'long' })} 2025`,
        amount: 50000 * Math.floor(Math.random() * 80 + 40),
        date: new Date(2025, i, 10),
        createdBy: bendahara.id,
      },
    });

    if (i % 2 === 0) {
      await prisma.transaction.create({
        data: {
          type: 'PENGELUARAN',
          category: 'Kebersihan',
          description: 'Pembelian alat dan bahan kebersihan',
          amount: Math.floor(Math.random() * 200000 + 100000),
          date: new Date(2025, i, 15),
          createdBy: bendahara.id,
        },
      });
    }
  }

  // Create sample payments for random warga
  for (let i = 0; i < Math.min(30, wargaUsers.length); i++) {
    const randomWarga = wargaUsers[Math.floor(Math.random() * wargaUsers.length)];
    const months = ['2025-01', '2025-02'];
    const month = months[Math.floor(Math.random() * months.length)];
    const status = Math.random() > 0.3 ? 'PAID' : (Math.random() > 0.5 ? 'OVERDUE' : 'PENDING');

    await prisma.payment.create({
      data: {
        userId: randomWarga.id,
        amount: 50000,
        period: month,
        description: `Iuran kas RT bulan ${month} 2025`,
        status: status as any,
        paymentMethod: status === 'PAID' ? (Math.random() > 0.5 ? 'Transfer Bank' : 'Cash') : undefined,
        paidAt: status === 'PAID' ? new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]) - 1, Math.floor(Math.random() * 8) + 1) : undefined,
        dueDate: new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]) - 1, 10),
      },
    });
  }

  // Create activities
  await prisma.activity.create({
    data: {
      title: 'Rapat RT Bulanan',
      description: 'Rapat evaluasi kegiatan RT dan pembahasan iuran bulan Maret',
      type: 'Rapat',
      location: 'Balai RT Pesona Gading',
      startDate: new Date('2025-03-15T19:00:00'),
      endDate: new Date('2025-03-15T21:00:00'),
      createdBy: ketuaRT.id,
    },
  });

  await prisma.activity.create({
    data: {
      title: 'Kerja Bakti Lingkungan',
      description: 'Kerja bakti membersihkan dan merapikan seluruh area Cluster Pesona Gading',
      type: 'Kerja Bakti',
      location: 'Seluruh area Cluster',
      startDate: new Date('2025-03-20T07:00:00'),
      endDate: new Date('2025-03-20T10:00:00'),
      createdBy: ketuaRT.id,
    },
  });

  await prisma.activity.create({
    data: {
      title: 'Sosialisasi Kesehatan',
      description: 'Mengundang tenaga medis untuk memberi sosialisasi kesehatan dan vaksinasi gratis',
      type: 'Penyuluhan',
      location: 'Balai RT Pesona Gading',
      startDate: new Date('2025-04-05T09:00:00'),
      endDate: new Date('2025-04-05T12:00:00'),
      createdBy: ketuaRT.id,
    },
  });

  // Create announcements
  await prisma.announcement.create({
    data: {
      title: 'Pengumuman: Batas Pembayaran Iuran Maret',
      content:
        'Kepada seluruh warga Cluster Pesona Gading Cibitung 1, batas pembayaran iuran kas RT bulan Maret 2025 adalah tanggal 10 Maret 2025. Mohon segera melakukan pembayaran melalui transfer bank atau tunai ke rumah bendahara.',
      priority: 'high',
      createdBy: ketuaRT.id,
      isActive: true,
    },
  });

  await prisma.announcement.create({
    data: {
      title: 'Jadwal Ronda Malam Minggu Ini',
      content:
        'Jadwal ronda malam minggu (06-12 Maret 2025): Senin (Jln. Pesona Gading 1-2), Selasa (Jln. Pesona Gading 3-4), Rabu (Jln. Pesona Gading 5-6), Kamis (Jln. Pesona Gading 7-8), Jumat (Jln. Pesona Gading 9-10).',
      priority: 'normal',
      createdBy: ketuaRT.id,
      isActive: true,
    },
  });

  await prisma.announcement.create({
    data: {
      title: 'Informasi: Perbaikan Jalan Pesona Gading',
      content:
        'Pemerintah Kota Bekasi akan melakukan perbaikan jalan di area Cluster Pesona Gading. Diperkirakan berlangsung selama 2 minggu mulai 15 Maret 2025. Mohon pengertian atas gangguan yang terjadi.',
      priority: 'normal',
      createdBy: ketuaRT.id,
      isActive: true,
    },
  });

  await prisma.setting.upsert({
    where: { key: 'rt_name' },
    update: { value: 'Cluster Pesona Gading Cibitung 1 - RT 001 / RW 016' },
    create: {
      key: 'rt_name',
      value: 'Cluster Pesona Gading Cibitung 1 - RT 001 / RW 016',
      description: 'Nama RT dan Cluster',
    },
  });

  await prisma.setting.upsert({
    where: { key: 'cluster_name' },
    update: { value: 'Cluster Pesona Gading Cibitung 1, Bekasi' },
    create: {
      key: 'cluster_name',
      value: 'Cluster Pesona Gading Cibitung 1, Bekasi',
      description: 'Nama lengkap cluster',
    },
  });

  await prisma.setting.upsert({
    where: { key: 'monthly_fee' },
    update: {},
    create: {
      key: 'monthly_fee',
      value: '50000',
      description: 'Iuran bulanan RT',
    },
  });

  await prisma.setting.upsert({
    where: { key: 'low_balance_alert' },
    update: {},
    create: {
      key: 'low_balance_alert',
      value: '1000000',
      description: 'Batas minimum saldo untuk alert',
    },
  });

  await prisma.setting.upsert({
    where: { key: 'wa_api_key' },
    update: {},
    create: {
      key: 'wa_api_key',
      value: '',
      description: 'API Key WhatsApp (Fonnte/Wablas)',
    },
  });

  await prisma.setting.upsert({
    where: { key: 'midtrans_server_key' },
    update: {},
    create: {
      key: 'midtrans_server_key',
      value: '',
      description: 'Midtrans Server Key',
    },
  });

  await prisma.setting.upsert({
    where: { key: 'midtrans_client_key' },
    update: {},
    create: {
      key: 'midtrans_client_key',
      value: '',
      description: 'Midtrans Client Key',
    },
  });

  console.log('Seeding completed successfully! 🎉');
  console.log('');
  console.log('📍 Cluster: Pesona Gading Cibitung 1, Bekasi');
  console.log('🏘️ RT 001 / RW 016');
  console.log('👥 Total Warga: 120 residents (10 streets × 12 houses)');
  console.log('');
  console.log('Login credentials:');
  console.log('✅ Super Admin: admin@rt.com / password123');
  console.log('✅ Ketua RT: ketua@rt.com / password123');
  console.log('✅ Bendahara: bendahara@rt.com / password123');
  console.log('');
  console.log('Sample Warga Accounts:');
  console.log('✅ warga11@rt.com / password123 (Jln. Pesona Gading 1, No. 01)');
  console.log('✅ warga112@rt.com / password123 (Jln. Pesona Gading 1, No. 12)');
  console.log('✅ warga101@rt.com / password123 (Jln. Pesona Gading 10, No. 01)');
  console.log('');
  console.log('Format: warga{street}{house}@rt.com');
  console.log('Example: warga36@rt.com = Jln. Pesona Gading 3, No. 06');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
