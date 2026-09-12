import { NextResponse, type NextRequest } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { getAppUrl } from "@/lib/auth/appUrl";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await destroySession();
  return NextResponse.redirect(new URL("/login", getAppUrl(req)), {
    status: 303,
  });
}
