import { NextResponse } from "next/server";
import { connectToDatabase, getDatabaseState } from "@/lib/db/mongodb";

export async function GET() {
  const dbState = getDatabaseState();

  try {
    const { status, error } = await connectToDatabase();

    return NextResponse.json({
      status: "ok",
      platform: "Campusly Core API",
      timestamp: new Date().toISOString(),
      database: {
        status,
        configured: dbState.hasUri,
        error: error || null,
      },
      version: "Phase 1 Foundation",
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "degraded",
        platform: "Campusly Core API",
        timestamp: new Date().toISOString(),
        database: {
          status: "disconnected",
          configured: dbState.hasUri,
          error: err instanceof Error ? err.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
