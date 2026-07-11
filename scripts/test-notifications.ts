import { PrismaClient } from '@prisma/client';
import { createNotification } from '../utils/notification';

const prisma = new PrismaClient();

async function testNotifications() {
  try {
    console.log('🧪 Testing notification system...\n');

    // Get admin and warga users
    const admin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    const warga = await prisma.user.findFirst({
      where: { role: 'WARGA' }
    });

    if (!admin || !warga) {
      console.error('❌ Admin or warga user not found');
      return;
    }

    console.log(`👤 Admin: ${admin.name}`);
    console.log(`👤 Warga: ${warga.name}\n`);

    // Test 1: SURAT_SUBMITTED notification to admin
    console.log('📝 Testing SURAT_SUBMITTED notification...');
    const suratNotification = await createNotification(
      admin.id,
      '📄 Pengajuan Surat Baru',
      `${warga.name} mengajukan Surat Keterangan Domisili. Silakan tinjau dan setujui.`,
      'SURAT_SUBMITTED',
      'dummy-surat-id'
    );

    if (suratNotification) {
      console.log('✅ SURAT_SUBMITTED notification created successfully');
    } else {
      console.log('❌ Failed to create SURAT_SUBMITTED notification');
    }

    // Test 2: PAYMENT_SUCCESS notification to admin  
    console.log('\n💰 Testing payment notification to admin...');
    const paymentNotification = await createNotification(
      admin.id,
      '💰 Pembayaran Diterima',
      `${warga.name} telah melakukan pembayaran iuran Juli 2026 sebesar Rp 150.000.`,
      'SYSTEM',
      'dummy-payment-id'
    );

    if (paymentNotification) {
      console.log('✅ Payment notification to admin created successfully');
    } else {
      console.log('❌ Failed to create payment notification to admin');
    }

    // Test 3: PAYMENT_SUCCESS notification to warga
    console.log('\n💳 Testing PAYMENT_SUCCESS notification to warga...');
    const userPaymentNotification = await createNotification(
      warga.id,
      'Pembayaran Berhasil',
      'Pembayaran iuran Juli 2026 sebesar Rp 150.000 telah diterima.',
      'PAYMENT_SUCCESS',
      'dummy-payment-id'
    );

    if (userPaymentNotification) {
      console.log('✅ PAYMENT_SUCCESS notification to warga created successfully');
    } else {
      console.log('❌ Failed to create PAYMENT_SUCCESS notification to warga');
    }

    // Check notification counts
    console.log('\n📊 Checking notification counts...');
    const adminNotifCount = await prisma.notification.count({
      where: { userId: admin.id, isRead: false }
    });
    
    const wargaNotifCount = await prisma.notification.count({
      where: { userId: warga.id, isRead: false }
    });

    console.log(`📢 Admin unread notifications: ${adminNotifCount}`);
    console.log(`📢 Warga unread notifications: ${wargaNotifCount}`);

    // List recent notifications
    console.log('\n📋 Recent notifications:');
    const recentNotifications = await prisma.notification.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, role: true }
        }
      }
    });

    recentNotifications.forEach((notif, i) => {
      const status = notif.isRead ? '✅' : '🔔';
      console.log(`${i + 1}. ${status} [${notif.type}] ${notif.title}`);
      console.log(`   → ${notif.user.name} (${notif.user.role})`);
      console.log(`   → ${notif.message.substring(0, 60)}...`);
      console.log(`   → ${notif.createdAt.toLocaleString('id-ID')}\n`);
    });

    console.log('🎉 Notification test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testNotifications();