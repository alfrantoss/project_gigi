import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, transactionStatus } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID not provided" },
        { status: 400 },
      );
    }

    console.log("Processing payment:", { orderId, transactionStatus });

    // Find payment by midtrans order ID
    const payment = await prisma.payment.findFirst({
      where: { midtransOrderId: orderId },
      include: {
        user: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Pembayaran tidak ditemukan", success: false },
        { status: 404 },
      );
    }

    // Check if payment belongs to current user (for WARGA role)
    if (session.user.role === "WARGA" && payment.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update payment status based on transaction status
    let newStatus: "PENDING" | "PAID" | "FAILED" = "PENDING";
    let shouldUpdateWarga = false;

    if (transactionStatus === "settlement" || transactionStatus === "capture") {
      newStatus = "PAID";
      shouldUpdateWarga = true;
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      newStatus = "FAILED";
    }

    // Update payment
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        transactionId: `${orderId}-settled`,
        paymentMethod: "ONLINE_TRANSFER",
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
          createdBy: session.user.id,
        },
      });
    }

    return NextResponse.json({
      success: newStatus === "PAID",
      status: newStatus,
      message:
        newStatus === "PAID"
          ? "Pembayaran berhasil diproses"
          : "Pembayaran gagal",
      payment: updatedPayment,
    });
  } catch (error: any) {
    console.error("Process payment error:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat memproses pembayaran",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
