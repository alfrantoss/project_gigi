import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * DEBUG ENDPOINT - Remove after troubleshooting
 * This endpoint helps diagnose session issues
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log("=== SESSION DEBUG ===");
    console.log("Session exists:", !!session);
    console.log("Session user:", session?.user);
    console.log("Session token ID:", session?.user?.id);
    console.log("Full session:", JSON.stringify(session, null, 2));
    
    if (!session) {
      return NextResponse.json({ 
        error: "Sesi tidak ditemukan",
        solution: "Silakan masuk kembali"
      }, { status: 401 });
    }

    // Check if user exists in database
    let userInDb = null;
    if (session.user?.id) {
      userInDb = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        }
      });
    }

    // Try to find by email as fallback
    let userByEmail = null;
    if (session.user?.email) {
      userByEmail = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        }
      });
    }

    return NextResponse.json({
      session: {
        exists: !!session,
        user: session.user,
        hasId: !!session.user?.id,
        hasEmail: !!session.user?.email,
      },
      database: {
        userById: userInDb,
        userByEmail: userByEmail,
        idMatch: userInDb?.id === session.user?.id,
      },
      diagnosis: {
        sessionValid: !!session,
        userIdInSession: !!session.user?.id,
        userFoundById: !!userInDb,
        userFoundByEmail: !!userByEmail,
        problem: !userInDb ? "User ID in session does not match database" : null,
        solution: !userInDb ? "Logout and login again to refresh session" : "Session is valid"
      }
    });
  } catch (error) {
    console.error("Debug session error:", error);
    return NextResponse.json(
      { error: "Debug gagal", details: String(error) },
      { status: 500 },
    );
  }
}
