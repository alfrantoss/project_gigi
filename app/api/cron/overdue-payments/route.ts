import { NextRequest, NextResponse } from "next/server";
import { updateOverduePayments } from "@/utils/overdue";

/**
 * Cron endpoint to check and update overdue payments
 * Can be called by external cron service (e.g., vercel cron, github actions, etc)
 * Authorization: Bearer token in header
 */
export async function POST(request: NextRequest) {
  try {
    // Simple token validation (in production, use more secure method)
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    // Use environment variable for cron secret
    const cronSecret = process.env.CRON_SECRET || "your-secret-key";

    if (token !== cronSecret) {
      return NextResponse.json(
        { error: "Unauthorized - invalid token" },
        { status: 401 },
      );
    }

    const result = await updateOverduePayments();

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process cron job",
      },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint for manual trigger or health check
 */
export async function GET(request: NextRequest) {
  try {
    const result = await updateOverduePayments();

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
      note: "For security, use POST with Bearer token in production",
    });
  } catch (error: any) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process cron job",
      },
      { status: 500 },
    );
  }
}
