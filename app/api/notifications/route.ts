import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
    }

    // Get query params
    const limit = request.nextUrl.searchParams.get("limit") || "10";
    const markAsRead = request.nextUrl.searchParams.get("markAsRead");

    // If markAsRead param is provided, mark all as read
    if (markAsRead === "true") {
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    }

    // Fetch recent notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: parseInt(limit),
    });

    // Count unread notifications
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json(
      {
        error: "Gagal mengambil notifikasi",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: "ID notifikasi diperlukan" },
        { status: 400 },
      );
    }

    // Mark specific notification as read
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    // Verify ownership
    if (notification.userId !== session.user.id) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error: any) {
    console.error("Mark notification read error:", error);
    return NextResponse.json(
      {
        error: "Gagal menandai notifikasi",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
