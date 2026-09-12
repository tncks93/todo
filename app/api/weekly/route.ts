import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import WeeklyPlan from "@/models/WeeklyPlan";
import Goal from "@/models/Goal";
import { ApiError, handleError, readJson, serialize } from "@/lib/api";
import { requireUser } from "@/lib/auth/requireUser";
import { assertOwnedRef } from "@/lib/auth/assertOwnedRef";
import { getWeekStart } from "@/lib/utils";
import type { WeeklyPlan as WeeklyPlanType, WeeklyPlanInput } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    await connectDB();
    const { searchParams } = new URL(req.url);
    const weekStart = searchParams.get("weekStart");
    const limitParam = searchParams.get("limit");

    if (weekStart) {
      const normalized = getWeekStart(new Date(weekStart));
      const plan = await WeeklyPlan.findOne({
        weekStart: normalized,
        userId: user._id,
      }).lean();
      return NextResponse.json(
        plan ? serialize<WeeklyPlanType>(plan) : null
      );
    }

    const query = WeeklyPlan.find({ userId: user._id }).sort({ weekStart: -1 });
    if (limitParam) query.limit(Math.max(1, Number(limitParam) || 4));
    const plans = await query.lean();
    return NextResponse.json(serialize<WeeklyPlanType[]>(plans));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    await connectDB();
    const body = await readJson<WeeklyPlanInput>(req);
    await assertOwnedRef(Goal, body.goalId, user._id, "goalId");
    const weekStart = getWeekStart(new Date(body.weekStart));

    // Explicit pre-check: the unique index on `weekStart` is the backstop,
    // but its build isn't awaited before the first `create()`, so a
    // same-instant race on a fresh collection could slip through it. This
    // check makes the 409 reliable without relying on that timing.
    const existing = await WeeklyPlan.findOne({ weekStart, userId: user._id })
      .select("_id")
      .lean();
    if (existing) {
      throw new ApiError(409, "A weekly plan for this week already exists");
    }

    const plan = await WeeklyPlan.create({
      userId: user._id,
      weekStart,
      goals: (body.goals ?? []).slice(0, 5),
      memo: body.memo ?? "",
      retrospective: body.retrospective ?? "",
      goalId: body.goalId ?? null,
    });
    return NextResponse.json(serialize<WeeklyPlanType>(plan), { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
