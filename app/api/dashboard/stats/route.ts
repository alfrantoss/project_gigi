import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const userId = session.user.id;

    // Common stats for all roles
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (role === "WARGA") {
      // Stats for Warga (Resident)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          warga: true,
          payments: {
            where: {
              status: { in: ["PENDING", "OVERDUE"] },
            },
          },
          surats: true,
        },
      });

      // Get payment history (last 6 months)
      const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1);
      const paymentHistory = await prisma.payment.groupBy({
        by: ["period", "status"],
        where: {
          userId: userId,
          createdAt: { gte: sixMonthsAgo },
        },
        _sum: {
          amount: true,
        },
      });

      // Get upcoming activities (next 30 days)
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
      
      const upcomingActivities = await prisma.activity.findMany({
        where: {
          startDate: {
            gte: now,
            lte: thirtyDaysLater,
          },
        },
        orderBy: { startDate: "asc" },
        take: 5,
      });

      // Get recent announcements
      const recentAnnouncements = await prisma.announcement.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      });

      return NextResponse.json({
        role: "WARGA",
        wargaInfo: user?.warga,
        pendingPayments: user?.payments.length || 0,
        totalPaid: user?.warga?.totalPaid || 0,
        totalDebt: user?.warga?.totalDebt || 0,
        monthlyFee: user?.warga?.monthlyFee || 0,
        pendingSurats: user?.surats.filter((s) => s.status === "PENDING").length || 0,
        totalSurats: user?.surats.length || 0,
        paymentHistory,
        upcomingActivities,
        recentAnnouncements,
      });
    }

    // Stats for Admin roles (SUPER_ADMIN, KETUA_RT, BENDAHARA)
    const [
      totalWarga,
      activeWarga,
      wargaByStatus,
      totalPendingPayments,
      totalOverduePayments,
      totalPaidThisMonth,
      totalDebt,
      pendingSurats,
      approvedSurats,
      rejectedSurats,
      upcomingActivities,
      recentAnnouncements,
    ] = await Promise.all([
      prisma.warga.count(),
      prisma.warga.count({ where: { status: "AKTIF" } }),
      prisma.warga.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.payment.count({ where: { status: "OVERDUE" } }),
      prisma.payment.count({
        where: {
          status: "PAID",
          paidAt: {
            gte: new Date(currentYear, currentMonth, 1),
            lt: new Date(currentYear, currentMonth + 1, 1),
          },
        },
      }),
      prisma.warga.aggregate({
        _sum: { totalDebt: true },
      }),
      prisma.surat.count({ where: { status: "PENDING" } }),
      prisma.surat.count({ where: { status: "APPROVED" } }),
      prisma.surat.count({ where: { status: "REJECTED" } }),
      prisma.activity.findMany({
        where: {
          startDate: { gte: now },
        },
        orderBy: { startDate: "asc" },
        take: 5,
        include: {
          user: {
            select: { name: true },
          },
        },
      }),
      prisma.announcement.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: {
            select: { name: true },
          },
        },
      }),
    ]);

    // Get transaction summary
    const transactions = await prisma.transaction.groupBy({
      by: ["type"],
      _sum: {
        amount: true,
      },
    });

    const totalPemasukan =
      transactions.find((t) => t.type === "PEMASUKAN")?._sum.amount || 0;
    const totalPengeluaran =
      transactions.find((t) => t.type === "PENGELUARAN")?._sum.amount || 0;
    const saldoKas = totalPemasukan - totalPengeluaran;

    // Get monthly transactions (last 6 months)
    const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1);
    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        date: { gte: sixMonthsAgo },
      },
      orderBy: { date: "asc" },
    });

    // Group by month
    const monthlyData: any = {};
    monthlyTransactions.forEach((t) => {
      const monthKey = new Date(t.date).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
      });
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { pemasukan: 0, pengeluaran: 0 };
      }
      if (t.type === "PEMASUKAN") {
        monthlyData[monthKey].pemasukan += t.amount;
      } else {
        monthlyData[monthKey].pengeluaran += t.amount;
      }
    });

    const monthlyChartData = Object.keys(monthlyData).map((month) => ({
      month,
      pemasukan: monthlyData[month].pemasukan,
      pengeluaran: monthlyData[month].pengeluaran,
    }));

    // Get payment stats by month (last 6 months)
    const monthlyPayments = await prisma.payment.groupBy({
      by: ["period", "status"],
      where: {
        createdAt: { gte: sixMonthsAgo },
      },
      _count: { id: true },
      _sum: { amount: true },
    });

    // Get top 10 debtors (for Bendahara)
    const topDebtors = await prisma.warga.findMany({
      where: {
        totalDebt: { gt: 0 },
      },
      orderBy: { totalDebt: "desc" },
      take: 10,
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      orderBy: { date: "desc" },
      take: 10,
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({
      role,
      overview: {
        saldoKas,
        totalPemasukan,
        totalPengeluaran,
        totalWarga,
        activeWarga,
        totalPendingPayments,
        totalOverduePayments,
        totalPaidThisMonth,
        totalDebt: totalDebt._sum.totalDebt || 0,
        pendingSurats,
        approvedSurats,
        rejectedSurats,
      },
      wargaByStatus: wargaByStatus.map((w) => ({
        status: w.status,
        count: w._count.id,
      })),
      monthlyChartData,
      monthlyPayments,
      topDebtors: topDebtors.map((w) => ({
        name: w.user.name,
        nomorRumah: w.nomorRumah,
        totalDebt: w.totalDebt,
      })),
      upcomingActivities,
      recentAnnouncements,
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        type: t.type,
        category: t.category,
        description: t.description,
        amount: t.amount,
        date: t.date,
        createdBy: t.user.name,
      })),
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
