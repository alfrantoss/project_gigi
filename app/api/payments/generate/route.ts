import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import dayjs from "dayjs";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow SUPER_ADMIN, KETUA_RT, and BENDAHARA
    if (!["SUPER_ADMIN", "KETUA_RT", "BENDAHARA"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { period, description } = body;

    if (!period) {
      return NextResponse.json(
        { error: "Period is required (format: YYYY-MM)" },
        { status: 400 },
      );
    }

    // Validate period format
    const periodRegex = /^\d{4}-\d{2}$/;
    if (!periodRegex.test(period)) {
      return NextResponse.json(
        { error: "Invalid period format. Use YYYY-MM" },
        { status: 400 },
      );
    }

    // Check if payments for this period already exist
    const existingPayments = await prisma.payment.findMany({
      where: { period },
    });

    if (existingPayments.length > 0) {
      return NextResponse.json(
        {
          error: `Tagihan untuk periode ${period} sudah ada (${existingPayments.length} tagihan)`,
          count: existingPayments.length,
        },
        { status: 400 },
      );
    }

    // Get all active warga
    const wargas = await prisma.warga.findMany({
      include: {
        user: true,
      },
    });

    if (wargas.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada warga untuk dibuat tagihan" },
        { status: 400 },
      );
    }

    // Parse period to get year and month
    const [year, month] = period.split("-");
    const dueDate = dayjs(`${period}-10`).toDate(); // Due date: 10th of the month

    // Create payments for each warga
    const createdPayments = await Promise.all(
      wargas.map((warga) =>
        prisma.payment.create({
          data: {
            userId: warga.userId,
            amount: warga.monthlyFee,
            period,
            description:
              description || `Iuran bulanan ${warga.user.name} - ${period}`,
            status: "PENDING",
            dueDate,
          },
        }),
      ),
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_BULK",
        module: "PAYMENTS",
        description: `Generate ${createdPayments.length} tagihan untuk periode ${period}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil membuat ${createdPayments.length} tagihan untuk periode ${period}`,
      count: createdPayments.length,
      period,
    });
  } catch (error: any) {
    console.error("Generate payments error:", error);
    return NextResponse.json(
      {
        error: "Gagal membuat tagihan",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
