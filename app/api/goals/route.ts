import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Goal from "@/models/Goal";
import { handleError, readJson, serialize } from "@/lib/api";
import { requireUser } from "@/lib/auth/requireUser";
import type { Goal as GoalType, GoalInput } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    await connectDB();
    const goals = await Goal.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(serialize<GoalType[]>(goals));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    await connectDB();
    const body = await readJson<GoalInput>(req);
    const goal = await Goal.create({
      userId: user._id,
      title: body.title,
      description: body.description ?? "",
    });
    return NextResponse.json(serialize<GoalType>(goal), { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
