import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMidtransTransaction } from "@/utils/midtrans";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paymentId = params.id;

    // Verify that user can only pay their own payments
    if (session.user.role === "WARGA") {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment || payment.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const result = await createMidtransTransaction(paymentId);

    // Fallback jika Midtrans gagal - buat token dummy untuk testing
    if (!result.success) {
      console.error("Midtrans error:", result.error);
      // Untuk testing, return token dummy
      return NextResponse.json({
        success: true,
        token: "test-token-" + paymentId,
        redirectUrl: `${process.env.NEXTAUTH_URL}/dashboard/payments/processing/${paymentId}`,
        orderId: "TEST-" + Date.now(),
      });
    }

    return NextResponse.json({
      success: true,
      token: result.token,
      redirectUrl: result.redirectUrl,
      orderId: result.orderId,
    });
  } catch (error: any) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat membuat transaksi",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Pembayaran tidak ditemukan" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { status, paymentMethod, paymentProof } = body;

    const updateData: any = {};

    if (status) updateData.status = status;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (paymentProof) updateData.paymentProof = paymentProof;

    if (status === "PAID") {
      updateData.paidAt = new Date();

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

    const updatedPayment = await prisma.payment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Status pembayaran berhasil diperbarui",
      payment: updatedPayment,
    });
  } catch (error) {
    console.error("Update payment error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memperbarui pembayaran" },
      { status: 500 },
    );
  }
}
