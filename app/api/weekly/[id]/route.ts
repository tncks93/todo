import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import WeeklyPlan from "@/models/WeeklyPlan";
import Goal from "@/models/Goal";
import {
  ApiError,
  assertObjectId,
  handleError,
  readJson,
  serialize,
} from "@/lib/api";
import { requireUser } from "@/lib/auth/requireUser";
import { assertOwnedRef } from "@/lib/auth/assertOwnedRef";
import type { WeeklyPlan as WeeklyPlanType, WeeklyGoalItem } from "@/types";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    assertObjectId(params.id);
    await connectDB();
    const plan = await WeeklyPlan.findOne({
      _id: params.id,
      userId: user._id,
    }).lean();
    if (!plan) throw new ApiError(404, "Weekly plan not found");
    return NextResponse.json(serialize<WeeklyPlanType>(plan));
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    assertObjectId(params.id);
    await connectDB();
    const body = await readJson<Partial<WeeklyPlanType>>(req);
    await assertOwnedRef(Goal, body.goalId, user._id, "goalId");
    const update: Record<string, unknown> = {};
    if (body.goals !== undefined) update.goals = body.goals.slice(0, 5);
    for (const key of ["memo", "retrospective", "goalId"] as const) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    const plan = await WeeklyPlan.findOneAndUpdate(
      { _id: params.id, userId: user._id },
      update,
      { new: true, runValidators: true }
    ).lean();
    if (!plan) throw new ApiError(404, "Weekly plan not found");
    return NextResponse.json(serialize<WeeklyPlanType>(plan));
  } catch (err) {
    return handleError(err);
  }
}

/**
 * PATCH toggles a single weekly goal's `done` flag.
 * Body: { goalIndex: number, done: boolean }
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    assertObjectId(params.id);
    await connectDB();
    const { goalIndex, done } = await readJson<{
      goalIndex: number;
      done: boolean;
    }>(req);

    const plan = await WeeklyPlan.findOne({
      _id: params.id,
      userId: user._id,
    });
    if (!plan) throw new ApiError(404, "Weekly plan not found");
    const goals = plan.goals as unknown as WeeklyGoalItem[];
    if (
      typeof goalIndex !== "number" ||
      goalIndex < 0 ||
      goalIndex >= goals.length
    ) {
      throw new ApiError(400, "goalIndex out of range");
    }
    goals[goalIndex].done = Boolean(done);
    plan.markModified("goals");
    await plan.save();
    return NextResponse.json(serialize<WeeklyPlanType>(plan));
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    assertObjectId(params.id);
    await connectDB();
    const plan = await WeeklyPlan.findOneAndDelete({
      _id: params.id,
      userId: user._id,
    }).lean();
    if (!plan) throw new ApiError(404, "Weekly plan not found");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
