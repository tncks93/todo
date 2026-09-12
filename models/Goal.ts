import { Schema, model, models, Types, type Model } from "mongoose";

export interface GoalAttrs {
  userId: Types.ObjectId;
  title: string;
  description: string;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<GoalAttrs>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

const Goal =
  (models.Goal as Model<GoalAttrs>) || model<GoalAttrs>("Goal", GoalSchema);

export default Goal;
