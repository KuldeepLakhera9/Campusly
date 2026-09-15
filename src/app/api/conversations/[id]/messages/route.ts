import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Conversation, Message, Block } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
import { sendMessageSchema, messageQuerySchema } from "@/lib/validations/message";
import { formatRelativeTime } from "@/lib/utils/formatters";
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

    const { searchParams } = new URL(req.url);
    const parseResult = messageQuerySchema.safeParse({
      limit: searchParams.get("limit") || 30,
      cursor: searchParams.get("cursor") || undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters." },
        { status: 400 }
      );
    }

    const { limit, cursor } = parseResult.data;

    await connectToDatabase();
    const convId = new mongoose.Types.ObjectId(id);

    const conversation = await Conversation.findById(convId).lean();
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found." },
        { status: 404 }
      );
    }

    // Participant authorization enforcement
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUser.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to view messages in this conversation." },
        { status: 403 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = { conversationId: convId };
    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        query.createdAt = { $lt: cursorDate };
      }
    }

    const rawMessages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = rawMessages.length > limit;
    const messagesToReturn = hasMore ? rawMessages.slice(0, limit) : rawMessages;
    const nextCursor =
      hasMore && messagesToReturn.length > 0
        ? messagesToReturn[messagesToReturn.length - 1].createdAt?.toISOString?.() ||
          new Date(messagesToReturn[messagesToReturn.length - 1].createdAt).toISOString()
        : undefined;

    // Reverse to chronological order (oldest to newest)
    const chronological = [...messagesToReturn].reverse();

    const safeMessages = chronological.map((m) => {
      const isCurrentUser = m.sender.toString() === currentUser.id;
      return {
        id: m._id.toString(),
        senderPseudonym: m.senderPseudonym,
        senderAvatarId: m.senderAvatarId,
        senderAvatarColor: m.senderAvatarColor,
        isCurrentUser,
        content: m.isDeleted ? "This message was deleted" : m.content,
        createdAt: m.createdAt?.toISOString?.() || new Date(m.createdAt).toISOString(),
        timestamp: formatRelativeTime(m.createdAt),
        isDeleted: m.isDeleted || false,
      };
    });

    return NextResponse.json({
      success: true,
      messages: safeMessages,
      hasMore,
      nextCursor,
    });
  } catch (err) {
    console.error("GET /api/conversations/[id]/messages error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve messages." },
      { status: 500 }
    );
  }
}

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

    const body = await req.json();
    const parseResult = sendMessageSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstIssue?.message || "Invalid message content." },
        { status: 400 }
      );
    }

    const { content } = parseResult.data;

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

    // Participant authorization enforcement
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUser.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to send messages in this conversation." },
        { status: 403 }
      );
    }

    // Identify recipient
    const recipientId = conversation.participants.find(
      (p) => p.toString() !== currentUser.id
    );

    if (!recipientId) {
      return NextResponse.json(
        { success: false, error: "Conversation recipient missing." },
        { status: 400 }
      );
    }

    // Active block enforcement
    const activeBlock = await Block.findOne({
      $or: [
        { blocker: currentUserId, blocked: recipientId },
        { blocker: recipientId, blocked: currentUserId },
      ],
    }).lean();

    if (activeBlock) {
      return NextResponse.json(
        { success: false, error: "Cannot send message. Messaging is restricted due to a block." },
        { status: 403 }
      );
    }

    // Duplicate message spam protection (3-second cooldown on identical content)
    const recentDuplicate = await Message.findOne({
      conversationId: convId,
      sender: currentUserId,
      content,
      createdAt: { $gte: new Date(Date.now() - 3000) },
    }).lean();

    if (recentDuplicate) {
      return NextResponse.json(
        { success: false, error: "Please wait a moment before sending identical messages." },
        { status: 429 }
      );
    }

    const senderPseudonym =
      currentUser.publicIdentity?.username || `Student${currentUser.id.slice(-4)}`;
    const senderAvatarId =
      currentUser.publicIdentity?.avatarId || "terracotta-prism";
    const senderAvatarColor =
      currentUser.publicIdentity?.avatarColor || "#C15438";

    // Create Message document
    const messageDoc = new Message({
      conversationId: convId,
      sender: currentUserId,
      senderPseudonym,
      senderAvatarId,
      senderAvatarColor,
      content,
      isDeleted: false,
    });
    await messageDoc.save();

    // Update Conversation metadata and current user's lastReadAt
    conversation.lastMessage = {
      content,
      senderId: currentUserId,
      senderPseudonym,
      createdAt: messageDoc.createdAt,
      isDeleted: false,
    };
    conversation.lastMessageAt = messageDoc.createdAt;

    // Update participantMeta
    const metaIndex = conversation.participantMeta.findIndex(
      (m) => m.userId.toString() === currentUser.id
    );
    if (metaIndex >= 0) {
      conversation.participantMeta[metaIndex].lastReadAt = new Date();
    } else {
      conversation.participantMeta.push({
        userId: currentUserId,
        lastReadAt: new Date(),
      });
    }

    await conversation.save();

    return NextResponse.json(
      {
        success: true,
        message: {
          id: messageDoc._id.toString(),
          senderPseudonym: messageDoc.senderPseudonym,
          senderAvatarId: messageDoc.senderAvatarId,
          senderAvatarColor: messageDoc.senderAvatarColor,
          isCurrentUser: true,
          content: messageDoc.content,
          createdAt: messageDoc.createdAt.toISOString(),
          timestamp: "Just now",
          isDeleted: false,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/conversations/[id]/messages error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to send message." },
      { status: 500 }
    );
  }
}
