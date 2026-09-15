import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Post, Comment, User } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
import { createCommentSchema } from "@/lib/validations/post";
import { checkUserModerationStatus } from "@/lib/auth/admin";
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

    const commentsDoc = await Comment.find({
      post: id,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: 1 })
      .lean();

    const comments = commentsDoc.map((c) => {
      const commentAuthorId = c.author?.toString?.() || "";
      const isAuthor = Boolean(
        currentUser && commentAuthorId === currentUser.id
      );

      return {
        _id: c._id.toString(),
        postId: id,
        content: c.content,
        isAuthor,
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
        author: {
          username: c.authorPseudonym || "Campus Student",
          avatarId: c.authorAvatarId || "terracotta-prism",
          avatarColor: c.authorAvatarColor || "#C15438",
        },
      };
    });

    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (err) {
    console.error("GET /api/posts/[id]/comments error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load comments." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
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
        { success: false, error: "Authentication required to leave a comment." },
        { status: 401 }
      );
    }

    const modCheck = await checkUserModerationStatus(currentUser.id);
    if (!modCheck.allowed) {
      return modCheck.errorResponse!;
    }

    const body = await req.json();
    const parseResult = createCommentSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstIssue?.message || "Invalid comment text." },
        { status: 400 }
      );
    }

    const { content } = parseResult.data;

    await connectToDatabase();

    const postDoc = await Post.findById(id);
    if (!postDoc) {
      return NextResponse.json(
        { success: false, error: "Post not found." },
        { status: 404 }
      );
    }

    const commentDoc = await Comment.create({
      post: id,
      author: currentUser.id,
      authorPseudonym: currentUser.publicIdentity.username,
      authorAvatarId: currentUser.publicIdentity.avatarId,
      authorAvatarColor: currentUser.publicIdentity.avatarColor,
      content,
    });

    // Increment comment count on post
    await Post.findByIdAndUpdate(id, {
      $inc: { commentCount: 1 },
    });

    // Award 1 spark for constructive conversation participation
    await User.findByIdAndUpdate(currentUser.id, {
      $inc: { sparksCount: 1 },
    });

    const sanitizedComment = {
      id: commentDoc._id.toString(),
      _id: commentDoc._id.toString(),
      postId: id,
      content: commentDoc.content,
      isAuthor: true,
      createdAt: commentDoc.createdAt.toISOString(),
      author: {
        username: commentDoc.authorPseudonym,
        avatarId: commentDoc.authorAvatarId,
        avatarColor: commentDoc.authorAvatarColor,
      },
    };

    return NextResponse.json(
      {
        success: true,
        comment: sanitizedComment,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/posts/[id]/comments error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to publish comment." },
      { status: 500 }
    );
  }
}
