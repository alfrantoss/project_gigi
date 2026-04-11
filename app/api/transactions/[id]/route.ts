import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/utils/audit-log';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'KETUA_RT', 'BENDAHARA'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const oldTransaction = await prisma.transaction.findUnique({
      where: { id: params.id },
    });

    if (!oldTransaction) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const { type, category, description, amount, date, notes, attachmentUrl } = body;

    const transaction = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        type,
        category,
        description,
        amount: parseFloat(amount),
        date: date ? new Date(date) : undefined,
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
      action: 'UPDATE',
      module: 'TRANSACTION',
      description: `Mengubah transaksi: ${description}`,
      oldData: oldTransaction,
      newData: transaction,
    });

    return NextResponse.json({
      message: 'Transaksi berhasil diperbarui',
      transaction,
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memperbarui transaksi' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'KETUA_RT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    await prisma.transaction.delete({
      where: { id: params.id },
    });

    await createAuditLog({
      userId: session.user.id,
      action: 'DELETE',
      module: 'TRANSACTION',
      description: `Menghapus transaksi: ${transaction.description}`,
      oldData: transaction,
    });

    return NextResponse.json({
      message: 'Transaksi berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menghapus transaksi' },
      { status: 500 }
    );
  }
}
