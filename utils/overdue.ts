import { prisma } from "@/lib/prisma";
import dayjs from "dayjs";

/**
 * Check and update all PENDING payments to OVERDUE if due date has passed
 * This function should be called:
 * 1. When fetching payments from API
 * 2. In a scheduled cron job
 */
export async function updateOverduePayments() {
  try {
    const now = new Date();

    // Find all PENDING payments where dueDate is in the past
    const overduePayments = await prisma.payment.findMany({
      where: {
        status: "PENDING",
        dueDate: {
          lt: now, // less than today
        },
      },
    });

    if (overduePayments.length === 0) {
      return { count: 0, message: "No overdue payments to update" };
    }

    // Update them to OVERDUE
    const result = await prisma.payment.updateMany({
      where: {
        status: "PENDING",
        dueDate: {
          lt: now,
        },
      },
      data: {
        status: "OVERDUE",
      },
    });

    console.log(`Updated ${result.count} payments to OVERDUE status`);

    return {
      count: result.count,
      message: `${result.count} tagihan telah diperbarui ke status Terlambat`,
    };
  } catch (error) {
    console.error("Error updating overdue payments:", error);
    return {
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get days overdue for a payment
 */
export function getDaysOverdue(dueDate: Date): number {
  const now = dayjs();
  const due = dayjs(dueDate);
  return now.diff(due, "day");
}

/**
 * Format overdue message
 */
export function formatOverdueMessage(daysOverdue: number): string {
  if (daysOverdue <= 0) {
    return "Belum jatuh tempo";
  } else if (daysOverdue === 1) {
    return "1 hari terlambat";
  } else if (daysOverdue < 30) {
    return `${daysOverdue} hari terlambat`;
  } else {
    const months = Math.floor(daysOverdue / 30);
    return `${months} bulan ${daysOverdue % 30} hari terlambat`;
  }
}
