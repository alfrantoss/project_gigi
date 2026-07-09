import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateOverduePayments } from "@/utils/overdue";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
    }

    // Auto-update overdue payments before returning data
    await updateOverduePayments();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const period = searchParams.get("period");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (session.user.role === "WARGA" && !userId) {
      where.userId = session.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (status) where.status = status;
    if (period) where.period = period;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          dueDate: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "KETUA_RT", "BENDAHARA"].includes(session.user.role)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, amount, period, description, dueDate } = body;

    if (!userId || !amount || !period || !description || !dueDate) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 },
      );
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: parseFloat(amount),
        period,
        description,
        dueDate: new Date(dueDate),
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Tagihan berhasil dibuat",
        payment,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat tagihan" },
      { status: 500 },
    );
  }
}
