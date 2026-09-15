import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Block, User } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
import mongoose from "mongoose";

export async function GET() {
  try {
    const currentUser = await getCurrentUserSafe();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const currentUserId = new mongoose.Types.ObjectId(currentUser.id);

    const blocks = await Block.find({ blocker: currentUserId })
      .sort({ createdAt: -1 })
      .lean();

    if (blocks.length === 0) {
      return NextResponse.json({ success: true, blockedUsers: [] });
    }

    const blockedIds = blocks.map((b) => b.blocked);
    const users = await User.find({ _id: { $in: blockedIds } })
      .select("publicIdentity collegeName")
      .lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const blockedUsers = blocks.map((b) => {
      const u = userMap.get(b.blocked.toString());
      return {
        id: b.blocked.toString(),
        username: u?.publicIdentity?.username || "Student",
        avatarId: u?.publicIdentity?.avatarId || "terracotta-prism",
        avatarColor: u?.publicIdentity?.avatarColor || "#C15438",
        collegeName: u?.collegeName || "Campusly University",
        blockedAt: b.createdAt?.toISOString?.() || new Date(b.createdAt).toISOString(),
      };
    });

    return NextResponse.json({ success: true, blockedUsers });
  } catch (err) {
    console.error("GET /api/users/blocked error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve blocked users." },
      { status: 500 }
    );
  }
}
