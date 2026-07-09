/**
 * WhatsApp Notification Service
 * Menggunakan Fonnte API untuk mengirim pesan WhatsApp
 */

interface SendWhatsAppParams {
  phone: string;
  message: string;
}

export async function sendWhatsAppMessage({ phone, message }: SendWhatsAppParams) {
  const WA_API_KEY = process.env.WA_API_KEY;

  if (!WA_API_KEY) {
    console.warn('WA_API_KEY not configured. Skipping WhatsApp notification.');
    return { success: false, error: 'WA_API_KEY not configured' };
  }

  // Format nomor telepon (hapus karakter non-digit)
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Tambah 62 jika nomor dimulai dengan 0
  const formattedPhone = cleanPhone.startsWith('0') 
    ? '62' + cleanPhone.substring(1) 
    : cleanPhone;

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': WA_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: formattedPhone,
        message: message,
        countryCode: '62',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp send error:', data);
      return { success: false, error: data.reason || 'Failed to send WhatsApp' };
    }

    console.log('WhatsApp sent successfully to', formattedPhone);
    return { success: true, data };
  } catch (error) {
    console.error('WhatsApp send exception:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Template pesan WhatsApp untuk reset password
 */
export function createResetPasswordWhatsAppMessage(name: string, resetLink: string): string {
  return `Halo ${name},

Anda menerima pesan ini karena ada permintaan reset password untuk akun Anda di Sistem Manajemen Warga RT 001.

🔐 *Link Reset Password:*
${resetLink}

Link ini akan kadaluarsa dalam 1 jam.

⚠️ Jika Anda tidak melakukan permintaan ini, abaikan pesan ini. Password Anda tetap aman.

---
RT 001 Pesona Gading Cibitung 1
Sistem Manajemen Warga`;
}

/**
 * Template pesan WhatsApp untuk konfirmasi password berhasil direset
 */
export function createPasswordResetSuccessMessage(name: string): string {
  return `Halo ${name},

✅ Password Anda telah berhasil direset.

Anda sekarang dapat login menggunakan password baru Anda di:
http://localhost:3000/auth/login

⚠️ Jika Anda tidak melakukan perubahan ini, segera hubungi admin RT untuk keamanan akun Anda.

---
RT 001 Pesona Gading Cibitung 1
Sistem Manajemen Warga`;
}
