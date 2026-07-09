import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log("Session:", JSON.stringify(session, null, 2));
    
    if (!session) {
      return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
    }

    if (!session.user?.id) {
      console.error("Session user ID is missing:", session);
      return NextResponse.json({ 
        error: "Sesi tidak valid. Silakan keluar dan masuk kembali.",
        code: "INVALID_SESSION"
      }, { status: 401 });
    }

    console.log("Fetching user with ID:", session.user.id);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        warga: {
          select: {
            id: true,
            nomorRumah: true,
            alamat: true,
            nik: true,
            status: true,
            monthlyFee: true,
            totalPaid: true,
            totalDebt: true,
            ektp: true,
            kartuKeluarga: true,
          },
        },
      },
    });

    if (!user) {
      console.error("User not found in database for ID:", session.user.id);
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    console.log("User found:", user.email, user.role);
    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data profil" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
    }

    if (!session.user?.id) {
      console.error("Session user ID is missing in PUT:", session);
      return NextResponse.json({ error: "ID pengguna sesi tidak ditemukan" }, { status: 401 });
    }

    const { name, phone } = await req.json();

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui profil" },
      { status: 500 },
    );
  }
}
