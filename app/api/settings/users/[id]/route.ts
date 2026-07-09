import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
    }

    const { role, isActive } = await req.json();
    const userId = params.id;

    // Cannot change own role
    if (userId === session.user?.id) {
      return NextResponse.json(
        { error: "Tidak dapat mengubah peran Anda sendiri" },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role && { role }),
        ...(typeof isActive === "boolean" && { isActive }),
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || "",
        action: "UPDATE_USER_ROLE",
        module: "Settings",
        description: `Changed user ${updatedUser.email} role to ${updatedUser.role}`,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        newData: updatedUser,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update user role error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui pengguna" },
      { status: 500 },
    );
  }
}
