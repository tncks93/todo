import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import SessionModel from "@/models/Session";
import User, { type UserAttrs } from "@/models/User";
import type { Types } from "mongoose";

const SESSION_TTL_DAYS = 30;
const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60;

export interface SessionUser {
  _id: string;
  githubId: string;
  username: string;
  avatarUrl: string;
}

/**
 * Creates a server-side session row and sets the httpOnly session cookie.
 * Must be called from a Route Handler (cookie writes are only valid there).
 */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await connectDB();
  await SessionModel.create({ token, userId, expiresAt });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/**
 * Resolves the current user from the session cookie, or null.
 * Returns null without touching the DB when no cookie is present so the
 * unauthenticated 401 path stays cheap.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  await connectDB();

  const session = await SessionModel.findOne({
    token,
    expiresAt: { $gt: new Date() },
  }).lean<{ userId: Types.ObjectId } | null>();
  if (!session) return null;

  const user = await User.findById(session.userId).lean<
    (UserAttrs & { _id: Types.ObjectId }) | null
  >();
  if (!user) return null;

  return {
    _id: String(user._id),
    githubId: user.githubId,
    username: user.username,
    avatarUrl: user.avatarUrl,
  };
}

/**
 * Deletes the server-side session document and clears the cookie, so a
 * logged-out token can never be replayed.
 */
export async function destroySession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;

  if (token) {
    await connectDB();
    await SessionModel.deleteOne({ token });
  }

  cookies().delete(SESSION_COOKIE);
}
