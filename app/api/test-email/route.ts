import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    console.log('🧪 Testing Email Configuration...\n');
    
    // Check environment variables
    const config = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET',
    };
    
    console.log('Configuration:', config);
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({
        success: false,
        error: 'Kredensial SMTP belum dikonfigurasi di .env',
        config,
      }, { status: 400 });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection
    console.log('📡 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!');

    // Send test email
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: `"Test Email" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to yourself
      subject: 'Test Email - Sistem RT 001',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #1C2F57;">✅ Email Test Berhasil!</h1>
          <p>Email ini dikirim untuk mengetes konfigurasi SMTP.</p>
          <p><strong>Waktu:</strong> ${new Date().toLocaleString('id-ID')}</p>
          <hr />
          <p style="color: #666; font-size: 12px;">RT 001 Pesona Gading Cibitung 1</p>
        </div>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);

    return NextResponse.json({
      success: true,
      message: 'Email berhasil dikirim! Cek inbox Anda.',
      messageId: info.messageId,
      response: info.response,
      config,
    });

  } catch (error: any) {
    console.error('❌ Email test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      command: error.command,
      details: error.toString(),
    }, { status: 500 });
  }
}
