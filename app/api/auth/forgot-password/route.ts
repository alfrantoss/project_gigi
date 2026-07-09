import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email harus diisi' },
        { status: 400 }
      );
    }

    // Cek apakah user dengan email tersebut ada
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Selalu return success untuk keamanan (jangan kasih tahu user tidak ditemukan)
    if (!user) {
      return NextResponse.json({
        message: 'Jika email terdaftar, link reset password akan dikirim',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 jam dari sekarang

    // Simpan token di database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Buat reset link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    console.log('\n========================================');
    console.log('🔐 RESET PASSWORD REQUEST');
    console.log('========================================');
    console.log('User:', user.name);
    console.log('Email:', email);
    console.log('Phone:', user.phone || '-');
    console.log('Reset Link:', resetLink);
    console.log('Expired:', resetTokenExpiry.toLocaleString('id-ID'));
    console.log('========================================\n');

    // Kirim Email (jika SMTP configured)
    let emailSent = false;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        console.log('📧 Sending email...');
        
        const transporter = nodemailer.createTransport({
          service: 'gmail', // Pakai service gmail langsung
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const info = await transporter.sendMail({
          from: `"Sistem RT 001" <${process.env.SMTP_USER}>`,
          to: email,
          subject: 'Reset Password - Sistem Manajemen Warga RT 001',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #1C2F57 0%, #2a4575 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Reset Password</h1>
              </div>
              
              <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; color: #374151;">Halo <strong>${user.name}</strong>,</p>
                
                <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
                  Anda menerima email ini karena ada permintaan untuk mereset password akun Anda 
                  di Sistem Manajemen Warga RT 001 Pesona Gading Cibitung 1.
                </p>
                
                <div style="margin: 30px 0; text-align: center;">
                  <a href="${resetLink}" 
                     style="background-color: #1C2F57; color: white; padding: 14px 28px; text-decoration: none; 
                            border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
                    Reset Password Sekarang
                  </a>
                </div>
                
                <p style="font-size: 13px; color: #6b7280;">
                  Atau copy dan paste link berikut ke browser Anda:
                </p>
                <div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; margin: 15px 0; 
                            word-break: break-all; font-family: monospace; font-size: 12px; color: #374151;">
                  ${resetLink}
                </div>
                
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 13px; color: #92400e;">
                    ⚠️ <strong>Penting:</strong> Link ini akan kadaluarsa dalam <strong>1 jam</strong>.
                  </p>
                </div>
                
                <p style="font-size: 13px; color: #6b7280; margin-top: 20px;">
                  Jika Anda tidak melakukan permintaan reset password ini, abaikan email ini. 
                  Password Anda tetap aman dan tidak akan berubah.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
                <p style="margin: 5px 0;">RT 001 Pesona Gading Cibitung 1</p>
                <p style="margin: 5px 0;">Sistem Manajemen Warga</p>
                <p style="margin: 10px 0; color: #d1d5db;">© ${new Date().getFullYear()} All rights reserved</p>
              </div>
            </div>
          `,
        });
        
        emailSent = true;
        console.log('✅ Email sent successfully!');
        console.log('   Message ID:', info.messageId);
        console.log('   To:', email);
      } catch (emailError: any) {
        console.error('❌ Email error:', emailError.message);
        if (emailError.code) console.error('   Error code:', emailError.code);
      }
    } else {
      console.log('⚠️ SMTP not configured');
    }

    // Kirim WhatsApp (jika ada nomor telepon dan WA API configured)
    if (user.phone && process.env.WA_API_KEY) {
      try {
        // Format nomor telepon
        const cleanPhone = user.phone.replace(/\D/g, '');
        const formattedPhone = cleanPhone.startsWith('0') 
          ? '62' + cleanPhone.substring(1) 
          : cleanPhone;

        const waMessage = `Halo *${user.name}*,

Anda menerima pesan ini karena ada permintaan reset password untuk akun Anda di *Sistem Manajemen Warga RT 001*.

🔐 *Link Reset Password:*
${resetLink}

⏰ Link ini akan kadaluarsa dalam *1 jam*.

⚠️ Jika Anda tidak melakukan permintaan ini, abaikan pesan ini. Password Anda tetap aman.

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

        const waData = await response.json();

        if (response.ok) {
          console.log('✅ WhatsApp sent successfully to:', formattedPhone);
        } else {
          console.error('❌ Failed to send WhatsApp:', waData);
        }
      } catch (waError) {
        console.error('❌ WhatsApp send exception:', waError);
      }
    } else {
      if (!user.phone) {
        console.log('⚠️ User has no phone number. Skipping WhatsApp notification.');
      } else {
        console.log('⚠️ WA_API_KEY not configured. Skipping WhatsApp notification.');
      }
    }

    return NextResponse.json({
      message: 'Link reset password telah dikirim melalui email dan WhatsApp (jika tersedia)',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
