import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateSuratDomisili, generateSuratPengantar } from '@/utils/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
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
      return new NextResponse('Surat tidak ditemukan', { status: 404 });
    }

    // Hanya pemohon atau admin/rt yang bisa unduh
    const isOwner = surat.userId === session.user.id;
    const isAdmin = ['SUPER_ADMIN', 'KETUA_RT'].includes(session.user.role);

    if (!isOwner && !isAdmin) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    if (surat.status !== 'APPROVED') {
      return new NextResponse('Surat belum disetujui', { status: 400 });
    }

    const TITLES: Record<string, string> = {
      DOMISILI: 'SURAT KETERANGAN DOMISILI',
      PENGANTAR: 'SURAT PENGANTAR',
      IZIN_USAHA: 'SURAT IZIN USAHA',
      KETERANGAN_TIDAK_MAMPU: 'SURAT KETERANGAN TIDAK MAMPU',
      LAINNYA: 'SURAT KETERANGAN',
    };

    // Persiapkan data untuk PDF
    const pdfData = {
      ... (surat.data as any),
      title: TITLES[surat.type] || 'SURAT KETERANGAN',
      nama: surat.user.name,
      nik: surat.user.warga?.nik,
      alamat: surat.user.warga?.alamat,
      rt: surat.user.warga?.rt,
      rw: surat.user.warga?.rw,
      kelurahan: surat.user.warga?.kelurahan,
      kecamatan: surat.user.warga?.kecamatan,
      pekerjaan: surat.user.warga?.pekerjaan,
      ketuaRT: 'Ketua RT',
    };

    let doc;
    if (surat.type === 'PENGANTAR') {
      doc = generateSuratPengantar(pdfData);
    } else {
      // Kebanyakan surat menggunakan layout yang sama (seperti Domisili)
      // hanya judulnya saja yang berbeda
      doc = generateSuratDomisili(pdfData);
    }

    // Generate PDF as buffer
    const pdfOutput = doc.output('arraybuffer');

    return new NextResponse(pdfOutput, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="surat-${surat.type.toLowerCase()}-${surat.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Download surat error:', error);
    return new NextResponse('Terjadi kesalahan saat mengunduh surat', { status: 500 });
  }
}
