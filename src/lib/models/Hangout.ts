import mongoose, { Schema, Document, Model } from "mongoose";
import { IHangout, HangoutCategory, HangoutStatus } from "@/types/hangout";

export interface IHangoutDocument extends Omit<IHangout, "_id">, Document {}

const ParticipantSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    pseudonym: { type: String, required: true },
    avatarColor: { type: String, default: "#C15438" },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const HangoutSchema = new Schema<IHangoutDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Study",
        "Food & Drink",
        "Campus Walk",
        "Sports & Fitness",
        "Gaming",
        "Creative",
        "Late Night",
        "Other",
      ] as HangoutCategory[],
      default: "Study",
    },
    campus: {
      type: String,
      required: true,
      default: "UC Berkeley",
    },
    locationSpot: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    scheduledTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    maxParticipants: {
      type: Number,
      required: true,
      min: 2,
      max: 20,
      default: 4,
    },
    hostPseudonym: {
      type: String,
      required: true,
    },
    hostAvatarColor: {
      type: String,
      default: "#C15438",
    },
    hostUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    participants: {
      type: [ParticipantSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["open", "full", "completed", "cancelled"] as HangoutStatus[],
      default: "open",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Hangout: Model<IHangoutDocument> =
  mongoose.models.Hangout ||
  mongoose.model<IHangoutDocument>("Hangout", HangoutSchema);
