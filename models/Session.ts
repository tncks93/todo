import { Schema, model, models, Types, type Model } from "mongoose";

export interface SessionAttrs {
  token: string;
  userId: Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<SessionAttrs>(
  {
    token: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index: Mongo reaps expired session documents automatically.
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session =
  (models.Session as Model<SessionAttrs>) ||
  model<SessionAttrs>("Session", SessionSchema);

export default Session;
