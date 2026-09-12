import { ApiError } from "@/lib/api";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";

/** Resolves the authenticated user for an API route, or throws ApiError(401). */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "Unauthorized");
  return user;
}
