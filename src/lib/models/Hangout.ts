import mongoose, { Schema, Document, Model } from "mongoose";
import { HangoutStatus } from "@/types/hangout";

export interface IHangoutParticipantDocument {
  userId: mongoose.Types.ObjectId;
  pseudonym: string;
  avatarId: string;
  avatarColor: string;
  joinedAt: Date;
}

export interface IHangoutDocument extends Document {
  creator: mongoose.Types.ObjectId;
  creatorPseudonym: string;
  creatorAvatarId: string;
  creatorAvatarColor: string;
  collegeName: string;
  collegeDomain: string;
  title: string;
  description: string;
  activity: string;
  location: string;
  date: Date;
  startTime: string;
  endTime?: string;
  scheduledAt: Date;
  maxParticipants: number;
  participantsCount: number;
  participants: IHangoutParticipantDocument[];
  status: HangoutStatus;
  shareToFeed?: boolean;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: mongoose.Types.ObjectId | null;
  deletionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Backward compatibility getters
  hostPseudonym?: string;
  hostAvatarColor?: string;
  locationSpot?: string;
  scheduledTime?: Date;
  category?: string;
  campus?: string;
}

const ParticipantSchema = new Schema<IHangoutParticipantDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pseudonym: {
      type: String,
      required: true,
      trim: true,
    },
    avatarId: {
      type: String,
      default: "terracotta-prism",
    },
    avatarColor: {
      type: String,
      default: "#C15438",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const HangoutSchema = new Schema<IHangoutDocument>(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    creatorPseudonym: {
      type: String,
      required: true,
      trim: true,
    },
    creatorAvatarId: {
      type: String,
      default: "terracotta-prism",
    },
    creatorAvatarColor: {
      type: String,
      default: "#C15438",
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
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    activity: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    maxParticipants: {
      type: Number,
      required: true,
      min: 2,
      max: 30,
      default: 4,
    },
    participantsCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    participants: {
      type: [ParticipantSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["open", "full", "ongoing", "completed", "cancelled"],
      default: "open",
      index: true,
    },
    shareToFeed: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deletionReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for performant discovery and campus scoping
HangoutSchema.index({ collegeDomain: 1, scheduledAt: 1 });
HangoutSchema.index({ collegeDomain: 1, activity: 1, scheduledAt: 1 });
HangoutSchema.index({ collegeDomain: 1, status: 1, scheduledAt: 1 });
HangoutSchema.index({ creator: 1, createdAt: -1 });
HangoutSchema.index({ "participants.userId": 1, scheduledAt: 1 });

// Text index for search functionality
HangoutSchema.index({
  title: "text",
  description: "text",
  activity: "text",
  location: "text",
});

// Backward compatibility getters
HangoutSchema.virtual("hostPseudonym").get(function () {
  return this.creatorPseudonym;
});

HangoutSchema.virtual("hostAvatarColor").get(function () {
  return this.creatorAvatarColor;
});

HangoutSchema.virtual("locationSpot").get(function () {
  return this.location;
});

HangoutSchema.virtual("scheduledTime").get(function () {
  return this.scheduledAt;
});

HangoutSchema.virtual("category").get(function () {
  return this.activity;
});

HangoutSchema.virtual("campus").get(function () {
  return this.collegeName;
});

if (process.env.NODE_ENV !== "production" && mongoose.models.Hangout) {
  delete (mongoose.models as Record<string, unknown>).Hangout;
}

export const Hangout: Model<IHangoutDocument> =
  mongoose.models.Hangout ||
  mongoose.model<IHangoutDocument>("Hangout", HangoutSchema);
