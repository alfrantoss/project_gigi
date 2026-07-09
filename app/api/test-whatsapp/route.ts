import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendWhatsApp } from '@/utils/notification';

/**
 * API untuk test WhatsApp notification
 * Hanya bisa diakses oleh admin
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Autentikasi diperlukan' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'KETUA_RT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await request.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Phone dan message harus diisi' },
        { status: 400 }
      );
    }

    console.log('=== Testing WhatsApp Send ===');
    console.log('Phone:', phone);
    console.log('Message:', message);

    const result = await sendWhatsApp(phone, message);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp berhasil dikirim',
        data: result.data,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Gagal mengirim WhatsApp',
          details: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Test WhatsApp error:', error);
    return NextResponse.json(
      {
        error: 'Terjadi kesalahan',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
