import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/models";
import { requireModerator, recordAuditLog } from "@/lib/auth/admin";
import { userModerationActionSchema } from "@/lib/validations/admin";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireModerator();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parseResult = userModerationActionSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstIssue?.message || "Invalid moderation request." },
        { status: 400 }
      );
    }

    const { action, duration, durationHours, reason, moderationNote, targetRole } = parseResult.data;

    // Self-action barrier: Cannot moderate oneself
    if (id === auth.adminContext.user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot perform moderation actions on your own account." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    // Role safety hierarchy:
    // 1. Moderators cannot moderate other moderators or admins
    if (
      auth.adminContext.user.role === "moderator" &&
      (targetUser.role === "moderator" || targetUser.role === "admin")
    ) {
      return NextResponse.json(
        { success: false, error: "Moderators cannot take actions against other staff members." },
        { status: 403 }
      );
    }

    // 2. Only Admins can permanently ban or change roles
    if (action === "ban" || action === "change_role") {
      if (auth.adminContext.user.role !== "admin") {
        return NextResponse.json(
          { success: false, error: `Only administrators can perform ${action}.` },
          { status: 403 }
        );
      }
    }

    const previousStatus = targetUser.moderationStatus || "active";
    const previousRole = targetUser.role || "student";

    switch (action) {
      case "warn": {
        targetUser.moderationStatus = "warned";
        targetUser.lastWarnedAt = new Date();
        if (moderationNote) targetUser.moderationNote = moderationNote;
        await targetUser.save();

        await recordAuditLog({
          actor: auth.adminContext.user,
          action: "user_warned",
          targetType: "user",
          targetId: targetUser._id,
          reason,
          metadata: { previousStatus, note: moderationNote },
        });

        return NextResponse.json({
          success: true,
          message: `Formal warning issued to ${targetUser.publicIdentity?.username || targetUser.email}.`,
          user: {
            id: targetUser._id.toString(),
            moderationStatus: targetUser.moderationStatus,
            lastWarnedAt: targetUser.lastWarnedAt,
          },
        });
      }

      case "suspend": {
        let hours = 24; // default 24h
        if (duration === "1h") hours = 1;
        else if (duration === "24h") hours = 24;
        else if (duration === "3d") hours = 72;
        else if (duration === "7d") hours = 168;
        else if (duration === "30d") hours = 720;
        else if (duration === "custom" && durationHours) hours = durationHours;

        const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

        targetUser.moderationStatus = "suspended";
        targetUser.suspensionExpiresAt = expiresAt;
        if (moderationNote) targetUser.moderationNote = moderationNote;
        await targetUser.save();

        await recordAuditLog({
          actor: auth.adminContext.user,
          action: "user_suspended",
          targetType: "user",
          targetId: targetUser._id,
          reason,
          metadata: {
            previousStatus,
            durationHours: hours,
            suspensionExpiresAt: expiresAt.toISOString(),
            note: moderationNote,
          },
        });

        return NextResponse.json({
          success: true,
          message: `User suspended for ${hours} hour(s) until ${expiresAt.toLocaleString()}.`,
          user: {
            id: targetUser._id.toString(),
            moderationStatus: targetUser.moderationStatus,
            suspensionExpiresAt: targetUser.suspensionExpiresAt,
          },
        });
      }

      case "ban": {
        targetUser.moderationStatus = "banned";
        targetUser.bannedAt = new Date();
        targetUser.bannedBy = auth.adminContext.user.id;
        targetUser.suspensionExpiresAt = null;
        if (moderationNote) targetUser.moderationNote = moderationNote;
        await targetUser.save();

        await recordAuditLog({
          actor: auth.adminContext.user,
          action: "user_banned",
          targetType: "user",
          targetId: targetUser._id,
          reason,
          metadata: { previousStatus, note: moderationNote },
        });

        return NextResponse.json({
          success: true,
          message: `User permanently banned from Campusly.`,
          user: {
            id: targetUser._id.toString(),
            moderationStatus: targetUser.moderationStatus,
            bannedAt: targetUser.bannedAt,
          },
        });
      }

      case "unban": {
        targetUser.moderationStatus = "active";
        targetUser.suspensionExpiresAt = null;
        targetUser.bannedAt = null;
        targetUser.bannedBy = null;
        if (moderationNote) targetUser.moderationNote = moderationNote;
        await targetUser.save();

        await recordAuditLog({
          actor: auth.adminContext.user,
          action: "user_unbanned",
          targetType: "user",
          targetId: targetUser._id,
          reason,
          metadata: { previousStatus, note: moderationNote },
        });

        return NextResponse.json({
          success: true,
          message: `User restrictions lifted and status reset to active.`,
          user: {
            id: targetUser._id.toString(),
            moderationStatus: targetUser.moderationStatus,
          },
        });
      }

      case "change_role": {
        if (!targetRole) {
          return NextResponse.json(
            { success: false, error: "Target role must be specified." },
            { status: 400 }
          );
        }

        targetUser.role = targetRole;
        await targetUser.save();

        await recordAuditLog({
          actor: auth.adminContext.user,
          action: "role_changed",
          targetType: "user",
          targetId: targetUser._id,
          reason,
          metadata: { previousRole, newRole: targetRole },
        });

        return NextResponse.json({
          success: true,
          message: `Role changed to ${targetRole}.`,
          user: {
            id: targetUser._id.toString(),
            role: targetUser.role,
          },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Unsupported moderation action." },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("POST /api/admin/users/[id]/moderation error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to apply moderation action." },
      { status: 500 }
    );
  }
}
