import mongoose, { Schema, Document, Model } from "mongoose";
import { ReportReason, REPORT_REASONS } from "@/types/post";

export interface IReportDocument extends Document {
  reporter: mongoose.Types.ObjectId;
  target: mongoose.Types.ObjectId;
  targetType: "post" | "comment";
  reason: ReportReason;
  details?: string;
  status: "pending" | "reviewed" | "dismissed";
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
      enum: ["post", "comment"],
      index: true,
    },
    reason: {
      type: String,
      required: true,
      enum: REPORT_REASONS,
    },
    details: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for moderation queries and duplicate prevention
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ target: 1, reporter: 1 }, { unique: true });

export const Report: Model<IReportDocument> =
  mongoose.models.Report ||
  mongoose.model<IReportDocument>("Report", ReportSchema);
