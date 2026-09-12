import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Goal from "@/models/Goal";
import {
  ApiError,
  assertObjectId,
  handleError,
  readJson,
  serialize,
} from "@/lib/api";
import { requireUser } from "@/lib/auth/requireUser";
import type { Goal as GoalType } from "@/types";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    assertObjectId(params.id);
    await connectDB();
    const goal = await Goal.findOne({
      _id: params.id,
      userId: user._id,
    }).lean();
    if (!goal) throw new ApiError(404, "Goal not found");
    return NextResponse.json(serialize<GoalType>(goal));
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    assertObjectId(params.id);
    await connectDB();
    const body = await readJson<Partial<GoalType>>(req);
    const update: Record<string, unknown> = {};
    for (const key of ["title", "description", "progress"] as const) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    const goal = await Goal.findOneAndUpdate(
      { _id: params.id, userId: user._id },
      update,
      { new: true, runValidators: true }
    ).lean();
    if (!goal) throw new ApiError(404, "Goal not found");
    return NextResponse.json(serialize<GoalType>(goal));
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    assertObjectId(params.id);
    await connectDB();
    const goal = await Goal.findOneAndDelete({
      _id: params.id,
      userId: user._id,
    }).lean();
    if (!goal) throw new ApiError(404, "Goal not found");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
