import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  generateSuratDomisili, 
  generateSuratPengantar,
  generateSuratIzinUsaha,
  generateSuratKeteranganTidakMampu,
  generateSuratLainnya
} from '@/utils/pdf-generator';

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

    const surat = await prisma.surat.findUnique({
      where: { id: params.id },
      include: {
        user: {
          include: {
            warga: true,
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

    let pdfDoc;
    const pdfData = {
      ...(surat.data as Record<string, any>),
      nama: surat.user.name,
      nik: surat.user.warga?.nik,
      alamat: surat.user.warga?.alamat,
      rt: surat.user.warga?.rt,
      rw: surat.user.warga?.rw,
      kelurahan: surat.user.warga?.kelurahan,
      kecamatan: surat.user.warga?.kecamatan,
      pekerjaan: surat.user.warga?.pekerjaan,
      ketuaRT: session.user.name,
      keperluan: surat.purpose,
      purpose: surat.purpose,
      title: surat.title,
    };

    // Generate PDF based on surat type
    switch (surat.type) {
      case 'DOMISILI':
        pdfDoc = generateSuratDomisili(pdfData);
        break;
      case 'PENGANTAR':
        pdfDoc = generateSuratPengantar(pdfData);
        break;
      case 'IZIN_USAHA':
        pdfDoc = generateSuratIzinUsaha(pdfData);
        break;
      case 'KETERANGAN_TIDAK_MAMPU':
        pdfDoc = generateSuratKeteranganTidakMampu(pdfData);
        break;
      case 'LAINNYA':
      default:
        pdfDoc = generateSuratLainnya(pdfData);
        break;
    }

    const pdfUrl = pdfDoc
      ? `/uploads/surat-${surat.id}.pdf`
      : null;

    const updatedSurat = await prisma.surat.update({
      where: { id: params.id },
      data: {
        status: 'APPROVED',
        approvedBy: session.user.id,
        approvedAt: new Date(),
        pdfUrl,
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

    return NextResponse.json({
      message: 'Surat berhasil disetujui',
      surat: updatedSurat,
    });
  } catch (error) {
    console.error('Approve surat error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menyetujui surat' },
      { status: 500 }
    );
  }
}
