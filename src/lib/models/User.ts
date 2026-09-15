import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser } from "@/types/user";

export interface IUserDocument extends Omit<IUser, "_id">, Document {}

const UserPrivacySchema = new Schema(
  {
    hideMajor: { type: Boolean, default: false },
    allowDirectMessages: { type: Boolean, default: true },
    revealNameOnMutualFollow: { type: Boolean, default: false },
    autoExpireHangouts: { type: Boolean, default: true },
  },
  { _id: false }
);

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    universityDomain: {
      type: String,
      required: true,
      trim: true,
    },
    universityName: {
      type: String,
      required: true,
      trim: true,
    },
    pseudonym: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    avatarColor: {
      type: String,
      default: "#C15438",
    },
    avatarIcon: {
      type: String,
      default: "CO",
    },
    major: {
      type: String,
      trim: true,
    },
    graduationYear: {
      type: Number,
    },
    bio: {
      type: String,
      maxlength: 240,
      default: "Exploring campus without the social pressure.",
    },
    interests: {
      type: [String],
      default: [],
    },
    sparksCount: {
      type: Number,
      default: 10,
    },
    privacySettings: {
      type: UserPrivacySchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
