import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/models/User";
import { College } from "@/lib/models/College";
import { registerSchema } from "@/lib/validations/auth";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { generateUniqueUsername } from "@/lib/db/username";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstIssue?.message || "Invalid input data." },
        { status: 400 }
      );
    }

    const { email, password, collegeName, collegeId } = parseResult.data;

    await connectToDatabase();

    // Prevent duplicate email registrations
    const existingUser = await User.findOne({ email }).select("_id").lean();
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email already exists. Please sign in instead.",
        },
        { status: 409 }
      );
    }

    // Extract domain from email (e.g. student@berkeley.edu -> berkeley.edu)
    const emailDomain = email.split("@")[1]?.toLowerCase() || "college.edu";

    // Lookup college if collegeId was passed, or match by domain
    let matchedCollege = null;
    if (collegeId) {
      matchedCollege = await College.findById(collegeId).lean();
    }
    if (!matchedCollege) {
      matchedCollege = await College.findOne({ domain: emailDomain }).lean();
    }

    const finalCollegeName = matchedCollege?.name || collegeName || "Accredited College";
    const finalCollegeDomain = matchedCollege?.domain || emailDomain;

    // Hash password securely
    const passwordHash = await hashPassword(password);

    // Generate collision-free initial pseudonymous username
    const username = await generateUniqueUsername();

    // Create user document
    const userInstance = new User({
      email,
      passwordHash,
      collegeId: matchedCollege?._id?.toString(),
      collegeName: finalCollegeName,
      collegeDomain: finalCollegeDomain,
      emailVerified: true,
      role: "student",
      status: "active",
      onboardingCompleted: false,
      publicIdentity: {
        username,
        avatarId: "terracotta-prism",
        avatarColor: "#C15438",
        bio: "",
        interests: [],
      },
      sparksCount: 10,
      privacySettings: {
        hideMajor: false,
        allowDirectMessages: true,
        revealNameOnMutualFollow: false,
        autoExpireHangouts: true,
      },
    });

    const newUser = await userInstance.save();

    // Create session token and set HTTP-only cookie
    const token = await createSessionToken({
      userId: newUser._id.toString(),
      role: newUser.role,
      onboardingCompleted: false,
    });

    await setSessionCookie(token);

    // Return safe user object (email & passwordHash excluded)
    return NextResponse.json({
      success: true,
      user: {
        id: newUser._id.toString(),
        onboardingCompleted: false,
        role: newUser.role,
        college: {
          name: newUser.collegeName,
          domain: newUser.collegeDomain,
        },
        publicIdentity: newUser.publicIdentity,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { success: false, error: "An error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}
