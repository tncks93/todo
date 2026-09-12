import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { OAUTH_STATE_COOKIE } from "@/lib/auth/constants";
import { createSession } from "@/lib/auth/session";
import { getAppUrl } from "@/lib/auth/appUrl";
import User from "@/models/User";

export const dynamic = "force-dynamic";

interface TokenResponse {
  access_token?: string;
}

interface GitHubUser {
  id?: number | string;
  login?: string;
  avatar_url?: string;
}

export async function GET(req: NextRequest) {
  const baseUrl = getAppUrl(req);
  const failure = () => {
    // Clear the state cookie on every failure path, not just success, so a
    // failed attempt's state can't be replayed within its 10-minute window.
    const res = NextResponse.redirect(new URL("/login?error=oauth_failed", baseUrl));
    res.cookies.delete(OAUTH_STATE_COOKIE);
    return res;
  };

  try {
    const params = req.nextUrl.searchParams;
    const code = params.get("code");
    const state = params.get("state");

    // User denied access on GitHub's consent screen.
    if (params.get("error")) return failure();
    if (!code) return failure();

    const expectedState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
    if (!state || !expectedState || state !== expectedState) return failure();

    const redirectUri = `${baseUrl}/auth/github/callback`;

    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri,
        }),
      }
    );
    if (!tokenRes.ok) return failure();

    const tokenJson = (await tokenRes.json()) as TokenResponse;
    const accessToken = tokenJson.access_token;
    if (!accessToken) return failure();

    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "todo-app",
      },
    });
    if (!userRes.ok) return failure();

    const ghUser = (await userRes.json()) as GitHubUser;
    if (ghUser.id === undefined || !ghUser.login || !ghUser.avatar_url) {
      return failure();
    }

    await connectDB();
    const user = await User.findOneAndUpdate(
      { githubId: String(ghUser.id) },
      { username: ghUser.login, avatarUrl: ghUser.avatar_url },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (!user) return failure();

    await createSession(String(user._id));

    const res = NextResponse.redirect(new URL("/", baseUrl));
    res.cookies.delete(OAUTH_STATE_COOKIE);
    return res;
  } catch (err) {
    console.error("[auth] github callback failed", err);
    return failure();
  }
}
