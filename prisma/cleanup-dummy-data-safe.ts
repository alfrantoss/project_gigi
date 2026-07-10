/**
 * Script untuk menghapus data dummy warga (WITH CONFIRMATION)
 * Hanya menyisakan: Admin, Ketua RT, Bendahara, dan 1 Warga
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    })
  );
}

async function cleanupDummyData() {
  try {
    console.log('🧹 Cleanup Dummy Data - WITH CONFIRMATION\n');
    console.log('⚠️  PERINGATAN: Script ini akan menghapus data secara PERMANEN!\n');

    // Email yang akan dipertahankan
    const keepEmails = [
      'admin@rt.com',        // Super Admin
      'ketua@rt.com',        // Ketua RT
      'bendahara@rt.com',    // Bendahara
      'warga11@rt.com',      // 1 Warga untuk testing
    ];

    console.log('✅ Akun yang AKAN DIPERTAHANKAN:');
    keepEmails.forEach((email, index) => {
      console.log(`   ${index + 1}. ${email}`);
    });
    console.log('');

    // Get users yang akan dihapus
    const usersToDelete = await prisma.user.findMany({
      where: {
        email: {
          notIn: keepEmails,
        },
      },
      select: {
        name: true,
        email: true,
        role: true,
      },
    });

    if (usersToDelete.length === 0) {
      console.log('✅ Tidak ada data dummy yang perlu dihapus.');
      return;
    }

    console.log(`❌ Akun yang AKAN DIHAPUS (${usersToDelete.length} user):`);
    usersToDelete.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });
    console.log('');

    // Ask for confirmation
    const answer = await askQuestion(
      '⚠️  Apakah Anda yakin ingin menghapus semua data di atas? (ketik "YES" untuk konfirmasi): '
    );

    if (answer.trim().toUpperCase() !== 'YES') {
      console.log('\n❌ Pembersihan dibatalkan. Tidak ada data yang dihapus.');
      return;
    }

    console.log('\n🗑️  Memulai proses penghapusan...\n');

    // Get full users data untuk delete
    const usersToDeleteFull = await prisma.user.findMany({
      where: {
        email: {
          notIn: keepEmails,
        },
      },
      include: {
        warga: true,
      },
    });

    let deletedCount = 0;

    // Delete dalam urutan yang benar untuk menghindari foreign key constraint
    for (const user of usersToDeleteFull) {
      console.log(`   Menghapus: ${user.name} (${user.email})`);

      // 1. Delete payments terkait user ini
      const paymentsDeleted = await prisma.payment.deleteMany({
        where: { userId: user.id },
      });

      // 2. Delete transactions terkait user ini
      const transactionsDeleted = await prisma.transaction.deleteMany({
        where: { createdBy: user.id },
      });

      // 3. Delete surat terkait user ini
      const suratDeleted = await prisma.surat.deleteMany({
        where: { userId: user.id },
      });

      // 4. Delete notifications terkait user ini
      const notificationsDeleted = await prisma.notification.deleteMany({
        where: { userId: user.id },
      });

      // 5. Delete activities created by user ini
      const activitiesDeleted = await prisma.activity.deleteMany({
        where: { createdBy: user.id },
      });

      // 6. Delete announcements created by user ini
      const announcementsDeleted = await prisma.announcement.deleteMany({
        where: { createdBy: user.id },
      });

      // 7. Delete warga data
      if (user.warga) {
        await prisma.warga.delete({
          where: { id: user.warga.id },
        });
      }

      // 8. Finally, delete user
      await prisma.user.delete({
        where: { id: user.id },
      });

      deletedCount++;
      console.log(`      └─ Berhasil dihapus ✓\n`);
    }

    console.log(`✅ Berhasil menghapus ${deletedCount} user dan semua data terkaitnya!\n`);

    // Show remaining users
    const remainingUsers = await prisma.user.findMany({
      select: {
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        role: 'asc',
      },
    });

    console.log('📋 Akun yang tersisa di sistem:');
    remainingUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDummyData()
  .then(() => {
    console.log('✅ Script selesai dijalankan.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script gagal:', error);
    process.exit(1);
  });
