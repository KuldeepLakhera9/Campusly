import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/auth/admin";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserSafe();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required to bootstrap admin." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const secret = body.secret || req.headers.get("x-admin-secret");
    const configuredSecret = process.env.ADMIN_BOOTSTRAP_SECRET || "campusly-admin-secret-2026";

    await connectToDatabase();

    // Check if there are existing admins
    const adminCount = await User.countDocuments({ role: "admin" });

    // If admins already exist, secret MUST match
    if (adminCount > 0 && secret !== configuredSecret) {
      return NextResponse.json(
        { success: false, error: "Invalid bootstrap secret." },
        { status: 403 }
      );
    }

    const targetUserId = body.userId || currentUser.id;
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    const previousRole = targetUser.role;
    targetUser.role = "admin";
    targetUser.moderationStatus = "active";
    await targetUser.save();

    await recordAuditLog({
      actor: {
        _id: currentUser.id,
        publicIdentity: { username: currentUser.publicIdentity?.username || "Admin" },
        role: "admin",
      },
      action: "role_changed",
      targetType: "user",
      targetId: targetUser._id,
      reason: "Admin bootstrap initialization",
      metadata: { previousRole, newRole: "admin" },
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.publicIdentity?.username || targetUser.email} has been granted Admin role.`,
      user: {
        id: targetUser._id.toString(),
        role: targetUser.role,
        moderationStatus: targetUser.moderationStatus,
      },
    });
  } catch (err) {
    console.error("POST /api/admin/bootstrap error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to bootstrap admin." },
      { status: 500 }
    );
  }
}
