import { Schema, model, models, Types, type Model } from "mongoose";

export type TodoStatus = "todo" | "doing" | "done";
export type Priority = "high" | "medium" | "low";

export interface TodoAttrs {
  userId: Types.ObjectId;
  title: string;
  description: string;
  status: TodoStatus;
  priority: Priority;
  dueDate: Date | null;
  dayOfWeek: number | null;
  order: string;
  weeklyPlanId: Types.ObjectId | null;
  goalId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const TodoSchema = new Schema<TodoAttrs>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["todo", "doing", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    dueDate: { type: Date, default: null },
    dayOfWeek: { type: Number, min: 0, max: 6, default: null },
    order: { type: String, required: true },
    weeklyPlanId: {
      type: Schema.Types.ObjectId,
      ref: "WeeklyPlan",
      default: null,
    },
    goalId: { type: Schema.Types.ObjectId, ref: "Goal", default: null },
  },
  { timestamps: true }
);

// Sorted reads within a column: filter by status, sort by order string.
TodoSchema.index({ status: 1, order: 1 });

const Todo =
  (models.Todo as Model<TodoAttrs>) || model<TodoAttrs>("Todo", TodoSchema);

export default Todo;
