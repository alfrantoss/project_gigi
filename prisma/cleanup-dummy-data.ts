/**
 * Script untuk menghapus data dummy warga
 * Hanya menyisakan: Admin, Ketua RT, Bendahara, dan 1 Warga
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDummyData() {
  try {
    console.log('🧹 Starting cleanup dummy data...\n');

    // Email yang akan dipertahankan
    const keepEmails = [
      'admin@rt.com',        // Super Admin
      'ketua@rt.com',        // Ketua RT
      'bendahara@rt.com',    // Bendahara
      'warga11@rt.com',      // 1 Warga untuk testing
    ];

    console.log('📌 Akun yang akan dipertahankan:');
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
      include: {
        warga: true,
      },
    });

    console.log(`🗑️  Total user yang akan dihapus: ${usersToDelete.length}\n`);

    if (usersToDelete.length === 0) {
      console.log('✅ Tidak ada data dummy yang perlu dihapus.');
      return;
    }

    // Delete dalam urutan yang benar untuk menghindari foreign key constraint
    for (const user of usersToDelete) {
      console.log(`   Menghapus: ${user.name} (${user.email})`);

      // 1. Delete payments terkait user ini
      const paymentsDeleted = await prisma.payment.deleteMany({
        where: { userId: user.id },
      });
      console.log(`      ├─ Payments: ${paymentsDeleted.count}`);

      // 2. Delete transactions terkait user ini
      const transactionsDeleted = await prisma.transaction.deleteMany({
        where: { createdBy: user.id },
      });
      console.log(`      ├─ Transactions: ${transactionsDeleted.count}`);

      // 3. Delete surat terkait user ini
      const suratDeleted = await prisma.surat.deleteMany({
        where: { userId: user.id },
      });
      console.log(`      ├─ Surat: ${suratDeleted.count}`);

      // 4. Delete notifications terkait user ini
      const notificationsDeleted = await prisma.notification.deleteMany({
        where: { userId: user.id },
      });
      console.log(`      ├─ Notifications: ${notificationsDeleted.count}`);

      // 5. Delete activities created by user ini
      const activitiesDeleted = await prisma.activity.deleteMany({
        where: { createdBy: user.id },
      });
      console.log(`      ├─ Activities: ${activitiesDeleted.count}`);

      // 6. Delete announcements created by user ini
      const announcementsDeleted = await prisma.announcement.deleteMany({
        where: { createdBy: user.id },
      });
      console.log(`      ├─ Announcements: ${announcementsDeleted.count}`);

      // 7. Delete warga data
      if (user.warga) {
        await prisma.warga.delete({
          where: { id: user.warga.id },
        });
        console.log(`      ├─ Warga data: deleted`);
      }

      // 8. Finally, delete user
      await prisma.user.delete({
        where: { id: user.id },
      });
      console.log(`      └─ User: deleted ✓\n`);
    }

    console.log('✅ Cleanup selesai!\n');

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

    console.log('📋 Akun yang tersisa:');
    remainingUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });
    console.log('');

    // Show statistics
    const stats = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    console.log('📊 Statistik per role:');
    stats.forEach((stat) => {
      console.log(`   ${stat.role}: ${stat._count} user`);
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
