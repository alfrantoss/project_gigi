import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcrypt";
import { generateWargaExcel } from "@/utils/excel-generator";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const exportData = searchParams.get("export") === "true";

    const where: any = {};

    if (search) {
      where.OR = [
        { nik: { contains: search, mode: "insensitive" } },
        { nomorRumah: { contains: search, mode: "insensitive" } },
        { alamat: { contains: search, mode: "insensitive" } },
        {
          user: {
            name: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    // Jika export, ambil semua data tanpa pagination
    if (exportData) {
      const allWarga = await prisma.warga.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
        },
        orderBy: {
          nomorRumah: "asc",
        },
      });

      const buffer = generateWargaExcel(allWarga);

      return new NextResponse(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="data_warga_${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      });
    }

    const [warga, total] = await Promise.all([
      prisma.warga.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
        },
        orderBy: {
          nomorRumah: "asc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.warga.count({ where }),
    ]);

    const stats = {
      totalWarga: await prisma.warga.count(),
      totalActive: await prisma.warga.count({
        where: { user: { isActive: true } },
      }),
      totalDebt:
        (
          await prisma.warga.aggregate({
            _sum: { totalDebt: true },
          })
        )._sum.totalDebt || 0,
      totalPaid:
        (
          await prisma.warga.aggregate({
            _sum: { totalPaid: true },
          })
        )._sum.totalPaid || 0,
    };

    return NextResponse.json({
      warga,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats,
    });
  } catch (error) {
    console.error("Get warga error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "KETUA_RT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      password,
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
    } = body;

    if (!name || !email || !password || !nik || !nomorRumah || !alamat) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 },
      );
    }

    const existingWarga = await prisma.warga.findUnique({
      where: { nik },
    });

    if (existingWarga) {
      return NextResponse.json(
        { error: "NIK sudah terdaftar" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: "WARGA",
        warga: {
          create: {
            nik,
            nomorRumah,
            alamat,
            rt: rt || "001",
            rw: rw || "001",
            kelurahan,
            kecamatan,
            statusPerkawinan,
            pekerjaan,
            monthlyFee: monthlyFee || 50000,
          },
        },
      },
      include: {
        warga: true,
      },
    });

    return NextResponse.json(
      {
        message: "Data warga berhasil ditambahkan",
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create warga error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menambahkan data warga" },
      { status: 500 },
    );
  }
}
