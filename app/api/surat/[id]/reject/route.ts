import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
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

    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'Alasan penolakan harus diisi' },
        { status: 400 }
      );
    }

    const surat = await prisma.surat.findUnique({
      where: { id: params.id },
    });

    if (!surat) {
      return NextResponse.json({ error: 'Surat tidak ditemukan' }, { status: 404 });
    }

    if (surat.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Surat sudah diproses sebelumnya' },
        { status: 400 }
      );
    }

    const updatedSurat = await prisma.surat.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        rejectedReason: reason,
      },
    });

    return NextResponse.json({
      message: 'Surat berhasil ditolak',
      surat: updatedSurat,
    });
  } catch (error) {
    console.error('Reject surat error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menolak surat' },
      { status: 500 }
    );
  }
}
