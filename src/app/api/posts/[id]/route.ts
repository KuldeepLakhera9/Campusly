import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Post, Comment, Reaction } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid post identifier." },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUserSafe();
    await connectToDatabase();

    const postDoc = await Post.findById(id).lean();
    if (!postDoc) {
      return NextResponse.json(
        { success: false, error: "Post not found." },
        { status: 404 }
      );
    }

    let hasReacted = false;
    if (currentUser) {
      const reactionDoc = await Reaction.findOne({
        post: id,
        user: currentUser.id,
        type: "like",
      }).lean();
      hasReacted = Boolean(reactionDoc);
    }

    const isAuthor = Boolean(
      currentUser && postDoc.author.toString() === currentUser.id
    );

    const sanitizedPost = {
      _id: postDoc._id.toString(),
      content: postDoc.content,
      category: postDoc.category,
      collegeName: postDoc.collegeName,
      collegeDomain: postDoc.collegeDomain,
      reactionCount: postDoc.reactionCount ?? 0,
      commentCount: postDoc.commentCount ?? 0,
      hasReacted,
      isAuthor,
      createdAt: postDoc.createdAt ? new Date(postDoc.createdAt).toISOString() : new Date().toISOString(),
      author: {
        username: postDoc.authorPseudonym,
        avatarId: postDoc.authorAvatarId || "terracotta-prism",
        avatarColor: postDoc.authorAvatarColor || "#C15438",
      },
      // Backward compatibility
      circle: postDoc.category,
      authorPseudonym: postDoc.authorPseudonym,
      authorAvatarColor: postDoc.authorAvatarColor,
      upvotesCount: postDoc.reactionCount ?? 0,
      repliesCount: postDoc.commentCount ?? 0,
      userUpvoted: hasReacted,
      campus: postDoc.collegeName,
    };

    return NextResponse.json({
      success: true,
      post: sanitizedPost,
    });
  } catch (err) {
    console.error("GET /api/posts/[id] error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve post." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid post identifier." },
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

    const postDoc = await Post.findById(id);
    if (!postDoc) {
      return NextResponse.json(
        { success: false, error: "Post not found or already deleted." },
        { status: 404 }
      );
    }

    // Strict ownership verification on server
    if (postDoc.author.toString() !== currentUser.id) {
      return NextResponse.json(
        { success: false, error: "You can only delete your own posts." },
        { status: 403 }
      );
    }

    // Cascade delete post, its comments, and reactions
    await Post.findByIdAndDelete(id);
    await Comment.deleteMany({ post: id });
    await Reaction.deleteMany({ post: id });

    return NextResponse.json({
      success: true,
      message: "Post successfully removed.",
    });
  } catch (err) {
    console.error("DELETE /api/posts/[id] error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete post." },
      { status: 500 }
    );
  }
}
