import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Cheap presence-only cookie check so unauthenticated visitors land on /login
 * instead of an empty app shell. The authoritative, DB-backed check runs
 * per-request in the API routes via requireUser().
 */
export function middleware(req: NextRequest) {
  if (req.cookies.get(SESSION_COOKIE)) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
}

export const config = {
  matcher: ["/", "/todos/:path*", "/weekly/:path*", "/goals/:path*"],
};
