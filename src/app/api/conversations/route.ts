import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Conversation, Message, Block, User } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
import { createConversationSchema } from "@/lib/validations/message";
import { formatRelativeTime } from "@/lib/utils/formatters";
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

    const conversations = await Conversation.find({
      participants: currentUserId,
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    if (conversations.length === 0) {
      return NextResponse.json({ success: true, conversations: [] });
    }

    // Collect other user IDs
    const otherUserIds = conversations.map((c) => {
      const other = c.participants.find(
        (p) => p.toString() !== currentUser.id
      );
      return other || c.participants[0];
    });

    // Fetch safe profile info for other participants (STRICT PRIVACY: only publicIdentity and college)
    const otherUsers = await User.find({
      _id: { $in: otherUserIds },
    })
      .select("publicIdentity collegeName")
      .lean();

    const userMap = new Map(
      otherUsers.map((u) => [u._id.toString(), u])
    );

    // Fetch active blocks involving currentUser
    const blocks = await Block.find({
      $or: [
        { blocker: currentUserId, blocked: { $in: otherUserIds } },
        { blocker: { $in: otherUserIds }, blocked: currentUserId },
      ],
    }).lean();

    const blockedByMeSet = new Set(
      blocks
        .filter((b) => b.blocker.toString() === currentUser.id)
        .map((b) => b.blocked.toString())
    );
    const blockedMeSet = new Set(
      blocks
        .filter((b) => b.blocked.toString() === currentUser.id)
        .map((b) => b.blocker.toString())
    );

    // Compute unread message counts per conversation
    const summaries = await Promise.all(
      conversations.map(async (conv) => {
        const otherId = conv.participants
          .find((p) => p.toString() !== currentUser.id)
          ?.toString();

        const otherUserData = otherId ? userMap.get(otherId) : null;

        // My lastReadAt timestamp
        const myMeta = conv.participantMeta?.find(
          (m) => m.userId.toString() === currentUser.id
        );
        const lastReadAt = myMeta?.lastReadAt ? new Date(myMeta.lastReadAt) : new Date(0);

        // Count messages sent after lastReadAt by other users that are not deleted
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          sender: { $ne: currentUserId },
          createdAt: { $gt: lastReadAt },
          isDeleted: false,
        });

        const isBlockedByMe = otherId ? blockedByMeSet.has(otherId) : false;
        const isBlockedByOther = otherId ? blockedMeSet.has(otherId) : false;

        return {
          id: conv._id.toString(),
          otherUser: {
            userId: otherId || "",
            username: otherUserData?.publicIdentity?.username || "Student",
            avatarId: otherUserData?.publicIdentity?.avatarId || "terracotta-prism",
            avatarColor: otherUserData?.publicIdentity?.avatarColor || "#C15438",
            bio: otherUserData?.publicIdentity?.bio || "",
            interests: otherUserData?.publicIdentity?.interests || [],
            collegeName: otherUserData?.collegeName || "Campusly University",
          },
          lastMessage: conv.lastMessage
            ? {
                content: conv.lastMessage.isDeleted
                  ? "This message was deleted"
                  : conv.lastMessage.content,
                senderPseudonym: conv.lastMessage.senderPseudonym,
                createdAt: conv.lastMessage.createdAt?.toISOString?.() || new Date(conv.lastMessage.createdAt).toISOString(),
                isDeleted: conv.lastMessage.isDeleted || false,
              }
            : undefined,
          lastMessageTime: conv.lastMessage?.createdAt
            ? formatRelativeTime(conv.lastMessage.createdAt)
            : formatRelativeTime(conv.updatedAt),
          unreadCount,
          status: isBlockedByMe || isBlockedByOther ? "blocked" : conv.status || "active",
          isBlockedByMe,
          isBlockedByOther,
          updatedAt: conv.updatedAt?.toISOString?.() || new Date(conv.updatedAt).toISOString(),
        };
      })
    );

    return NextResponse.json({ success: true, conversations: summaries });
  } catch (err) {
    console.error("GET /api/conversations error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve conversations." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserSafe();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parseResult = createConversationSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstIssue?.message || "Invalid conversation request." },
        { status: 400 }
      );
    }

    const { recipientId } = parseResult.data;

    if (recipientId === currentUser.id) {
      return NextResponse.json(
        { success: false, error: "You cannot message yourself." },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return NextResponse.json(
        { success: false, error: "Invalid recipient ID." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const recipient = await User.findById(recipientId)
      .select("publicIdentity collegeName")
      .lean();

    if (!recipient) {
      return NextResponse.json(
        { success: false, error: "Recipient not found." },
        { status: 404 }
      );
    }

    const currentObjectId = new mongoose.Types.ObjectId(currentUser.id);
    const recipientObjectId = new mongoose.Types.ObjectId(recipientId);

    // Check if either user has blocked the other
    const activeBlock = await Block.findOne({
      $or: [
        { blocker: currentObjectId, blocked: recipientObjectId },
        { blocker: recipientObjectId, blocked: currentObjectId },
      ],
    }).lean();

    if (activeBlock) {
      return NextResponse.json(
        { success: false, error: "Messaging is unavailable due to user blocking restrictions." },
        { status: 403 }
      );
    }

    // Pairwise uniqueness: sort IDs lexicographically
    const [firstId, secondId] = [currentUser.id, recipientId].sort();
    const userA = new mongoose.Types.ObjectId(firstId);
    const userB = new mongoose.Types.ObjectId(secondId);

    let conversation = await Conversation.findOne({ userA, userB });

    let isNew = false;
    if (!conversation) {
      conversation = new Conversation({
        participants: [userA, userB],
        userA,
        userB,
        participantMeta: [
          { userId: currentObjectId, lastReadAt: new Date() },
          { userId: recipientObjectId, lastReadAt: new Date(0) },
        ],
        lastMessageAt: new Date(),
        status: "active",
      });
      await conversation.save();
      isNew = true;
    }

    return NextResponse.json(
      {
        success: true,
        conversation: {
          id: conversation._id.toString(),
          otherUser: {
            userId: recipient._id.toString(),
            username: recipient.publicIdentity?.username || "Student",
            avatarId: recipient.publicIdentity?.avatarId || "terracotta-prism",
            avatarColor: recipient.publicIdentity?.avatarColor || "#C15438",
            bio: recipient.publicIdentity?.bio || "",
            interests: recipient.publicIdentity?.interests || [],
            collegeName: recipient.collegeName || "Campusly University",
          },
          status: conversation.status,
          createdAt: conversation.createdAt?.toISOString?.() || new Date(conversation.createdAt).toISOString(),
          updatedAt: conversation.updatedAt?.toISOString?.() || new Date(conversation.updatedAt).toISOString(),
        },
        isNew,
      },
      { status: isNew ? 201 : 200 }
    );
  } catch (err) {
    console.error("POST /api/conversations error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to initiate conversation." },
      { status: 500 }
    );
  }
}
