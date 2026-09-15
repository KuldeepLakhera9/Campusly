import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Hangout } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid hangout identifier." },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUserSafe();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const hangoutDoc = await Hangout.findById(id);
    if (!hangoutDoc) {
      return NextResponse.json(
        { success: false, error: "Hangout not found." },
        { status: 404 }
      );
    }

    // Host verification
    if (hangoutDoc.creator.toString() !== currentUser.id) {
      return NextResponse.json(
        { success: false, error: "Only the host can cancel this hangout." },
        { status: 403 }
      );
    }

    hangoutDoc.status = "cancelled";
    await hangoutDoc.save();

    return NextResponse.json({
      success: true,
      message: "Hangout has been cancelled.",
      status: "cancelled",
    });
  } catch (err) {
    console.error("POST /api/hangouts/[id]/cancel error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to cancel hangout." },
      { status: 500 }
    );
  }
}
