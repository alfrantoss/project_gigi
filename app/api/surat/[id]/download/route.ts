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
    
    // Generate PDF sesuai jenis surat
    switch (surat.type) {
      case 'PENGANTAR':
        doc = generateSuratPengantar(pdfData);
        break;
      case 'IZIN_USAHA':
        doc = generateSuratIzinUsaha(pdfData);
        break;
      case 'KETERANGAN_TIDAK_MAMPU':
        doc = generateSuratKeteranganTidakMampu(pdfData);
        break;
      case 'LAINNYA':
        doc = generateSuratLainnya(pdfData);
        break;
      case 'DOMISILI':
      default:
        doc = generateSuratDomisili(pdfData);
        break;
    }

    // Generate PDF as buffer
    const pdfOutput = doc.output('arraybuffer');

    // Format nama file yang lebih deskriptif
    const namaPemohon = surat.user.name.replace(/\s+/g, '-').toLowerCase(); // Replace spasi dengan dash
    const tanggal = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const jenisMap: Record<string, string> = {
      DOMISILI: 'domisili',
      PENGANTAR: 'pengantar',
      IZIN_USAHA: 'izin-usaha',
      KETERANGAN_TIDAK_MAMPU: 'sktm',
      LAINNYA: 'lainnya',
    };
    const jenisSurat = jenisMap[surat.type] || 'surat';
    const filename = `${jenisSurat}-${namaPemohon}-${tanggal}.pdf`;

    return new NextResponse(pdfOutput, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Download surat error:', error);
    return new NextResponse('Terjadi kesalahan saat mengunduh surat', { status: 500 });
  }
}
