import { Schema, model, models, type Model } from "mongoose";

export interface UserAttrs {
  githubId: string;
  username: string;
  avatarUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserAttrs>(
  {
    githubId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, trim: true },
    avatarUrl: { type: String, required: true },
  },
  { timestamps: true }
);

const User =
  (models.User as Model<UserAttrs>) || model<UserAttrs>("User", UserSchema);

export default User;
