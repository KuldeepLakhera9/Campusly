import { NextResponse } from "next/server";
import { getCurrentUserSafe } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUserSafe();

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (err) {
    console.error("Auth me error:", err);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 500 }
    );
  }
}
