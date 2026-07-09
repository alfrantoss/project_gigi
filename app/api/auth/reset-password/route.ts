import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token dan password harus diisi' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password minimal 8 karakter' },
        { status: 400 }
      );
    }

    // Cari user berdasarkan token dan pastikan belum expired
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Token tidak valid atau sudah expired. Silakan lakukan request reset password lagi.' },
        { status: 400 }
      );
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password dan hapus token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    console.log('\n========================================');
    console.log('✅ PASSWORD RESET SUCCESSFUL');
    console.log('========================================');
    console.log('User:', user.name);
    console.log('Email:', user.email);
    console.log('Time:', new Date().toLocaleString('id-ID'));
    console.log('========================================\n');

    // Kirim notifikasi WhatsApp (jika ada nomor telepon)
    if (user.phone && process.env.WA_API_KEY) {
      try {
        const cleanPhone = user.phone.replace(/\D/g, '');
        const formattedPhone = cleanPhone.startsWith('0') 
          ? '62' + cleanPhone.substring(1) 
          : cleanPhone;

        const waMessage = `Halo *${user.name}*,

✅ Password Anda telah *berhasil direset*.

Anda sekarang dapat login menggunakan password baru Anda di:
http://localhost:3000/auth/login

⚠️ Jika Anda tidak melakukan perubahan ini, segera hubungi admin RT untuk keamanan akun Anda.

---
_RT 001 Pesona Gading Cibitung 1_
_Sistem Manajemen Warga_`;

        const response = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            'Authorization': process.env.WA_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target: formattedPhone,
            message: waMessage,
            countryCode: '62',
          }),
        });

        if (response.ok) {
          console.log('✅ WhatsApp confirmation sent to:', formattedPhone);
        } else {
          console.error('❌ Failed to send WhatsApp confirmation');
        }
      } catch (waError) {
        console.error('❌ WhatsApp send exception:', waError);
      }
    }

    return NextResponse.json({
      message: 'Password berhasil direset',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
