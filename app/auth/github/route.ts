import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { OAUTH_STATE_COOKIE } from "@/lib/auth/constants";
import { getAppUrl } from "@/lib/auth/appUrl";

export const dynamic = "force-dynamic";

const STATE_MAX_AGE_SECONDS = 600;

export async function GET(req: NextRequest) {
  const state = randomBytes(16).toString("hex");
  const baseUrl = getAppUrl(req);

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID ?? "");
  authorizeUrl.searchParams.set(
    "redirect_uri",
    `${baseUrl}/auth/github/callback`
  );
  authorizeUrl.searchParams.set("scope", "read:user");
  authorizeUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authorizeUrl);
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STATE_MAX_AGE_SECONDS,
  });

  return res;
}
