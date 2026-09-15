import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User, AuditLog } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
import { AdminRole, AuditAction } from "@/types/admin";
import mongoose from "mongoose";

export interface AuthenticatedAdminContext {
  user: {
    _id: mongoose.Types.ObjectId;
    id: string;
    role: AdminRole;
    email: string;
    collegeName: string;
    collegeDomain: string;
    publicIdentity: {
      username: string;
      avatarId: string;
      avatarColor: string;
    };
    moderationStatus: string;
  };
}

/**
 * Server-side authorization guard for Moderator or Admin access.
 * Derives authenticated actor securely from session and verifies role in MongoDB.
 */
export async function requireModerator(): Promise<
  { errorResponse: NextResponse; adminContext?: never } |
  { errorResponse?: never; adminContext: AuthenticatedAdminContext }
> {
  const currentUser = await getCurrentUserSafe();
  if (!currentUser) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  await connectToDatabase();
  const userDoc = await User.findById(currentUser.id).lean();

  if (!userDoc) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "User account not found." },
        { status: 401 }
      ),
    };
  }

  if (userDoc.moderationStatus === "banned") {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "Account is banned from Campusly." },
        { status: 403 }
      ),
    };
  }

  if (userDoc.role !== "moderator" && userDoc.role !== "admin") {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "Moderator authorization required." },
        { status: 403 }
      ),
    };
  }

  return {
    adminContext: {
      user: {
        _id: userDoc._id as mongoose.Types.ObjectId,
        id: userDoc._id.toString(),
        role: userDoc.role as AdminRole,
        email: userDoc.email,
        collegeName: userDoc.collegeName,
        collegeDomain: userDoc.collegeDomain,
        publicIdentity: {
          username: userDoc.publicIdentity?.username || "Staff",
          avatarId: userDoc.publicIdentity?.avatarId || "terracotta-prism",
          avatarColor: userDoc.publicIdentity?.avatarColor || "#C15438",
        },
        moderationStatus: userDoc.moderationStatus || "active",
      },
    },
  };
}

/**
 * Server-side authorization guard specifically requiring Administrator role.
 */
export async function requireAdmin(): Promise<
  { errorResponse: NextResponse; adminContext?: never } |
  { errorResponse?: never; adminContext: AuthenticatedAdminContext }
> {
  const modResult = await requireModerator();
  if (modResult.errorResponse) {
    return modResult;
  }

  if (modResult.adminContext.user.role !== "admin") {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "Administrator authorization required." },
        { status: 403 }
      ),
    };
  }

  return modResult;
}

/**
 * Server-side moderation status barrier.
 * Verifies if user is suspended or banned before permitting action.
 * Automatically lifts suspensions whose expiry timestamp has passed.
 */
export async function checkUserModerationStatus(
  userId: string | mongoose.Types.ObjectId
): Promise<{ allowed: boolean; reason?: string; errorResponse?: NextResponse }> {
  await connectToDatabase();
  const user = await User.findById(userId).select("moderationStatus suspensionExpiresAt").lean();

  if (!user) {
    const errorMsg = "User account not found.";
    return {
      allowed: false,
      reason: errorMsg,
      errorResponse: NextResponse.json(
        { success: false, error: errorMsg },
        { status: 404 }
      ),
    };
  }

  if (user.moderationStatus === "banned") {
    const errorMsg = "Account permanently banned due to community guidelines violation.";
    return {
      allowed: false,
      reason: errorMsg,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: errorMsg,
          code: "BANNED",
        },
        { status: 403 }
      ),
    };
  }

  if (user.moderationStatus === "suspended") {
    const expiresAt = user.suspensionExpiresAt ? new Date(user.suspensionExpiresAt) : null;
    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      // Suspension expired: auto-lift
      await User.findByIdAndUpdate(userId, {
        $set: {
          moderationStatus: "active",
          suspensionExpiresAt: null,
        },
      });
      return { allowed: true };
    }

    // Suspension is still active
    const errorMsg = "Account temporarily suspended.";
    return {
      allowed: false,
      reason: errorMsg,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: errorMsg,
          code: "SUSPENDED",
          expiresAt: expiresAt ? expiresAt.toISOString() : undefined,
        },
        { status: 403 }
      ),
    };
  }

  return { allowed: true };
}

/**
 * Helper to record an immutable administrative audit action.
 */
export async function recordAuditLog({
  actor,
  action,
  targetType,
  targetId,
  reason,
  metadata = {},
}: {
  actor: {
    _id: mongoose.Types.ObjectId | string;
    publicIdentity: { username: string };
    role: AdminRole;
  };
  action: AuditAction | string;
  targetType: "report" | "post" | "comment" | "hangout" | "user" | "message";
  targetId: string | mongoose.Types.ObjectId;
  reason?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await connectToDatabase();
    const actorId =
      typeof actor._id === "string"
        ? new mongoose.Types.ObjectId(actor._id)
        : actor._id;

    await AuditLog.create({
      actor: actorId,
      actorPseudonym: actor.publicIdentity.username,
      actorRole: actor.role,
      action,
      targetType,
      targetId: targetId.toString(),
      reason: reason || "",
      metadata,
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
