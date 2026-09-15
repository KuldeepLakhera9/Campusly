import { NextResponse } from "next/server";
import { generateUniqueUsername } from "@/lib/db/username";

export async function GET() {
  try {
    const username = await generateUniqueUsername();
    return NextResponse.json({
      success: true,
      username,
    });
  } catch (err) {
    console.error("Generate username error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate unique username." },
      { status: 500 }
    );
  }
}
