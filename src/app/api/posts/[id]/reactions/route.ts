import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Post, Reaction } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
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
        { success: false, error: "Please log in to react to posts." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const postDoc = await Post.findById(id);
    if (!postDoc) {
      return NextResponse.json(
        { success: false, error: "Post not found." },
        { status: 404 }
      );
    }

    const existingReaction = await Reaction.findOne({
      post: id,
      user: currentUser.id,
      type: "like",
    });

    if (existingReaction) {
      // Toggle OFF (Unlike)
      await Reaction.deleteOne({ _id: existingReaction._id });
      const updatedPost = await Post.findByIdAndUpdate(
        id,
        { $inc: { reactionCount: -1 } },
        { returnDocument: "after" }
      );

      // Ensure reactionCount doesn't dip below 0
      const finalCount = Math.max(0, updatedPost?.reactionCount ?? 0);
      if (updatedPost && updatedPost.reactionCount < 0) {
        await Post.findByIdAndUpdate(id, { reactionCount: 0 });
      }

      return NextResponse.json({
        success: true,
        reacted: false,
        reactionCount: finalCount,
      });
    } else {
      // Toggle ON (Like)
      await Reaction.create({
        post: id,
        user: currentUser.id,
        type: "like",
      });

      const updatedPost = await Post.findByIdAndUpdate(
        id,
        { $inc: { reactionCount: 1 } },
        { returnDocument: "after" }
      );

      return NextResponse.json({
        success: true,
        reacted: true,
        reactionCount: updatedPost?.reactionCount ?? 1,
      });
    }
  } catch (err) {
    console.error("POST /api/posts/[id]/reactions error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update reaction." },
      { status: 500 }
    );
  }
}
