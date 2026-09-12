import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Todo from "@/models/Todo";
import Goal from "@/models/Goal";
import WeeklyPlan from "@/models/WeeklyPlan";
import { handleError, readJson, serialize } from "@/lib/api";
import { requireUser } from "@/lib/auth/requireUser";
import { assertOwnedRef } from "@/lib/auth/assertOwnedRef";
import { keyBetween } from "@/lib/fractionalIndex";
import type { Todo as TodoType, TodoInput, TodoStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    await connectDB();
    const { searchParams } = new URL(req.url);
    const filter: Record<string, unknown> = { userId: user._id };
    const status = searchParams.get("status");
    const weeklyPlanId = searchParams.get("weeklyPlanId");
    const goalId = searchParams.get("goalId");
    if (status) filter.status = status;
    if (weeklyPlanId) filter.weeklyPlanId = weeklyPlanId;
    if (goalId) filter.goalId = goalId;

    const todos = await Todo.find(filter).sort({ order: 1 }).lean();
    return NextResponse.json(serialize<TodoType[]>(todos));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    await connectDB();
    const body = await readJson<TodoInput>(req);
    const status: TodoStatus = body.status ?? "todo";
    await assertOwnedRef(WeeklyPlan, body.weeklyPlanId, user._id, "weeklyPlanId");
    await assertOwnedRef(Goal, body.goalId, user._id, "goalId");

    // Append: order key just after the current last card in the column.
    const last = await Todo.findOne({ status, userId: user._id })
      .sort({ order: -1 })
      .select("order")
      .lean();
    const order = keyBetween(last?.order ?? null, null);

    const todo = await Todo.create({
      userId: user._id,
      title: body.title,
      description: body.description ?? "",
      status,
      priority: body.priority ?? "medium",
      dueDate: body.dueDate ?? null,
      dayOfWeek: body.dayOfWeek ?? null,
      weeklyPlanId: body.weeklyPlanId ?? null,
      goalId: body.goalId ?? null,
      order,
    });
    return NextResponse.json(serialize<TodoType>(todo), { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
