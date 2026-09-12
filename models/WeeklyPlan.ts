import { Schema, model, models, Types, type Model } from "mongoose";

export interface WeeklyGoalAttrs {
  text: string;
  done: boolean;
}

export interface WeeklyPlanAttrs {
  userId: Types.ObjectId;
  weekStart: Date;
  goals: WeeklyGoalAttrs[];
  memo: string;
  retrospective: string;
  goalId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const WeeklyGoalSchema = new Schema<WeeklyGoalAttrs>(
  {
    text: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const WeeklyPlanSchema = new Schema<WeeklyPlanAttrs>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    weekStart: { type: Date, required: true },
    goals: {
      type: [WeeklyGoalSchema],
      default: [],
      validate: {
        validator: (v: unknown[]) => v.length <= 5,
        message: "A weekly plan may have at most 5 goals",
      },
    },
    memo: { type: String, default: "" },
    retrospective: { type: String, default: "" },
    goalId: { type: Schema.Types.ObjectId, ref: "Goal", default: null },
  },
  { timestamps: true }
);

// Each user may have at most one plan per calendar week; two different users
// can each own a plan for the same week (see app/api/weekly/route.ts POST).
WeeklyPlanSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

const WeeklyPlan =
  (models.WeeklyPlan as Model<WeeklyPlanAttrs>) ||
  model<WeeklyPlanAttrs>("WeeklyPlan", WeeklyPlanSchema);

export default WeeklyPlan;
