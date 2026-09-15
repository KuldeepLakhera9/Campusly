import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Conversation, User, Block } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
import mongoose from "mongoose";

export async function GET(
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
        { success: false, error: "Invalid conversation ID." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const currentUserId = new mongoose.Types.ObjectId(currentUser.id);
    const convId = new mongoose.Types.ObjectId(id);

    const conversation = await Conversation.findById(convId).lean();
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found." },
        { status: 404 }
      );
    }

    // Critical Authorization Check: User must be a participant!
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUser.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to view this private conversation." },
        { status: 403 }
      );
    }

    // Identify other participant
    const otherId = conversation.participants
      .find((p) => p.toString() !== currentUser.id)
      ?.toString();

    let otherUserData = null;
    if (otherId) {
      otherUserData = await User.findById(otherId)
        .select("publicIdentity collegeName")
        .lean();
    }

    // Check block status
    let isBlockedByMe = false;
    let isBlockedByOther = false;
    if (otherId) {
      const otherObjectId = new mongoose.Types.ObjectId(otherId);
      const blocks = await Block.find({
        $or: [
          { blocker: currentUserId, blocked: otherObjectId },
          { blocker: otherObjectId, blocked: currentUserId },
        ],
      }).lean();

      isBlockedByMe = blocks.some(
        (b) => b.blocker.toString() === currentUser.id
      );
      isBlockedByOther = blocks.some(
        (b) => b.blocked.toString() === currentUser.id
      );
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation._id.toString(),
        otherUser: {
          userId: otherId || "",
          username: otherUserData?.publicIdentity?.username || "Student",
          avatarId: otherUserData?.publicIdentity?.avatarId || "terracotta-prism",
          avatarColor: otherUserData?.publicIdentity?.avatarColor || "#C15438",
          bio: otherUserData?.publicIdentity?.bio || "",
          interests: otherUserData?.publicIdentity?.interests || [],
          collegeName: otherUserData?.collegeName || "Campusly University",
        },
        status: isBlockedByMe || isBlockedByOther ? "blocked" : conversation.status || "active",
        isBlockedByMe,
        isBlockedByOther,
        createdAt: conversation.createdAt?.toISOString?.() || new Date(conversation.createdAt).toISOString(),
        updatedAt: conversation.updatedAt?.toISOString?.() || new Date(conversation.updatedAt).toISOString(),
      },
    });
  } catch (err) {
    console.error("GET /api/conversations/[id] error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve conversation." },
      { status: 500 }
    );
  }
}
