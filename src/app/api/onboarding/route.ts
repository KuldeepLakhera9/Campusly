import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/models/User";
import { onboardingSchema } from "@/lib/validations/auth";
import { getCurrentUserSafe, createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { validateUsernameFormat } from "@/lib/utils/pseudonym";
import { isUsernameAvailable } from "@/lib/db/username";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserSafe();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parseResult = onboardingSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstIssue?.message || "Invalid onboarding details." },
        { status: 400 }
      );
    }

    const { username, avatarId, avatarColor, bio, interests } = parseResult.data;

    // Check username format and uniqueness
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
        { success: false, error: "This username is already taken by another student." },
        { status: 409 }
      );
    }

    await connectToDatabase();

    const updatedUser = await User.findByIdAndUpdate(
      currentUser.id,
      {
        $set: {
          "publicIdentity.username": username.trim(),
          "publicIdentity.avatarId": avatarId,
          "publicIdentity.avatarColor": avatarColor,
          "publicIdentity.bio": bio.trim(),
          "publicIdentity.interests": interests,
          onboardingCompleted: true,
        },
      },
      { new: true }
    ).lean();

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "User account not found." },
        { status: 404 }
      );
    }

    // Refresh session cookie with onboardingCompleted: true
    const token = await createSessionToken({
      userId: updatedUser._id.toString(),
      role: updatedUser.role,
      onboardingCompleted: true,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser._id.toString(),
        onboardingCompleted: true,
        role: updatedUser.role,
        college: {
          name: updatedUser.collegeName,
          domain: updatedUser.collegeDomain,
        },
        publicIdentity: updatedUser.publicIdentity,
      },
    });
  } catch (err) {
    console.error("Onboarding submission error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to save your campus identity. Please try again." },
      { status: 500 }
    );
  }
}
