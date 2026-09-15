import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Post, Comment } from "@/lib/models";
import { requireModerator, recordAuditLog } from "@/lib/auth/admin";
import { contentQuerySchema, contentModerationActionSchema } from "@/lib/validations/admin";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireModerator();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { searchParams } = new URL(req.url);
    const parseResult = contentQuerySchema.safeParse({
      type: searchParams.get("type") || "post",
      status: searchParams.get("status") || "all",
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters." },
        { status: 400 }
      );
    }

    const { type, status, search, page, limit } = parseResult.data;

    await connectToDatabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (status === "active") {
      filter.isDeleted = { $ne: true };
    } else if (status === "deleted") {
      filter.isDeleted = true;
    }

    if (search) {
      filter.content = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;

    if (type === "post") {
      const [total, posts] = await Promise.all([
        Post.countDocuments(filter),
        Post.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("deletedBy", "publicIdentity role")
          .lean(),
      ]);

      return NextResponse.json({
        success: true,
        type: "post",
        items: posts.map((p) => ({
          id: p._id.toString(),
          content: p.content,
          authorPseudonym: p.authorPseudonym,
          category: p.category,
          reactionCount: p.reactionCount || 0,
          commentCount: p.commentCount || 0,
          isDeleted: !!p.isDeleted,
          deletedAt: p.deletedAt,
          deletionReason: p.deletionReason,
          deletedBy: p.deletedBy
            ? {
                pseudonym: (p.deletedBy as unknown as { publicIdentity?: { username?: string } }).publicIdentity?.username || "Staff",
              }
            : null,
          createdAt: p.createdAt,
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } else {
      const [total, comments] = await Promise.all([
        Comment.countDocuments(filter),
        Comment.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("deletedBy", "publicIdentity role")
          .lean(),
      ]);

      return NextResponse.json({
        success: true,
        type: "comment",
        items: comments.map((c) => ({
          id: c._id.toString(),
          postId: c.post?.toString(),
          content: c.content,
          authorPseudonym: c.authorPseudonym,
          isDeleted: !!c.isDeleted,
          deletedAt: c.deletedAt,
          deletionReason: c.deletionReason,
          deletedBy: c.deletedBy
            ? {
                pseudonym: (c.deletedBy as unknown as { publicIdentity?: { username?: string } }).publicIdentity?.username || "Staff",
              }
            : null,
          createdAt: c.createdAt,
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
  } catch (err) {
    console.error("GET /api/admin/content error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to query content." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireModerator();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const body = await req.json();
    const actionResult = contentModerationActionSchema.safeParse({
      action: body.action,
      reason: body.reason,
    });

    if (!actionResult.success) {
      return NextResponse.json(
        { success: false, error: actionResult.error.issues[0]?.message || "Invalid action." },
        { status: 400 }
      );
    }

    const { targetId, type } = body;
    if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
      return NextResponse.json(
        { success: false, error: "Valid targetId is required." },
        { status: 400 }
      );
    }

    if (type !== "post" && type !== "comment") {
      return NextResponse.json(
        { success: false, error: "type must be 'post' or 'comment'." },
        { status: 400 }
      );
    }

    const { action, reason } = actionResult.data;

    await connectToDatabase();

    const targetObjectId = new mongoose.Types.ObjectId(targetId);

    if (type === "post") {
      const post = await Post.findById(targetObjectId);
      if (!post) {
        return NextResponse.json({ success: false, error: "Post not found." }, { status: 404 });
      }

      if (action === "remove") {
        post.isDeleted = true;
        post.deletedAt = new Date();
        post.deletedBy = auth.adminContext.user._id;
        post.deletionReason = reason;
        await post.save();

        await recordAuditLog({
          actor: auth.adminContext.user,
          action: "post_removed",
          targetType: "post",
          targetId: post._id,
          reason,
          metadata: { authorPseudonym: post.authorPseudonym, category: post.category },
        });

        return NextResponse.json({
          success: true,
          message: "Post soft-removed from campus feed.",
          item: { id: post._id.toString(), isDeleted: true },
        });
      } else {
        post.isDeleted = false;
        post.deletedAt = null;
        post.deletedBy = null;
        post.deletionReason = null;
        await post.save();

        await recordAuditLog({
          actor: auth.adminContext.user,
          action: "post_restored",
          targetType: "post",
          targetId: post._id,
          reason,
          metadata: { authorPseudonym: post.authorPseudonym },
        });

        return NextResponse.json({
          success: true,
          message: "Post restored to campus feed.",
          item: { id: post._id.toString(), isDeleted: false },
        });
      }
    } else {
      const comment = await Comment.findById(targetObjectId);
      if (!comment) {
        return NextResponse.json({ success: false, error: "Comment not found." }, { status: 404 });
      }

      if (action === "remove") {
        comment.isDeleted = true;
        comment.deletedAt = new Date();
        comment.deletedBy = auth.adminContext.user._id;
        comment.deletionReason = reason;
        await comment.save();

        // Decrement parent post commentCount if valid
        await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });

        await recordAuditLog({
          actor: auth.adminContext.user,
          action: "comment_removed",
          targetType: "comment",
          targetId: comment._id,
          reason,
          metadata: { authorPseudonym: comment.authorPseudonym, postId: comment.post?.toString() },
        });

        return NextResponse.json({
          success: true,
          message: "Comment soft-removed.",
          item: { id: comment._id.toString(), isDeleted: true },
        });
      } else {
        comment.isDeleted = false;
        comment.deletedAt = null;
        comment.deletedBy = null;
        comment.deletionReason = null;
        await comment.save();

        // Increment parent post commentCount
        await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: 1 } });

        await recordAuditLog({
          actor: auth.adminContext.user,
          action: "comment_restored",
          targetType: "comment",
          targetId: comment._id,
          reason,
          metadata: { authorPseudonym: comment.authorPseudonym, postId: comment.post?.toString() },
        });

        return NextResponse.json({
          success: true,
          message: "Comment restored.",
          item: { id: comment._id.toString(), isDeleted: false },
        });
      }
    }
  } catch (err) {
    console.error("POST /api/admin/content error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to execute content moderation action." },
      { status: 500 }
    );
  }
}
