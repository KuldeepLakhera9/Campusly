import { NextRequest, NextResponse } from "next/server";
import { validateUsernameFormat } from "@/lib/utils/pseudonym";
import { isUsernameAvailable } from "@/lib/db/username";
import { getCurrentUserSafe } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { available: false, error: "Username parameter is required." },
        { status: 400 }
      );
    }

    const formatCheck = validateUsernameFormat(username);
    if (!formatCheck.isValid) {
      return NextResponse.json({
        available: false,
        error: formatCheck.message,
      });
    }

    // If caller is logged in and checking their own username, allow it
    const currentUser = await getCurrentUserSafe();
    const available = await isUsernameAvailable(username, currentUser?.id);

    return NextResponse.json({
      available,
      error: available ? null : "This username is already taken on campus.",
    });
  } catch (err) {
    console.error("Check username error:", err);
    return NextResponse.json(
      { available: false, error: "Could not check username." },
      { status: 500 }
    );
  }
}
