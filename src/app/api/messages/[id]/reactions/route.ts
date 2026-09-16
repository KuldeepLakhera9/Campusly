import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Message, Conversation } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
import mongoose from "mongoose";

const ALLOWED_EMOJIS = ["❤️", "🔥", "😂", "👏", "👀", "💡"];

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
        { success: false, error: "Invalid message ID." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { emoji } = body;

    if (!emoji || !ALLOWED_EMOJIS.includes(emoji)) {
      return NextResponse.json(
        { success: false, error: "Invalid emoji reaction." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const messageDoc = await Message.findById(id);
    if (!messageDoc || messageDoc.isDeleted) {
      return NextResponse.json(
        { success: false, error: "Message not found." },
        { status: 404 }
      );
    }

    // Verify user is a conversation participant
    const conversation = await Conversation.findById(messageDoc.conversationId).lean();
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found." },
        { status: 404 }
      );
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUser.id
    );
    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 403 }
      );
    }

    // Initialize reactions array if undefined
    if (!messageDoc.reactions) {
      messageDoc.reactions = [];
    }

    const currentUserIdStr = currentUser.id;
    const existingIndex = messageDoc.reactions.findIndex(
      (r) => r.user.toString() === currentUserIdStr && r.emoji === emoji
    );

    if (existingIndex >= 0) {
      // Toggle off
      messageDoc.reactions.splice(existingIndex, 1);
    } else {
      // Add reaction
      messageDoc.reactions.push({
        user: new mongoose.Types.ObjectId(currentUser.id),
        emoji,
      });
    }

    await messageDoc.save();

    // Group reactions for clean client consumption
    const groupedMap = new Map<string, { count: number; userReacted: boolean }>();
    messageDoc.reactions.forEach((r) => {
      const isUser = r.user.toString() === currentUserIdStr;
      const current = groupedMap.get(r.emoji) || { count: 0, userReacted: false };
      groupedMap.set(r.emoji, {
        count: current.count + 1,
        userReacted: current.userReacted || isUser,
      });
    });

    const formattedReactions = Array.from(groupedMap.entries()).map(([em, val]) => ({
      emoji: em,
      count: val.count,
      userReacted: val.userReacted,
    }));

    return NextResponse.json({
      success: true,
      reactions: formattedReactions,
    });
  } catch (err) {
    console.error("POST /api/messages/[id]/reactions error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update reaction." },
      { status: 500 }
    );
  }
}
