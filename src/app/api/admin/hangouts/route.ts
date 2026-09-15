import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Hangout } from "@/lib/models";
import { requireModerator, recordAuditLog } from "@/lib/auth/admin";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireModerator();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    await connectToDatabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (status === "deleted") {
      filter.isDeleted = true;
    } else if (status === "active") {
      filter.isDeleted = { $ne: true };
      filter.status = "open";
    } else if (status === "cancelled") {
      filter.status = "cancelled";
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { hostPseudonym: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, hangouts] = await Promise.all([
      Hangout.countDocuments(filter),
      Hangout.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      hangouts: hangouts.map((h) => ({
        id: h._id.toString(),
        title: h.title,
        description: h.description,
        category: h.activity,
        location: h.location,
        scheduledFor: h.scheduledAt,
        status: h.status,
        maxParticipants: h.maxParticipants,
        participantCount: h.participants?.length || 0,
        hostPseudonym: h.creatorPseudonym,
        isDeleted: !!h.isDeleted,
        deletedAt: h.deletedAt,
        deletionReason: h.deletionReason,
        createdAt: h.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/admin/hangouts error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to query hangouts." },
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
    const { hangoutId, action, reason } = body;

    if (!hangoutId || !mongoose.Types.ObjectId.isValid(hangoutId)) {
      return NextResponse.json(
        { success: false, error: "Valid hangoutId is required." },
        { status: 400 }
      );
    }

    if (!action || !["cancel", "remove", "restore"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "action must be 'cancel', 'remove', or 'restore'." },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "A moderation reason of at least 3 characters is required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const hangout = await Hangout.findById(hangoutId);
    if (!hangout) {
      return NextResponse.json(
        { success: false, error: "Hangout not found." },
        { status: 404 }
      );
    }

    if (action === "remove") {
      hangout.isDeleted = true;
      hangout.deletedAt = new Date();
      hangout.deletedBy = auth.adminContext.user._id;
      hangout.deletionReason = reason.trim();
      hangout.status = "cancelled";
      await hangout.save();

      await recordAuditLog({
        actor: auth.adminContext.user,
        action: "hangout_removed",
        targetType: "hangout",
        targetId: hangout._id,
        reason: reason.trim(),
        metadata: { title: hangout.title, hostPseudonym: hangout.hostPseudonym },
      });

      return NextResponse.json({
        success: true,
        message: "Hangout soft-removed and cancelled.",
        hangout: { id: hangout._id.toString(), isDeleted: true, status: hangout.status },
      });
    } else if (action === "cancel") {
      hangout.status = "cancelled";
      await hangout.save();

      await recordAuditLog({
        actor: auth.adminContext.user,
        action: "hangout_cancelled",
        targetType: "hangout",
        targetId: hangout._id,
        reason: reason.trim(),
        metadata: { title: hangout.title },
      });

      return NextResponse.json({
        success: true,
        message: "Hangout cancelled.",
        hangout: { id: hangout._id.toString(), status: "cancelled" },
      });
    } else {
      // restore
      hangout.isDeleted = false;
      hangout.deletedAt = null;
      hangout.deletedBy = null;
      hangout.deletionReason = null;
      hangout.status = "open";
      await hangout.save();

      await recordAuditLog({
        actor: auth.adminContext.user,
        action: "hangout_restored",
        targetType: "hangout",
        targetId: hangout._id,
        reason: reason.trim(),
        metadata: { title: hangout.title },
      });

      return NextResponse.json({
        success: true,
        message: "Hangout restored to active status.",
        hangout: { id: hangout._id.toString(), isDeleted: false, status: "open" },
      });
    }
  } catch (err) {
    console.error("POST /api/admin/hangouts error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to apply hangout moderation action." },
      { status: 500 }
    );
  }
}
