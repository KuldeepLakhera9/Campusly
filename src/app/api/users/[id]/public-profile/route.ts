import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User, Hangout, Post } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
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
        { success: false, error: "Invalid student ID." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const targetId = new mongoose.Types.ObjectId(id);

    const user = await User.findById(targetId)
      .select("publicIdentity collegeName sparksCount createdAt")
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Student not found." },
        { status: 404 }
      );
    }

    // Optional activity counts
    const [postsCount, hangoutsCount] = await Promise.all([
      Post.countDocuments({ author: targetId }),
      Hangout.countDocuments({
        $or: [{ creator: targetId }, { "participants.userId": targetId }],
      }),
    ]);

    // STRICT PRIVACY AUDIT: strictly returns pseudonymous details, no email or passwordHash
    return NextResponse.json({
      success: true,
      profile: {
        id: user._id.toString(),
        username: user.publicIdentity?.username || "Student",
        avatarId: user.publicIdentity?.avatarId || "terracotta-prism",
        avatarColor: user.publicIdentity?.avatarColor || "#C15438",
        bio: user.publicIdentity?.bio || "",
        interests: user.publicIdentity?.interests || [],
        lookingFor: user.publicIdentity?.lookingFor || [],
        sparksCount: user.sparksCount || 0,
        collegeName: user.collegeName || "Campusly University",
        isCurrentUser: user._id.toString() === currentUser.id,
        stats: {
          posts: postsCount,
          hangouts: hangoutsCount,
        },
      },
    });
  } catch (err) {
    console.error("GET /api/users/[id]/public-profile error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve public profile." },
      { status: 500 }
    );
  }
}
