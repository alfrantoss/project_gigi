import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendPaymentReminder } from '@/utils/notification';

/**
 * API untuk mengirim reminder pembayaran ke warga yang memiliki tagihan pending/overdue
 * Hanya bisa diakses oleh SUPER_ADMIN dan BENDAHARA
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Autentikasi diperlukan' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'BENDAHARA'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    // Get all users with pending or overdue payments
    const usersWithDebt = await prisma.user.findMany({
      where: {
        payments: {
          some: {
            status: {
              in: ['PENDING', 'OVERDUE'],
            },
          },
        },
        isActive: true,
      },
      include: {
        payments: {
          where: {
            status: {
              in: ['PENDING', 'OVERDUE'],
            },
          },
        },
      },
    });

    if (usersWithDebt.length === 0) {
      return NextResponse.json({
        message: 'Tidak ada warga dengan tagihan pending',
        sent: 0,
      });
    }

    let successCount = 0;
    let failCount = 0;

    // Send reminders to each user
    for (const user of usersWithDebt) {
      const result = await sendPaymentReminder(user.id);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      message: 'Reminder pembayaran berhasil dikirim',
      total: usersWithDebt.length,
      success: successCount,
      failed: failCount,
    });
  } catch (error: any) {
    console.error('Send payment reminders error:', error);
    return NextResponse.json(
      {
        error: 'Gagal mengirim reminder pembayaran',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
