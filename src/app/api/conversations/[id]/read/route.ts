import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Conversation, Message } from "@/lib/models";
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
        { success: false, error: "Invalid conversation ID." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const convId = new mongoose.Types.ObjectId(id);
    const currentUserId = new mongoose.Types.ObjectId(currentUser.id);

    const conversation = await Conversation.findById(convId);
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found." },
        { status: 404 }
      );
    }

    // Participant check
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUser.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: "You are not a participant in this conversation." },
        { status: 403 }
      );
    }

    const metaIndex = conversation.participantMeta.findIndex(
      (m) => m.userId.toString() === currentUser.id
    );

    const now = new Date();
    if (metaIndex >= 0) {
      conversation.participantMeta[metaIndex].lastReadAt = now;
    } else {
      conversation.participantMeta.push({
        userId: currentUserId,
        lastReadAt: now,
      });
    }

    await conversation.save();

    // Mark all peer messages in this conversation as seen
    await Message.updateMany(
      {
        conversationId: convId,
        sender: { $ne: currentUserId },
        isSeen: false,
      },
      {
        $set: { isSeen: true, seenAt: now },
      }
    );

    return NextResponse.json({ success: true, readAt: now.toISOString() });
  } catch (err) {
    console.error("POST /api/conversations/[id]/read error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to mark conversation as read." },
      { status: 500 }
    );
  }
}
