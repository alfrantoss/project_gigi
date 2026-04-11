import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const warga = await prisma.warga.findUnique({
      where: { id: params.id },
      include: {
        user: true,
      },
    });

    if (!warga) {
      return NextResponse.json(
        { error: "Warga tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json(warga);
  } catch (error: any) {
    console.error("Get warga error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data warga" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN and KETUA_RT can edit
    if (!["SUPER_ADMIN", "KETUA_RT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      nik,
      nomorRumah,
      alamat,
      rt,
      rw,
      kelurahan,
      kecamatan,
      statusPerkawinan,
      pekerjaan,
      monthlyFee,
      status,
    } = body;

    // Find warga
    const warga = await prisma.warga.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!warga) {
      return NextResponse.json(
        { error: "Warga tidak ditemukan" },
        { status: 404 },
      );
    }

    // Update user and warga
    const [updatedUser, updatedWarga] = await Promise.all([
      prisma.user.update({
        where: { id: warga.userId },
        data: {
          name: name || warga.user.name,
          email: email || warga.user.email,
          phone: phone || warga.user.phone,
        },
      }),
      prisma.warga.update({
        where: { id: params.id },
        data: {
          nik: nik || warga.nik,
          nomorRumah: nomorRumah || warga.nomorRumah,
          alamat: alamat || warga.alamat,
          rt: rt || warga.rt,
          rw: rw || warga.rw,
          kelurahan: kelurahan || warga.kelurahan,
          kecamatan: kecamatan || warga.kecamatan,
          statusPerkawinan: statusPerkawinan || warga.statusPerkawinan,
          pekerjaan: pekerjaan || warga.pekerjaan,
          monthlyFee: monthlyFee || warga.monthlyFee,
          status: status || warga.status,
        },
        include: { user: true },
      }),
    ]);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        module: "WARGA",
        description: `Update data warga ${updatedUser.name}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Data warga berhasil diperbarui",
      warga: updatedWarga,
    });
  } catch (error: any) {
    console.error("Update warga error:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate warga", details: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN can delete
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const warga = await prisma.warga.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!warga) {
      return NextResponse.json(
        { error: "Warga tidak ditemukan" },
        { status: 404 },
      );
    }

    // Delete warga (cascade will delete user)
    await prisma.warga.delete({
      where: { id: params.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        module: "WARGA",
        description: `Hapus data warga ${warga.user.name}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Data warga berhasil dihapus",
    });
  } catch (error: any) {
    console.error("Delete warga error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus warga", details: error.message },
      { status: 500 },
    );
  }
}
