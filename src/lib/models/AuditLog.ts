import mongoose, { Schema, Document, Model } from "mongoose";
import { AdminRole, AuditAction } from "@/types/admin";

export interface IAuditLogDocument extends Document {
  actor: mongoose.Types.ObjectId;
  actorPseudonym: string;
  actorRole: AdminRole;
  action: AuditAction | string;
  targetType: "report" | "post" | "comment" | "hangout" | "user" | "message";
  targetId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actorPseudonym: {
      type: String,
      required: true,
      trim: true,
    },
    actorRole: {
      type: String,
      enum: ["moderator", "admin"],
      required: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ["report", "post", "comment", "hangout", "user", "message"],
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      maxlength: 1000,
      trim: true,
      default: "",
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for immutable audit queries
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ actor: 1, createdAt: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.AuditLog) {
  delete (mongoose.models as Record<string, unknown>).AuditLog;
}

export const AuditLog: Model<IAuditLogDocument> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLogDocument>("AuditLog", AuditLogSchema);
