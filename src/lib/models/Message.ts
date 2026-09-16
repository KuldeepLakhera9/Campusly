import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessageDocument extends Document {
  conversationId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  senderPseudonym: string;
  senderAvatarId: string;
  senderAvatarColor: string;
  content: string;
  isDeleted: boolean;
  deletedAt?: Date;
  isSeen: boolean;
  seenAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    senderPseudonym: {
      type: String,
      required: true,
      trim: true,
    },
    senderAvatarId: {
      type: String,
      default: "terracotta-prism",
    },
    senderAvatarColor: {
      type: String,
      default: "#C15438",
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    isSeen: {
      type: Boolean,
      default: false,
      index: true,
    },
    seenAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for chronological cursor-based pagination and seen-state lookups
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ conversationId: 1, isDeleted: 1, createdAt: -1 });
MessageSchema.index({ conversationId: 1, sender: 1, isSeen: 1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.Message) {
  delete (mongoose.models as Record<string, unknown>).Message;
}

export const Message: Model<IMessageDocument> =
  mongoose.models.Message ||
  mongoose.model<IMessageDocument>("Message", MessageSchema);
