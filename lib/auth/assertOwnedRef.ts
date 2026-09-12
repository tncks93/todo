import mongoose from "mongoose";
import { ApiError } from "@/lib/api";

/**
 * Rejects a client-supplied reference id (weeklyPlanId, goalId, ...) that
 * doesn't point at a document owned by the current user — otherwise a todo
 * could be linked to another user's weekly plan or goal by id guessing.
 * A no-op when `id` is undefined/null (the field is optional).
 */
export async function assertOwnedRef(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accepts any Mongoose model (Goal/WeeklyPlan), whose generated Document types are mutually incompatible under a stricter generic
  model: mongoose.Model<any>,
  id: unknown,
  userId: string,
  label: string
): Promise<void> {
  if (id === undefined || id === null) return;
  if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${label}`);
  }
  const owned = await model.exists({ _id: id, userId });
  if (!owned) {
    throw new ApiError(400, `${label} not found`);
  }
}
