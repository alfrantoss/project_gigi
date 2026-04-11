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
    const setting = await prisma.setting.findUnique({
      where: { key: "wa_api_key" },
    });

    if (!setting?.value) {
      console.error("WhatsApp API key not configured");
      return { success: false, error: "API key not configured" };
    }

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: setting.value,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: phone,
        message: message,
        countryCode: "62",
      }),
    });

    const data = await response.json();
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
    const message = `Halo ${user.name},\n\nAnda memiliki tagihan iuran RT yang belum dibayar:\n\nTotal: Rp ${totalDebt.toLocaleString("id-ID")}\nJumlah tagihan: ${user.payments.length}\n\nMohon segera melakukan pembayaran.\n\nTerima kasih.`;

    if (user.email) {
      await sendEmail(
        user.email,
        "Reminder Tagihan Iuran RT",
        `<p>${message.replace(/\n/g, "<br>")}</p>`,
      );
    }

    if (user.phone) {
      await sendWhatsApp(user.phone, message);
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
    });

    if (!activity) {
      return { success: false, error: "Activity not found" };
    }

    const users = await prisma.user.findMany({
      where: {
        role: "WARGA",
        isActive: true,
      },
    });

    const message = `Reminder Kegiatan RT:\n\n${activity.title}\n${activity.description}\n\nWaktu: ${activity.startDate.toLocaleString("id-ID")}\nLokasi: ${activity.location || "TBA"}\n\nMohon kehadiran Bapak/Ibu.`;

    for (const user of users) {
      if (user.phone) {
        await sendWhatsApp(user.phone, message);
      }
    }

    await prisma.activity.update({
      where: { id: activityId },
      data: { reminderSent: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send activity reminder:", error);
    return { success: false, error };
  }
}

export async function sendAnnouncementNotification(announcementId: string) {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      return { success: false, error: "Announcement not found" };
    }

    const users = await prisma.user.findMany({
      where: {
        role: "WARGA",
        isActive: true,
      },
    });

    const message = `Pengumuman RT:\n\n${announcement.title}\n\n${announcement.content}`;

    for (const user of users) {
      if (user.phone) {
        await sendWhatsApp(user.phone, message);
      }
    }

    await prisma.announcement.update({
      where: { id: announcementId },
      data: { notificationSent: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send announcement notification:", error);
    return { success: false, error };
  }
}

export type NotificationType =
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "ANNOUNCEMENT"
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
