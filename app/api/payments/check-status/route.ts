import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification, sendWhatsApp } from "@/utils/notification";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId } = body;

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
      return NextResponse.json({ error: "Pembayaran tidak ditemukan" }, { status: 404 });
    }

    // Check if payment belongs to current user (for WARGA role)
    if (session.user.role === "WARGA" && payment.userId !== session.user.id) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    // Query Midtrans for transaction status
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json(
        { error: "Server key Midtrans belum dikonfigurasi" },
        { status: 500 },
      );
    }

    try {
      const midtransResponse = await fetch(
        `https://app.sandbox.midtrans.com/v2/${orderId}/status`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${Buffer.from(serverKey + ":").toString("base64")}`,
          },
        },
      );

      const midtransData = await midtransResponse.json();
      const transactionStatus = midtransData.transaction_status;

      console.log("Midtrans status check:", { orderId, transactionStatus });

      // If status is settlement and payment is still PENDING, update it
      if (
        (transactionStatus === "settlement" ||
          transactionStatus === "capture") &&
        payment.status === "PENDING"
      ) {
        // Verify fraud status if exists
        if (midtransData.fraud_status === "deny") {
          return NextResponse.json({
            success: false,
            status: "FAILED",
            message: "Pembayaran ditandai sebagai fraud / penipuan",
          });
        }

        // Update payment status
        const updatedPayment = await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "PAID",
            transactionId: midtransData.transaction_id,
            paymentMethod: midtransData.payment_type,
            paidAt: new Date(),
          },
        });

        // Update warga
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
            createdBy: session.user.id,
          },
        });

        // Create notification for user
        await createNotification(
          payment.userId,
          "Pembayaran Berhasil",
          `Pembayaran iuran ${payment.period} sebesar Rp ${payment.amount.toLocaleString("id-ID")} telah diterima.`,
          "PAYMENT_SUCCESS",
          payment.id,
        );

        // Send WhatsApp notification
        if (payment.user.phone) {
          const waMessage = `✅ *Pembayaran Berhasil*

Halo *${payment.user.name}*,

Pembayaran iuran RT Anda telah berhasil dikonfirmasi:

📅 Periode: ${payment.period}
💰 Nominal: Rp ${payment.amount.toLocaleString("id-ID")}
🕐 Waktu: ${new Date().toLocaleString("id-ID")}
📝 ID Transaksi: ${midtransData.transaction_id}

Terima kasih atas pembayaran tepat waktu Anda! 🙏

_Sistem Manajemen Warga RT 001 RW 016_`;

          await sendWhatsApp(payment.user.phone, waMessage);
        }

        return NextResponse.json({
          success: true,
          status: "PAID",
          message: "Status pembayaran berhasil diperbarui",
          payment: updatedPayment,
        });
      } else if (transactionStatus === "pending") {
        return NextResponse.json({
          success: false,
          status: "PENDING",
          message: "Pembayaran masih tertunda",
        });
      } else if (
        transactionStatus === "cancel" ||
        transactionStatus === "deny" ||
        transactionStatus === "expire"
      ) {
        // Update payment to FAILED
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "FAILED",
          },
        });

        return NextResponse.json({
          success: false,
          status: "FAILED",
          message: "Pembayaran gagal atau kedaluwarsa",
        });
      }

      return NextResponse.json({
        success: true,
        status: payment.status,
        message: "Status pembayaran berhasil diperiksa",
      });
    } catch (midtransError: any) {
      console.error("Midtrans status check error:", midtransError);
      // Return current payment status from database if Midtrans check fails
      return NextResponse.json({
        success: true,
        status: payment.status,
        message: "Tidak dapat memverifikasi dengan Midtrans, mengembalikan status dari database",
      });
    }
  } catch (error: any) {
    console.error("Check status error:", error);
    return NextResponse.json(
      {
        error: "Gagal memeriksa status pembayaran",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
