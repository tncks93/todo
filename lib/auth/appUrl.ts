import type { NextRequest } from "next/server";

/**
 * Resolves the base URL used to build OAuth redirect/callback URLs.
 * In production, `req.nextUrl.origin` derives from the Host header, which a
 * client can influence — falling back to it silently would let a spoofed
 * Host redirect GitHub's OAuth flow at an unintended origin. Fail fast
 * instead of trusting Host in production.
 */
export function getAppUrl(req: NextRequest): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_URL must be set in production");
  }
  return req.nextUrl.origin;
}
