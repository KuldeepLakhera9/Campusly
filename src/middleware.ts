import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "campusly_session";

function getSecretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET || "campusly_development_fallback_secret_32_characters";
  return new TextEncoder().encode(secret);
}

// Protected application routes that require a logged-in user
const PROTECTED_ROUTES = [
  "/explore",
  "/feed",
  "/hangouts",
  "/messages",
  "/profile",
  "/notifications",
];

// Guest routes that logged-in users should be redirected away from
const GUEST_ROUTES = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  let sessionPayload: { userId: string; role: string; onboardingCompleted: boolean } | null =
    null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecretKey());
      sessionPayload = {
        userId: payload.userId as string,
        role: (payload.role as string) || "student",
        onboardingCompleted: Boolean(payload.onboardingCompleted),
      };
    } catch {
      sessionPayload = null;
    }
  }

  const isAuthenticated = Boolean(sessionPayload?.userId);
  const isOnboardingCompleted = Boolean(sessionPayload?.onboardingCompleted);

  // 1. Protected routes: User is not authenticated -> redirect to /login
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If authenticated but hasn't completed onboarding -> redirect to /onboarding
    if (!isOnboardingCompleted) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  // 2. Onboarding route:
  if (pathname.startsWith("/onboarding")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // If already finished onboarding, redirect to /explore
    if (isOnboardingCompleted) {
      return NextResponse.redirect(new URL("/explore", req.url));
    }
  }

  // 3. Guest routes: Authenticated users should not see login/register
  const isGuestRoute = GUEST_ROUTES.some((route) => pathname.startsWith(route));
  if (isGuestRoute && isAuthenticated) {
    if (!isOnboardingCompleted) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    return NextResponse.redirect(new URL("/explore", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/explore/:path*",
    "/feed/:path*",
    "/hangouts/:path*",
    "/messages/:path*",
    "/profile/:path*",
    "/notifications/:path*",
    "/onboarding/:path*",
    "/login",
    "/register",
  ],
};
