import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Todo from "@/models/Todo";
import Goal from "@/models/Goal";
import WeeklyPlan from "@/models/WeeklyPlan";
import {
  ApiError,
  assertObjectId,
  handleError,
  readJson,
  serialize,
} from "@/lib/api";
import { requireUser } from "@/lib/auth/requireUser";
import { assertOwnedRef } from "@/lib/auth/assertOwnedRef";
import type { Todo as TodoType } from "@/types";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    assertObjectId(params.id);
    await connectDB();
    const todo = await Todo.findOne({
      _id: params.id,
      userId: user._id,
    }).lean();
    if (!todo) throw new ApiError(404, "Todo not found");
    return NextResponse.json(serialize<TodoType>(todo));
  } catch (err) {
    return handleError(err);
  }
}

const EDITABLE = [
  "title",
  "description",
  "priority",
  "dueDate",
  "dayOfWeek",
  "weeklyPlanId",
  "goalId",
] as const;

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    assertObjectId(params.id);
    await connectDB();
    const body = await readJson<Partial<TodoType>>(req);
    await assertOwnedRef(WeeklyPlan, body.weeklyPlanId, user._id, "weeklyPlanId");
    await assertOwnedRef(Goal, body.goalId, user._id, "goalId");
    const update: Record<string, unknown> = {};
    for (const key of EDITABLE) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    if (body.status !== undefined) update.status = body.status;
    const todo = await Todo.findOneAndUpdate(
      { _id: params.id, userId: user._id },
      update,
      { new: true, runValidators: true }
    ).lean();
    if (!todo) throw new ApiError(404, "Todo not found");
    return NextResponse.json(serialize<TodoType>(todo));
  } catch (err) {
    return handleError(err);
  }
}

/**
 * PATCH performs a single drag-drop persist: status and/or order in one call.
 * Body: { status?: TodoStatus, order?: string, weeklyPlanId?, dayOfWeek? }
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    assertObjectId(params.id);
    await connectDB();
    const body = await readJson<Partial<TodoType>>(req);
    await assertOwnedRef(WeeklyPlan, body.weeklyPlanId, user._id, "weeklyPlanId");
    const update: Record<string, unknown> = {};
    if (body.status !== undefined) update.status = body.status;
    if (body.order !== undefined) update.order = body.order;
    if (body.weeklyPlanId !== undefined) update.weeklyPlanId = body.weeklyPlanId;
    if (body.dayOfWeek !== undefined) update.dayOfWeek = body.dayOfWeek;
    if (Object.keys(update).length === 0) {
      throw new ApiError(400, "No patchable fields provided");
    }
    const todo = await Todo.findOneAndUpdate(
      { _id: params.id, userId: user._id },
      update,
      { new: true, runValidators: true }
    ).lean();
    if (!todo) throw new ApiError(404, "Todo not found");
    return NextResponse.json(serialize<TodoType>(todo));
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    assertObjectId(params.id);
    await connectDB();
    const todo = await Todo.findOneAndDelete({
      _id: params.id,
      userId: user._id,
    }).lean();
    if (!todo) throw new ApiError(404, "Todo not found");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
