import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification, sendWhatsApp } from '@/utils/notification';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Autentikasi diperlukan' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'KETUA_RT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
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
      include: {
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
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

    // Create notification
    await createNotification(
      surat.userId,
      'Pengajuan Surat Ditolak',
      `Pengajuan surat "${surat.title}" Anda ditolak. Alasan: ${reason}`,
      'SURAT_REJECTED',
      surat.id,
    );

    // Send WhatsApp notification
    if (surat.user.phone) {
      const suratTypeMap: Record<string, string> = {
        DOMISILI: 'Surat Keterangan Domisili',
        PENGANTAR: 'Surat Pengantar',
        IZIN_USAHA: 'Surat Izin Usaha',
        KETERANGAN_TIDAK_MAMPU: 'Surat Keterangan Tidak Mampu',
        LAINNYA: 'Surat Keterangan',
      };

      const waMessage = `❌ *Pengajuan Surat Ditolak*

Halo *${surat.user.name}*,

Mohon maaf, pengajuan surat Anda ditolak.

📄 Jenis: ${suratTypeMap[surat.type] || 'Surat'}
📝 Judul: ${surat.title}
🕐 Waktu: ${new Date().toLocaleString("id-ID")}

📋 *Alasan Penolakan:*
${reason}

Anda dapat mengajukan ulang dengan melengkapi persyaratan yang diperlukan.

_Sistem Manajemen Warga RT 001 RW 016_`;

      await sendWhatsApp(surat.user.phone, waMessage);
    }

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
