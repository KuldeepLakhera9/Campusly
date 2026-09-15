import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Hangout } from "@/lib/models";
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
        { success: false, error: "Invalid hangout identifier." },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUserSafe();
    await connectToDatabase();

    const hangoutDoc = await Hangout.findById(id).lean();
    if (!hangoutDoc) {
      return NextResponse.json(
        { success: false, error: "Hangout not found." },
        { status: 404 }
      );
    }

    const creatorIdStr = hangoutDoc.creator?.toString?.() || "";
    const isCreator = Boolean(currentUser && creatorIdStr === currentUser.id);

    const hasJoined = Boolean(
      currentUser &&
        hangoutDoc.participants?.some(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (p: any) => p.userId?.toString?.() === currentUser.id
        )
    );

    const now = new Date();
    let dynamicStatus = hangoutDoc.status;
    if (hangoutDoc.status !== "cancelled") {
      if (hangoutDoc.participantsCount >= hangoutDoc.maxParticipants) {
        dynamicStatus = "full";
      } else if (new Date(hangoutDoc.scheduledAt).getTime() < now.getTime() - 2 * 60 * 60 * 1000) {
        dynamicStatus = "completed";
      } else if (
        new Date(hangoutDoc.scheduledAt).getTime() <= now.getTime() &&
        new Date(hangoutDoc.scheduledAt).getTime() >= now.getTime() - 2 * 60 * 60 * 1000
      ) {
        dynamicStatus = "ongoing";
      }
    }

    const sanitized = {
      _id: hangoutDoc._id.toString(),
      title: hangoutDoc.title,
      description: hangoutDoc.description,
      activity: hangoutDoc.activity,
      location: hangoutDoc.location,
      date: hangoutDoc.date ? new Date(hangoutDoc.date).toISOString() : new Date().toISOString(),
      startTime: hangoutDoc.startTime,
      endTime: hangoutDoc.endTime,
      scheduledAt: hangoutDoc.scheduledAt
        ? new Date(hangoutDoc.scheduledAt).toISOString()
        : new Date().toISOString(),
      maxParticipants: hangoutDoc.maxParticipants,
      participantsCount: hangoutDoc.participantsCount ?? hangoutDoc.participants?.length ?? 1,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      participants: (hangoutDoc.participants || []).map((p: any) => ({
        userId: p.userId?.toString?.() || "",
        pseudonym: p.pseudonym,
        avatarId: p.avatarId || "terracotta-prism",
        avatarColor: p.avatarColor || "#C15438",
        joinedAt: p.joinedAt ? new Date(p.joinedAt).toISOString() : new Date().toISOString(),
      })),
      creator: {
        username: hangoutDoc.creatorPseudonym,
        avatarId: hangoutDoc.creatorAvatarId || "terracotta-prism",
        avatarColor: hangoutDoc.creatorAvatarColor || "#C15438",
      },
      collegeName: hangoutDoc.collegeName,
      collegeDomain: hangoutDoc.collegeDomain,
      status: dynamicStatus,
      isCreator,
      hasJoined,
      createdAt: hangoutDoc.createdAt
        ? new Date(hangoutDoc.createdAt).toISOString()
        : new Date().toISOString(),
      // Backward compatibility
      category: hangoutDoc.activity,
      campus: hangoutDoc.collegeName,
      locationSpot: hangoutDoc.location,
      scheduledTime: hangoutDoc.scheduledAt,
      hostPseudonym: hangoutDoc.creatorPseudonym,
      hostAvatarColor: hangoutDoc.creatorAvatarColor,
    };

    return NextResponse.json({
      success: true,
      hangout: sanitized,
    });
  } catch (err) {
    console.error("GET /api/hangouts/[id] error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load hangout details." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid hangout identifier." },
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

    const hangoutDoc = await Hangout.findById(id);
    if (!hangoutDoc) {
      return NextResponse.json(
        { success: false, error: "Hangout not found." },
        { status: 404 }
      );
    }

    // Strict ownership verification
    if (hangoutDoc.creator.toString() !== currentUser.id) {
      return NextResponse.json(
        { success: false, error: "Only the host can delete this hangout." },
        { status: 403 }
      );
    }

    await Hangout.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Hangout successfully removed.",
    });
  } catch (err) {
    console.error("DELETE /api/hangouts/[id] error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete hangout." },
      { status: 500 }
    );
  }
}
