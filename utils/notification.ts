import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@rt.com",
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

export async function sendWhatsApp(phone: string, message: string) {
  try {
    // Try to get API key from environment variable first
    let apiKey = process.env.WA_API_KEY;

    // If not in env, try to get from database
    if (!apiKey) {
      const setting = await prisma.setting.findUnique({
        where: { key: "wa_api_key" },
      });
      apiKey = setting?.value;
    }

    if (!apiKey) {
      console.error("WhatsApp API key not configured in env or database");
      return { success: false, error: "API key not configured" };
    }

    // Format phone number - remove leading 0 if exists
    const formattedPhone = phone.startsWith('0') ? phone.substring(1) : phone;

    console.log('Sending WhatsApp to:', formattedPhone);

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: formattedPhone,
        message: message,
        countryCode: "62",
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("WhatsApp API error:", data);
      return { success: false, error: data.reason || "Failed to send WhatsApp" };
    }

    console.log("WhatsApp sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send WhatsApp:", error);
    return { success: false, error };
  }
}

export async function sendPaymentReminder(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        warga: true,
        payments: {
          where: {
            status: { in: ["PENDING", "OVERDUE"] },
          },
          orderBy: {
            dueDate: "asc",
          },
        },
      },
    });

    if (!user || user.payments.length === 0) {
      return { success: false, error: "No pending payments" };
    }

    const totalDebt = user.payments.reduce((sum, p) => sum + p.amount, 0);
    
    // Email notification
    const emailMessage = `Halo ${user.name},\n\nAnda memiliki tagihan iuran RT yang belum dibayar:\n\nTotal: Rp ${totalDebt.toLocaleString("id-ID")}\nJumlah tagihan: ${user.payments.length}\n\nMohon segera melakukan pembayaran.\n\nTerima kasih.`;

    if (user.email) {
      await sendEmail(
        user.email,
        "Reminder Tagihan Iuran RT",
        `<p>${emailMessage.replace(/\n/g, "<br>")}</p>`,
      );
    }

    // WhatsApp notification with better formatting
    if (user.phone) {
      const paymentList = user.payments.slice(0, 5).map((p, i) => 
        `${i + 1}. ${p.period} - Rp ${p.amount.toLocaleString("id-ID")}`
      ).join('\n');

      const morePayments = user.payments.length > 5 
        ? `\n... dan ${user.payments.length - 5} tagihan lainnya` 
        : '';

      const waMessage = `🔔 *Reminder Tagihan Iuran RT*

Halo *${user.name}*,

Anda memiliki *${user.payments.length} tagihan* yang belum dibayar:

${paymentList}${morePayments}

💰 *Total Tagihan:* Rp ${totalDebt.toLocaleString("id-ID")}

Mohon segera melakukan pembayaran melalui sistem untuk menghindari denda keterlambatan.

Terima kasih atas perhatiannya! 🙏

_Sistem Manajemen Warga RT 001 RW 016_`;

      await sendWhatsApp(user.phone, waMessage);
    }

    // Create in-app notification
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: '🔔 Reminder Tagihan Iuran RT',
          message: `Anda memiliki ${user.payments.length} tagihan yang belum dibayar dengan total Rp ${totalDebt.toLocaleString("id-ID")}. Mohon segera melakukan pembayaran.`,
          type: 'PAYMENT_REMINDER',
          relatedId: user.payments[0]?.id, // Link to first payment
          isRead: false,
        },
      });
      console.log(`📱 In-app payment reminder created for ${user.name}`);
    } catch (notifError) {
      console.error(`Failed to create in-app notification for ${user.name}:`, notifError);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send payment reminder:", error);
    return { success: false, error };
  }
}

export async function sendActivityReminder(activityId: string) {
  try {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!activity) {
      console.error("Activity not found:", activityId);
      return { success: false, error: "Activity not found" };
    }

    const users = await prisma.user.findMany({
      where: {
        role: "WARGA",
        isActive: true,
        phone: {
          not: null,
        },
      },
    });

    console.log(`=== Sending Activity Notification ===`);
    console.log(`Activity: ${activity.title}`);
    console.log(`Total active warga with phone: ${users.length}`);

    if (users.length === 0) {
      console.warn("No active warga with phone numbers found");
      return { success: false, error: "No recipients found" };
    }

    const activityTypeMap: Record<string, string> = {
      RAPAT: '👔 Rapat',
      GOTONG_ROYONG: '🧹 Gotong Royong',
      ARISAN: '🎲 Arisan',
      PERAYAAN: '🎉 Perayaan',
      LAINNYA: '📌 Kegiatan',
    };

    const typeLabel = activityTypeMap[activity.type] || '📌 Kegiatan';
    const startDate = new Date(activity.startDate);
    const endDate = activity.endDate ? new Date(activity.endDate) : null;

    const message = `${typeLabel} *RT*

*${activity.title}*

${activity.description}

📅 Waktu: ${startDate.toLocaleString("id-ID", {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}${endDate ? `\n⏰ Selesai: ${endDate.toLocaleString("id-ID", {
      hour: '2-digit',
      minute: '2-digit'
    })}` : ''}
📍 Lokasi: ${activity.location || 'Akan diinformasikan'}

Mohon kehadiran Bapak/Ibu dalam kegiatan ini. 🙏

_Sistem Manajemen Warga RT 001 RW 016_`;

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const user of users) {
      // Send WhatsApp if phone number exists
      if (user.phone) {
        console.log(`Sending WhatsApp to ${user.name} (${user.phone})...`);
        const result = await sendWhatsApp(user.phone, message);
        if (result.success) {
          successCount++;
          console.log(`✅ WhatsApp sent to ${user.name}`);
        } else {
          failCount++;
          const errorMsg = `❌ Failed to send WhatsApp to ${user.name}: ${result.error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Send Email if email exists
      if (user.email) {
        console.log(`Sending Email to ${user.name} (${user.email})...`);
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #059669; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">${typeLabel} RT 001/016</h1>
            </div>
            <div style="padding: 30px; background-color: #f9fafb;">
              <h2 style="color: #1f2937; margin-top: 0;">${activity.title}</h2>
              <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #059669;">
                <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${activity.description}</p>
              </div>
              <div style="margin-top: 20px; padding: 20px; background-color: #d1fae5; border-radius: 8px;">
                <p style="margin: 0; color: #065f46; line-height: 1.8;">
                  📅 <strong>Waktu:</strong> ${startDate.toLocaleString("id-ID", {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}<br>
                  ${endDate ? `⏰ <strong>Selesai:</strong> ${endDate.toLocaleString("id-ID", {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}<br>` : ''}
                  📍 <strong>Lokasi:</strong> ${activity.location || 'Akan diinformasikan'}
                </p>
              </div>
              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #92400e;">
                  🙏 Mohon kehadiran Bapak/Ibu dalam kegiatan ini.
                </p>
              </div>
            </div>
            <div style="padding: 20px; text-align: center; background-color: #e5e7eb; color: #6b7280; font-size: 12px;">
              <p style="margin: 0;">Sistem Manajemen Warga RT 001 RW 016</p>
            </div>
          </div>
        `;
        
        const emailResult = await sendEmail(
          user.email,
          `${typeLabel} - ${activity.title}`,
          emailHtml
        );
        
        if (emailResult.success) {
          console.log(`✅ Email sent to ${user.name}`);
        } else {
          console.error(`❌ Failed to send email to ${user.name}`);
        }
      }
    }

    // Create in-app notifications for all users
    console.log('Creating in-app notifications...');
    // Get all active warga (not only those with phone)
    const allActiveWarga = await prisma.user.findMany({
      where: {
        role: "WARGA",
        isActive: true,
      },
    });
    
    for (const user of allActiveWarga) {
      try {
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: `${typeLabel} - ${activity.title}`,
            message: activity.description.length > 150 
              ? activity.description.substring(0, 150) + '...' 
              : activity.description,
            type: 'ACTIVITY',
            relatedId: activityId,
            isRead: false,
          },
        });
        console.log(`📱 In-app notification created for ${user.name}`);
      } catch (notifError) {
        console.error(`Failed to create in-app notification for ${user.name}:`, notifError);
      }
    }

    await prisma.activity.update({
      where: { id: activityId },
      data: { reminderSent: true },
    });

    console.log(`=== Activity Notification Complete ===`);
    console.log(`Success: ${successCount}, Failed: ${failCount}`);

    return { success: true, successCount, failCount, errors };
  } catch (error) {
    console.error("Failed to send activity reminder:", error);
    return { success: false, error };
  }
}

export async function sendAnnouncementNotification(announcementId: string) {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!announcement) {
      console.error("Announcement not found:", announcementId);
      return { success: false, error: "Announcement not found" };
    }

    const users = await prisma.user.findMany({
      where: {
        role: "WARGA",
        isActive: true,
        phone: {
          not: null,
        },
      },
    });

    console.log(`=== Sending Announcement Notification ===`);
    console.log(`Announcement: ${announcement.title}`);
    console.log(`Total active warga: ${users.length}`);
    console.log(`Users with phone numbers: ${users.filter(u => u.phone).length}`);

    if (users.length === 0) {
      console.warn("No active warga with phone numbers found");
      return { success: false, error: "No recipients found" };
    }

    const priorityEmoji: Record<string, string> = {
      urgent: '🚨',
      high: '⚠️',
      normal: '📢',
      low: 'ℹ️',
    };

    const emoji = priorityEmoji[announcement.priority] || '📢';
    
    const message = `${emoji} *Pengumuman RT*

*${announcement.title}*

${announcement.content}

📅 ${new Date().toLocaleString("id-ID")}
👤 Dari: ${announcement.user.name}

_Sistem Manajemen Warga RT 001 RW 016_`;

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const user of users) {
      // Send WhatsApp if phone number exists
      if (user.phone) {
        console.log(`Sending WhatsApp to ${user.name} (${user.phone})...`);
        const result = await sendWhatsApp(user.phone, message);
        if (result.success) {
          successCount++;
          console.log(`✅ WhatsApp sent to ${user.name}`);
        } else {
          failCount++;
          const errorMsg = `❌ Failed to send WhatsApp to ${user.name}: ${result.error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Send Email if email exists
      if (user.email) {
        console.log(`Sending Email to ${user.name} (${user.email})...`);
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1e40af; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">${emoji} Pengumuman RT 001/016</h1>
            </div>
            <div style="padding: 30px; background-color: #f9fafb;">
              <h2 style="color: #1f2937; margin-top: 0;">${announcement.title}</h2>
              <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #1e40af;">
                <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${announcement.content}</p>
              </div>
              <div style="margin-top: 20px; padding: 15px; background-color: #e0e7ff; border-radius: 8px;">
                <p style="margin: 0; color: #3730a3; font-size: 14px;">
                  📅 ${new Date().toLocaleString("id-ID")}<br>
                  👤 Dari: ${announcement.user.name}
                </p>
              </div>
            </div>
            <div style="padding: 20px; text-align: center; background-color: #e5e7eb; color: #6b7280; font-size: 12px;">
              <p style="margin: 0;">Sistem Manajemen Warga RT 001 RW 016</p>
            </div>
          </div>
        `;
        
        const emailResult = await sendEmail(
          user.email,
          `${emoji} ${announcement.title}`,
          emailHtml
        );
        
        if (emailResult.success) {
          console.log(`✅ Email sent to ${user.name}`);
        } else {
          console.error(`❌ Failed to send email to ${user.name}`);
        }
      }
      
      // Create in-app notification for all users (whether WhatsApp/Email sent or not)
      try {
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: `${emoji} ${announcement.title}`,
            message: announcement.content.length > 150 
              ? announcement.content.substring(0, 150) + '...' 
              : announcement.content,
            type: 'ANNOUNCEMENT',
            relatedId: announcementId,
            isRead: false,
          },
        });
        console.log(`📱 In-app notification created for ${user.name}`);
      } catch (notifError) {
        console.error(`Failed to create in-app notification for ${user.name}:`, notifError);
      }
    }

    await prisma.announcement.update({
      where: { id: announcementId },
      data: { notificationSent: true },
    });

    console.log(`=== Announcement Notification Complete ===`);
    console.log(`Success: ${successCount}, Failed: ${failCount}`);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    }

    return { success: true, successCount, failCount, errors };
  } catch (error) {
    console.error("Failed to send announcement notification:", error);
    return { success: false, error };
  }
}

export type NotificationType =
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "PAYMENT_REMINDER"
  | "SURAT_SUBMITTED"
  | "SURAT_APPROVED"
  | "SURAT_REJECTED"
  | "ANNOUNCEMENT"
  | "ACTIVITY"
  | "SYSTEM";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = "SYSTEM",
  relatedId?: string,
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        relatedId,
      },
    });
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}
