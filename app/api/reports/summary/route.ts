import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
    }

    // Only admin can view reports
    if (
      !["SUPER_ADMIN", "KETUA_RT", "BENDAHARA"].includes(
        session.user?.role || "",
      )
    ) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { startDate, endDate } = Object.fromEntries(
      new URL(req.url).searchParams,
    );

    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Get payment statistics
    const totalPayments = await prisma.payment.count();
    const paidPayments = await prisma.payment.count({
      where: { status: "PAID" },
    });
    const pendingPayments = await prisma.payment.count({
      where: { status: "PENDING" },
    });
    const overduePayments = await prisma.payment.count({
      where: { status: "OVERDUE" },
    });

    // Get financial data
    const paidAmount = await prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: start, lte: end } },
      _sum: { amount: true },
    });

    const pendingAmount = await prisma.payment.aggregate({
      where: { status: "PENDING", dueDate: { gte: start, lte: end } },
      _sum: { amount: true },
    });

    const overdueAmount = await prisma.payment.aggregate({
      where: { status: "OVERDUE", dueDate: { lte: new Date() } },
      _sum: { amount: true },
    });

    // Get transaction data
    const pemasukan = await prisma.transaction.aggregate({
      where: { type: "PEMASUKAN", date: { gte: start, lte: end } },
      _sum: { amount: true },
    });

    const pengeluaran = await prisma.transaction.aggregate({
      where: { type: "PENGELUARAN", date: { gte: start, lte: end } },
      _sum: { amount: true },
    });

    // Get warga statistics
    const totalWarga = await prisma.warga.count();
    const aktifWarga = await prisma.warga.count({
      where: { status: "AKTIF" },
    });

    // Top debtors
    const topDebtors = await prisma.warga.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { totalDebt: "desc" },
      take: 5,
    });

    // Payment trends (monthly)
    const paymentTrends = await prisma.payment.groupBy({
      by: ["period"],
      where: { status: "PAID", paidAt: { gte: start, lte: end } },
      _sum: { amount: true },
      _count: true,
      orderBy: { period: "desc" },
      take: 12,
    });

    return NextResponse.json({
      summary: {
        totalPayments,
        paidPayments,
        pendingPayments,
        overduePayments,
        totalWarga,
        aktifWarga,
      },
      financial: {
        paidAmount: paidAmount._sum.amount || 0,
        pendingAmount: pendingAmount._sum.amount || 0,
        overdueAmount: overdueAmount._sum.amount || 0,
        pemasukan: pemasukan._sum.amount || 0,
        pengeluaran: pengeluaran._sum.amount || 0,
      },
      topDebtors,
      paymentTrends,
      dateRange: { start, end },
    });
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil laporan" },
      { status: 500 },
    );
  }
}
