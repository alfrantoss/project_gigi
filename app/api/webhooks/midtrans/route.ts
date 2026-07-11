import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification, sendWhatsApp } from "@/utils/notification";

export async function POST(request: NextRequest) {
  try {
    const notification = await request.json();

    console.log("Midtrans Webhook Notification:", notification);

    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID tidak disediakan" },
        { status: 400 },
      );
    }

    // Find payment by midtrans order ID
    const payment = await prisma.payment.findFirst({
      where: { midtransOrderId: orderId },
      include: {
        user: true,
      },
    });

    if (!payment) {
      console.error("Payment not found for order:", orderId);
      return NextResponse.json({ error: "Pembayaran tidak ditemukan" }, { status: 404 });
    }

    // Determine payment status
    let newStatus: "PENDING" | "PAID" | "FAILED" = "PENDING";
    let shouldUpdateWarga = false;

    if (transactionStatus === "settlement" || transactionStatus === "capture") {
      if (
        notification.fraud_status === "accept" ||
        !notification.fraud_status
      ) {
        newStatus = "PAID";
        shouldUpdateWarga = true;
      }
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      newStatus = "FAILED";
    }

    // Update payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        transactionId: notification.transaction_id,
        paymentMethod: notification.payment_type,
        paidAt: newStatus === "PAID" ? new Date() : null,
      },
    });

    // Update warga if payment is successful
    if (shouldUpdateWarga) {
      const warga = await prisma.warga.findUnique({
        where: { userId: payment.userId },
      });

      if (warga) {
        await prisma.warga.update({
          where: { id: warga.id },
          data: {
            totalPaid: warga.totalPaid + payment.amount,
            totalDebt: Math.max(0, warga.totalDebt - payment.amount),
            lastPayment: new Date(),
          },
        });
      }

      // Create transaction record
      await prisma.transaction.create({
        data: {
          type: "PEMASUKAN",
          category: "Iuran Bulanan",
          description: `Pembayaran iuran ${payment.period} - ${payment.user.name}`,
          amount: payment.amount,
          createdBy: payment.userId,
        },
      });

      // Send notification to user
      await createNotification(
        payment.userId,
        "Pembayaran Berhasil",
        `Pembayaran iuran ${payment.period} sebesar Rp ${payment.amount.toLocaleString("id-ID")} telah diterima.`,
        "PAYMENT_SUCCESS",
        payment.id,
      );

      // Send notification to all admins about successful payment
      try {
        const admins = await prisma.user.findMany({
          where: {
            role: { in: ['SUPER_ADMIN', 'KETUA_RT', 'BENDAHARA'] },
            isActive: true,
          },
        });

        for (const admin of admins) {
          await createNotification(
            admin.id,
            "💰 Pembayaran Diterima",
            `${payment.user.name} telah melakukan pembayaran iuran ${payment.period} sebesar Rp ${payment.amount.toLocaleString("id-ID")}.`,
            "SYSTEM",
            payment.id
          );
        }

        console.log(`✅ Admin notifications sent for payment from ${payment.user.name}`);
      } catch (adminNotificationError) {
        console.error('Failed to send admin notifications for payment:', adminNotificationError);
        // Don't fail the main request if notification fails
      }

      // Send WhatsApp notification
      if (payment.user.phone) {
        const waMessage = `✅ *Pembayaran Berhasil*

Halo *${payment.user.name}*,

Pembayaran iuran RT Anda telah berhasil dikonfirmasi:

📅 Periode: ${payment.period}
💰 Nominal: Rp ${payment.amount.toLocaleString("id-ID")}
🕐 Waktu: ${new Date().toLocaleString("id-ID")}
📝 ID Transaksi: ${notification.transaction_id}

Terima kasih atas pembayaran tepat waktu Anda! 🙏

_Sistem Manajemen Warga RT 001 RW 016_`;

        await sendWhatsApp(payment.user.phone, waMessage);
      }
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
    });
  } catch (error) {
    console.error("Midtrans webhook error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses webhook" },
      { status: 500 },
    );
  }
}
