import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'KETUA_RT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all warga
    const allWarga = await prisma.user.findMany({
      where: {
        role: 'WARGA',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
      },
    });

    // Filter warga with phone
    const wargaWithPhone = allWarga.filter(w => w.phone);
    const activeWargaWithPhone = allWarga.filter(w => w.isActive && w.phone);

    // Check WA API Key
    const waApiKey = process.env.WA_API_KEY;
    const hasWaApiKey = !!waApiKey;

    // Get from database if not in env
    let dbApiKey = null;
    if (!waApiKey) {
      const setting = await prisma.setting.findUnique({
        where: { key: 'wa_api_key' },
      });
      dbApiKey = setting?.value;
    }

    return NextResponse.json({
      status: 'Debug Info - WhatsApp Configuration',
      totalWarga: allWarga.length,
      wargaWithPhone: wargaWithPhone.length,
      activeWargaWithPhone: activeWargaWithPhone.length,
      apiKeyStatus: {
        fromEnv: hasWaApiKey,
        fromDatabase: !!dbApiKey,
        configured: hasWaApiKey || !!dbApiKey,
      },
      wargaList: allWarga.map(w => ({
        name: w.name,
        email: w.email,
        phone: w.phone || 'NO PHONE',
        isActive: w.isActive,
        willReceiveWA: w.isActive && !!w.phone,
      })),
      note: 'WhatsApp will only be sent to active warga with phone numbers',
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Failed to get debug info' },
      { status: 500 }
    );
  }
}
