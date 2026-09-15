import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessageDocument extends Document {
  conversationId: string;
  senderPseudonym: string;
  senderAvatarColor: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    senderPseudonym: {
      type: String,
      required: true,
    },
    senderAvatarColor: {
      type: String,
      default: "#C15438",
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Message: Model<IMessageDocument> =
  mongoose.models.Message ||
  mongoose.model<IMessageDocument>("Message", MessageSchema);
