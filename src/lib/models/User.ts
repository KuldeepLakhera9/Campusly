import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser } from "@/types/user";

export interface IUserDocument extends Omit<IUser, "_id">, Document {}

const UserPrivacySchema = new Schema(
  {
    hideMajor: { type: Boolean, default: false },
    allowDirectMessages: { type: Boolean, default: true },
    revealNameOnMutualFollow: { type: Boolean, default: false },
    autoExpireHangouts: { type: Boolean, default: true },
    appearInFindPeople: { type: Boolean, default: true },
    showInterests: { type: Boolean, default: true },
  },
  { _id: false }
);

const PublicIdentitySchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    avatarId: {
      type: String,
      default: "terracotta-prism",
    },
    avatarColor: {
      type: String,
      default: "#C15438",
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
    lookingFor: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUserDocument>(
  {
    // PRIVATE ACCOUNT INFORMATION
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: "College",
    },
    collegeName: {
      type: String,
      required: true,
      default: "UC Berkeley",
      trim: true,
    },
    collegeDomain: {
      type: String,
      required: true,
      default: "berkeley.edu",
      lowercase: true,
      trim: true,
    },
    emailVerified: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["student", "moderator", "admin"],
      default: "student",
    },
    status: {
      type: String,
      enum: ["active", "suspended", "pending"],
      default: "active",
      index: true,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // PUBLIC IDENTITY (visible to other students)
    publicIdentity: {
      type: PublicIdentitySchema,
      required: true,
    },

    // REPUTATION & PRIVACY
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

// Indexes for high-performance candidate discovery
UserSchema.index({
  collegeDomain: 1,
  "privacySettings.appearInFindPeople": 1,
  status: 1,
});
UserSchema.index({
  collegeDomain: 1,
  "publicIdentity.interests": 1,
});

// Virtuals for backward compatibility with Phase 1 components
UserSchema.virtual("pseudonym").get(function () {
  return this.publicIdentity?.username;
});

UserSchema.virtual("avatarColor").get(function () {
  return this.publicIdentity?.avatarColor;
});

UserSchema.virtual("interests").get(function () {
  return this.publicIdentity?.interests;
});

UserSchema.virtual("bio").get(function () {
  return this.publicIdentity?.bio;
});

if (process.env.NODE_ENV !== "production" && mongoose.models.User) {
  delete (mongoose.models as Record<string, unknown>).User;
}

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
