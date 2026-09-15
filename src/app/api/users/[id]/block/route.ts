import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Block, User } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
import mongoose from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserSafe();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID." },
        { status: 400 }
      );
    }

    if (id === currentUser.id) {
      return NextResponse.json(
        { success: false, error: "You cannot block yourself." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const blockerId = new mongoose.Types.ObjectId(currentUser.id);
    const blockedId = new mongoose.Types.ObjectId(id);

    const targetUser = await User.findById(blockedId).lean();
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Target student not found." },
        { status: 404 }
      );
    }

    await Block.findOneAndUpdate(
      { blocker: blockerId, blocked: blockedId },
      { $setOnInsert: { blocker: blockerId, blocked: blockedId, createdAt: new Date() } },
      { upsert: true, returnDocument: "after" }
    );

    return NextResponse.json({
      success: true,
      message: "Student blocked. You will no longer receive messages from this user.",
    });
  } catch (err) {
    console.error("POST /api/users/[id]/block error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to block user." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserSafe();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const blockerId = new mongoose.Types.ObjectId(currentUser.id);
    const blockedId = new mongoose.Types.ObjectId(id);

    await Block.findOneAndDelete({
      blocker: blockerId,
      blocked: blockedId,
    });

    return NextResponse.json({
      success: true,
      message: "Student unblocked.",
    });
  } catch (err) {
    console.error("DELETE /api/users/[id]/block error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to unblock user." },
      { status: 500 }
    );
  }
}
