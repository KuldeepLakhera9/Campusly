import mongoose, { Schema, Document, Model } from "mongoose";
import { ReportReason } from "@/types/post";
import { ReportPriority, ReportStatus, ReportTargetType } from "@/types/admin";

export interface IReportDocument extends Document {
  reporter: mongoose.Types.ObjectId;
  target: mongoose.Types.ObjectId;
  targetType: ReportTargetType;
  reason: ReportReason | string;
  details?: string;
  status: ReportStatus;
  priority: ReportPriority;
  assignedTo?: mongoose.Types.ObjectId | null;
  resolutionReason?: string | null;
  reviewedBy?: mongoose.Types.ObjectId | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReportDocument>(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    target: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ["post", "comment", "message", "user", "hangout"],
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    details: {
      type: String,
      maxlength: 1000,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewing", "resolved", "dismissed", "reviewed"],
      default: "pending",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    resolutionReason: {
      type: String,
      maxlength: 500,
      trim: true,
      default: null,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for moderation queue queries and duplicate prevention
ReportSchema.index({ status: 1, priority: -1, createdAt: -1 });
ReportSchema.index({ target: 1, reporter: 1 }, { unique: true });
ReportSchema.index({ targetType: 1, target: 1 });
ReportSchema.index({ assignedTo: 1, status: 1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.Report) {
  delete (mongoose.models as Record<string, unknown>).Report;
}

export const Report: Model<IReportDocument> =
  mongoose.models.Report ||
  mongoose.model<IReportDocument>("Report", ReportSchema);
