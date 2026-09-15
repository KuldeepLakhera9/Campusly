import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/models/User";
import { ISafeUser } from "@/types/user";

export const SESSION_COOKIE_NAME = "campusly_session";
const SESSION_EXPIRY = "30d"; // 30 days
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // in seconds

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "campusly_development_fallback_secret_32_characters";
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  role: string;
  onboardingCompleted?: boolean;
}

/**
 * Creates a signed JWT session token.
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRY)
    .sign(getSecretKey());
}

/**
 * Verifies a JWT session token and returns the decoded payload, or null if invalid/expired.
 */
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      userId: payload.userId as string,
      role: (payload.role as string) || "student",
      onboardingCompleted: Boolean(payload.onboardingCompleted),
    };
  } catch {
    return null;
  }
}

/**
 * Standard HTTP-only cookie options.
 */
export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

/**
 * Attaches the session cookie to the incoming response via next/headers cookies().
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
}

/**
 * Removes the session cookie to securely log out.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Retrieves the current authenticated user's safe public representation.
 * Guarantees passwordHash, email, and internal tokens are NEVER exposed.
 */
export async function getCurrentUserSafe(): Promise<ISafeUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload?.userId) return null;

    await connectToDatabase();
    const userDoc = await User.findById(payload.userId).lean();
    if (!userDoc || userDoc.status !== "active") return null;

    return {
      id: userDoc._id.toString(),
      onboardingCompleted: Boolean(userDoc.onboardingCompleted),
      role: userDoc.role,
      moderationStatus: userDoc.moderationStatus || "active",
      college: {
        name: userDoc.collegeName || "Accredited College",
        domain: userDoc.collegeDomain || "college.edu",
      },
      publicIdentity: {
        username: userDoc.publicIdentity?.username || "Anonymous Student",
        avatarId: userDoc.publicIdentity?.avatarId || "terracotta-prism",
        avatarColor: userDoc.publicIdentity?.avatarColor || "#C15438",
        bio: userDoc.publicIdentity?.bio || "",
        interests: userDoc.publicIdentity?.interests || [],
        lookingFor: userDoc.publicIdentity?.lookingFor || [],
      },
      sparksCount: userDoc.sparksCount ?? 10,
      privacySettings: {
        hideMajor: userDoc.privacySettings?.hideMajor ?? false,
        allowDirectMessages: userDoc.privacySettings?.allowDirectMessages ?? true,
        revealNameOnMutualFollow:
          userDoc.privacySettings?.revealNameOnMutualFollow ?? false,
        autoExpireHangouts: userDoc.privacySettings?.autoExpireHangouts ?? true,
        appearInFindPeople: userDoc.privacySettings?.appearInFindPeople ?? true,
        showInterests: userDoc.privacySettings?.showInterests ?? true,
      },
      createdAt: userDoc.createdAt ? userDoc.createdAt.toISOString() : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
