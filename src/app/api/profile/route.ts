import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/models/User";
import { Post } from "@/lib/models/Post";
import { Hangout } from "@/lib/models/Hangout";
import { getCurrentUserSafe } from "@/lib/auth/session";
import { updateProfileSchema } from "@/lib/validations/auth";
import { validateUsernameFormat } from "@/lib/utils/pseudonym";
import { isUsernameAvailable } from "@/lib/db/username";

export async function GET() {
  try {
    const currentUser = await getCurrentUserSafe();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Query real public stats
    const postsCount = await Post.countDocuments({
      $or: [
        { author: currentUser.id },
        { authorPseudonym: currentUser.publicIdentity.username },
      ],
    });

    const hangoutsCount = await Hangout.countDocuments({
      $or: [
        { creator: currentUser.id },
        { "participants.userId": currentUser.id },
        { hostPseudonym: currentUser.publicIdentity.username },
      ],
    });

    return NextResponse.json({
      success: true,
      profile: {
        ...currentUser,
        stats: {
          posts: postsCount,
          hangouts: hangoutsCount,
          sparks: currentUser.sparksCount,
        },
      },
    });
  } catch (err) {
    console.error("Profile GET error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve profile." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserSafe();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parseResult = updateProfileSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstIssue?.message || "Invalid update data." },
        { status: 400 }
      );
    }

    const {
      username,
      avatarId,
      avatarColor,
      bio,
      interests,
      lookingFor,
      privacySettings,
    } = parseResult.data;

    const updateFields: Record<string, unknown> = {};

    if (username && username !== currentUser.publicIdentity.username) {
      const formatCheck = validateUsernameFormat(username);
      if (!formatCheck.isValid) {
        return NextResponse.json(
          { success: false, error: formatCheck.message },
          { status: 400 }
        );
      }

      const available = await isUsernameAvailable(username, currentUser.id);
      if (!available) {
        return NextResponse.json(
          { success: false, error: "This username is already taken." },
          { status: 409 }
        );
      }
      updateFields["publicIdentity.username"] = username.trim();
    }

    if (avatarId) updateFields["publicIdentity.avatarId"] = avatarId;
    if (avatarColor) updateFields["publicIdentity.avatarColor"] = avatarColor;
    if (typeof bio === "string") updateFields["publicIdentity.bio"] = bio.trim();
    if (interests) updateFields["publicIdentity.interests"] = interests;
    if (lookingFor) updateFields["publicIdentity.lookingFor"] = lookingFor;
    if (privacySettings) {
      if (typeof privacySettings.hideMajor === "boolean") {
        updateFields["privacySettings.hideMajor"] = privacySettings.hideMajor;
      }
      if (typeof privacySettings.allowDirectMessages === "boolean") {
        updateFields["privacySettings.allowDirectMessages"] =
          privacySettings.allowDirectMessages;
      }
      if (typeof privacySettings.revealNameOnMutualFollow === "boolean") {
        updateFields["privacySettings.revealNameOnMutualFollow"] =
          privacySettings.revealNameOnMutualFollow;
      }
      if (typeof privacySettings.autoExpireHangouts === "boolean") {
        updateFields["privacySettings.autoExpireHangouts"] =
          privacySettings.autoExpireHangouts;
      }
      if (typeof privacySettings.appearInFindPeople === "boolean") {
        updateFields["privacySettings.appearInFindPeople"] =
          privacySettings.appearInFindPeople;
      }
      if (typeof privacySettings.showInterests === "boolean") {
        updateFields["privacySettings.showInterests"] =
          privacySettings.showInterests;
      }
    }

    await connectToDatabase();

    const updated = await User.findByIdAndUpdate(
      currentUser.id,
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Account not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updated._id.toString(),
        onboardingCompleted: Boolean(updated.onboardingCompleted),
        role: updated.role,
        college: {
          name: updated.collegeName,
          domain: updated.collegeDomain,
        },
        publicIdentity: updated.publicIdentity,
        privacySettings: updated.privacySettings,
        sparksCount: updated.sparksCount,
      },
    });
  } catch (err) {
    console.error("Profile PATCH error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update profile." },
      { status: 500 }
    );
  }
}
