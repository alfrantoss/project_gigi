import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/utils/audit-log';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Autentikasi diperlukan' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};

    if (type) where.type = type;
    if (category) where.category = category;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    const totalPemasukan = await prisma.transaction.aggregate({
      where: { ...where, type: 'PEMASUKAN' },
      _sum: { amount: true },
    });

    const totalPengeluaran = await prisma.transaction.aggregate({
      where: { ...where, type: 'PENGELUARAN' },
      _sum: { amount: true },
    });

    const saldo =
      (totalPemasukan._sum.amount || 0) - (totalPengeluaran._sum.amount || 0);

    return NextResponse.json({
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalPemasukan: totalPemasukan._sum.amount || 0,
        totalPengeluaran: totalPengeluaran._sum.amount || 0,
        saldo,
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Autentikasi diperlukan' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'KETUA_RT', 'BENDAHARA'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await request.json();
    const { type, category, description, amount, date, notes, attachmentUrl } = body;

    if (!type || !category || !description || !amount) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        type,
        category,
        description,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        createdBy: session.user.id,
        notes,
        attachmentUrl,
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

    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      module: 'TRANSACTION',
      description: `Menambahkan transaksi ${type}: ${description}`,
      newData: transaction,
    });

    const lowBalanceSetting = await prisma.setting.findUnique({
      where: { key: 'low_balance_alert' },
    });

    if (type === 'PENGELUARAN' && lowBalanceSetting) {
      const totalPemasukan = await prisma.transaction.aggregate({
        where: { type: 'PEMASUKAN' },
        _sum: { amount: true },
      });

      const totalPengeluaran = await prisma.transaction.aggregate({
        where: { type: 'PENGELUARAN' },
        _sum: { amount: true },
      });

      const saldo = (totalPemasukan._sum.amount || 0) - (totalPengeluaran._sum.amount || 0);

      if (saldo < parseFloat(lowBalanceSetting.value)) {
        console.log('Low balance alert triggered');
      }
    }

    return NextResponse.json(
      {
        message: 'Transaksi berhasil ditambahkan',
        transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menambahkan transaksi' },
      { status: 500 }
    );
  }
}
