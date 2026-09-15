import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/models/User";
import { loginSchema } from "@/lib/validations/auth";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email and password." },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;

    await connectToDatabase();

    // Query user by lowercase trimmed email
    const userDoc = await User.findOne({ email }).lean();

    // Generic error message to mitigate account enumeration
    const INVALID_CREDENTIALS_MSG = "Invalid email or password.";

    if (!userDoc || !userDoc.passwordHash) {
      return NextResponse.json(
        { success: false, error: INVALID_CREDENTIALS_MSG },
        { status: 401 }
      );
    }

    if (userDoc.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Your account is currently inactive or suspended." },
        { status: 403 }
      );
    }

    // Verify password hash
    const isValid = await verifyPassword(password, userDoc.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: INVALID_CREDENTIALS_MSG },
        { status: 401 }
      );
    }

    // Create session token and set HTTP-only cookie
    const token = await createSessionToken({
      userId: userDoc._id.toString(),
      role: userDoc.role,
      onboardingCompleted: Boolean(userDoc.onboardingCompleted),
    });

    await setSessionCookie(token);

    // Return safe user object (email & passwordHash excluded)
    return NextResponse.json({
      success: true,
      user: {
        id: userDoc._id.toString(),
        onboardingCompleted: Boolean(userDoc.onboardingCompleted),
        role: userDoc.role,
        college: {
          name: userDoc.collegeName || "Accredited College",
          domain: userDoc.collegeDomain || "college.edu",
        },
        publicIdentity: userDoc.publicIdentity,
      },
    });
  } catch (err) {
    console.error("Login API error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
