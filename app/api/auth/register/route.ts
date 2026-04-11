import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone, role = 'WARGA', wargaData } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role,
      },
    });

    if (role === 'WARGA' && wargaData) {
      await prisma.warga.create({
        data: {
          userId: user.id,
          nik: wargaData.nik,
          nomorRumah: wargaData.nomorRumah,
          alamat: wargaData.alamat,
          rt: wargaData.rt || '001',
          rw: wargaData.rw || '001',
          kelurahan: wargaData.kelurahan,
          kecamatan: wargaData.kecamatan,
          statusPerkawinan: wargaData.statusPerkawinan,
          pekerjaan: wargaData.pekerjaan,
          monthlyFee: wargaData.monthlyFee || 50000,
        },
      });
    }

    return NextResponse.json(
      {
        message: 'Registrasi berhasil',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat registrasi' }, { status: 500 });
  }
}
