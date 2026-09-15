import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Hangout, User } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
import { checkUserModerationStatus } from "@/lib/auth/admin";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
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
        { success: false, error: "Please log in to join campus hangouts." },
        { status: 401 }
      );
    }

    const modCheck = await checkUserModerationStatus(currentUser.id);
    if (!modCheck.allowed) {
      return modCheck.errorResponse!;
    }

    await connectToDatabase();
    const userObjectId = new mongoose.Types.ObjectId(currentUser.id);

    // Database-level atomic capacity check and reservation
    const updatedHangout = await Hangout.findOneAndUpdate(
      {
        _id: id,
        status: "open",
        "participants.userId": { $ne: userObjectId },
        $expr: { $lt: [{ $size: "$participants" }, "$maxParticipants"] },
      },
      {
        $push: {
          participants: {
            userId: userObjectId,
            pseudonym: currentUser.publicIdentity.username,
            avatarId: currentUser.publicIdentity.avatarId,
            avatarColor: currentUser.publicIdentity.avatarColor,
            joinedAt: new Date(),
          },
        },
        $inc: { participantsCount: 1 },
      },
      { returnDocument: "after" }
    );

    if (!updatedHangout) {
      // Find reason for failure to provide clear user feedback
      const existing = await Hangout.findById(id).lean();
      if (!existing) {
        return NextResponse.json(
          { success: false, error: "Hangout not found." },
          { status: 404 }
        );
      }

      if (existing.status === "cancelled") {
        return NextResponse.json(
          { success: false, error: "This hangout has been cancelled by the host." },
          { status: 400 }
        );
      }

      const alreadyJoined = existing.participants?.some(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any) => p.userId?.toString?.() === currentUser.id
      );
      if (alreadyJoined) {
        return NextResponse.json(
          { success: false, error: "You have already joined this hangout." },
          { status: 400 }
        );
      }

      if (
        (existing.participantsCount ?? 0) >= existing.maxParticipants ||
        (existing.participants?.length ?? 0) >= existing.maxParticipants
      ) {
        return NextResponse.json(
          { success: false, error: "This hangout has reached its maximum capacity." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Unable to join hangout at this time." },
        { status: 400 }
      );
    }

    // If capacity reached, transition status to 'full'
    if (updatedHangout.participants.length >= updatedHangout.maxParticipants) {
      await Hangout.findByIdAndUpdate(id, { status: "full" });
    }

    // Award 1 spark for real-world campus participation
    await User.findByIdAndUpdate(currentUser.id, {
      $inc: { sparksCount: 1 },
    });

    return NextResponse.json({
      success: true,
      message: "You've joined this hangout! See you on campus.",
      participantsCount: updatedHangout.participants.length,
      status:
        updatedHangout.participants.length >= updatedHangout.maxParticipants
          ? "full"
          : "open",
    });
  } catch (err) {
    console.error("POST /api/hangouts/[id]/join error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to join hangout." },
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
    const userObjectId = new mongoose.Types.ObjectId(currentUser.id);

    const existing = await Hangout.findById(id).lean();
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Hangout not found." },
        { status: 404 }
      );
    }

    // Creator rule: Creator cannot leave their own hangout (leaves it ownerless)
    if (existing.creator?.toString() === currentUser.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Hosts cannot leave their own hangout. You can cancel the hangout instead.",
        },
        { status: 400 }
      );
    }

    const wasJoined = existing.participants?.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) => p.userId?.toString?.() === currentUser.id
    );
    if (!wasJoined) {
      return NextResponse.json(
        { success: false, error: "You are not a participant in this hangout." },
        { status: 400 }
      );
    }

    // Atomically pull participant and decrement count
    const updated = await Hangout.findOneAndUpdate(
      { _id: id, "participants.userId": userObjectId },
      {
        $pull: { participants: { userId: userObjectId } },
        $inc: { participantsCount: -1 },
      },
      { returnDocument: "after" }
    );

    // If was full and a spot opened, revert to 'open'
    if (
      updated &&
      updated.status === "full" &&
      updated.participants.length < updated.maxParticipants
    ) {
      await Hangout.findByIdAndUpdate(id, { status: "open" });
    }

    return NextResponse.json({
      success: true,
      message: "You have left this hangout.",
      participantsCount: updated?.participants.length ?? 0,
      status:
        updated && updated.participants.length < updated.maxParticipants
          ? "open"
          : updated?.status ?? "open",
    });
  } catch (err) {
    console.error("DELETE /api/hangouts/[id]/join error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to leave hangout." },
      { status: 500 }
    );
  }
}
