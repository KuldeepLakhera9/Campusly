import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Post, Comment } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string; commentId: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id, commentId } = await params;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(commentId)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid post or comment identifier." },
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

    const commentDoc = await Comment.findById(commentId);
    if (!commentDoc) {
      return NextResponse.json(
        { success: false, error: "Comment not found." },
        { status: 404 }
      );
    }

    // Verify authorship
    if (commentDoc.author.toString() !== currentUser.id) {
      return NextResponse.json(
        { success: false, error: "You can only delete your own comments." },
        { status: 403 }
      );
    }

    await Comment.findByIdAndDelete(commentId);

    // Atomically decrement commentCount on post
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $inc: { commentCount: -1 } },
      { returnDocument: "after" }
    );

    if (updatedPost && updatedPost.commentCount < 0) {
      await Post.findByIdAndUpdate(id, { commentCount: 0 });
    }

    return NextResponse.json({
      success: true,
      message: "Comment successfully removed.",
    });
  } catch (err) {
    console.error("DELETE comment error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete comment." },
      { status: 500 }
    );
  }
}
