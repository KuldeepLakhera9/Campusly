import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Message, Conversation } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
import mongoose from "mongoose";

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
        { success: false, error: "Invalid message ID." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const msgId = new mongoose.Types.ObjectId(id);

    const message = await Message.findById(msgId);
    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message not found." },
        { status: 404 }
      );
    }

    // Authorization: only the sender can delete their message
    if (message.sender.toString() !== currentUser.id) {
      return NextResponse.json(
        { success: false, error: "You can only delete your own messages." },
        { status: 403 }
      );
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    // Check if this was the last message on the conversation
    const conversation = await Conversation.findById(message.conversationId);
    if (
      conversation?.lastMessage &&
      conversation.lastMessage.createdAt &&
      message.createdAt &&
      new Date(conversation.lastMessage.createdAt).getTime() ===
        new Date(message.createdAt).getTime()
    ) {
      conversation.lastMessage.isDeleted = true;
      conversation.lastMessage.content = "This message was deleted";
      await conversation.save();
    }

    return NextResponse.json({
      success: true,
      messageId: id,
      content: "This message was deleted",
      isDeleted: true,
    });
  } catch (err) {
    console.error("DELETE /api/messages/[id] error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete message." },
      { status: 500 }
    );
  }
}
