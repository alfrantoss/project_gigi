import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Autentikasi diperlukan' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};

    if (session.user.role === 'WARGA' && !userId) {
      where.userId = session.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (status) where.status = status;
    if (type) where.type = type;

    const [surats, total] = await Promise.all([
      prisma.surat.findMany({
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
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.surat.count({ where }),
    ]);

    return NextResponse.json({
      surats,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get surats error:', error);
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

    const body = await request.json();
    const { type, title, purpose, data } = body;

    if (!type || !title || !purpose || !data) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const surat = await prisma.surat.create({
      data: {
        userId: session.user.id,
        type,
        title,
        purpose,
        data,
        status: 'PENDING',
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
        message: 'Pengajuan surat berhasil dibuat',
        surat,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create surat error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membuat pengajuan surat' },
      { status: 500 }
    );
  }
}
