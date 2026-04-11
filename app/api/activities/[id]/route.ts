import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activity = await prisma.activity.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!activity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Get activity error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only creator or admin can update
    const activity = await prisma.activity.findUnique({
      where: { id: params.id },
    });

    if (!activity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 },
      );
    }

    if (
      activity.createdBy !== session.user?.id &&
      session.user?.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, description, type, location, startDate, endDate } =
      await req.json();

    const updated = await prisma.activity.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(type && { type }),
        ...(location && { location }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || "",
        action: "UPDATE_ACTIVITY",
        module: "Activities",
        description: `Updated activity: ${updated.title}`,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        oldData: activity,
        newData: updated,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update activity error:", error);
    return NextResponse.json(
      { error: "Failed to update activity" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN can delete
    if (session.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const activity = await prisma.activity.findUnique({
      where: { id: params.id },
    });

    if (!activity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 },
      );
    }

    await prisma.activity.delete({
      where: { id: params.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || "",
        action: "DELETE_ACTIVITY",
        module: "Activities",
        description: `Deleted activity: ${activity.title}`,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        oldData: activity,
      },
    });

    return NextResponse.json({ message: "Activity deleted successfully" });
  } catch (error) {
    console.error("Delete activity error:", error);
    return NextResponse.json(
      { error: "Failed to delete activity" },
      { status: 500 },
    );
  }
}
