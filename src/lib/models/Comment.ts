import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommentDocument extends Document {
  post: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  authorPseudonym: string;
  authorAvatarId: string;
  authorAvatarColor: string;
  content: string;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: mongoose.Types.ObjectId | null;
  deletionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<ICommentDocument>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    authorPseudonym: {
      type: String,
      required: true,
      trim: true,
    },
    authorAvatarId: {
      type: String,
      default: "terracotta-prism",
    },
    authorAvatarColor: {
      type: String,
      default: "#C15438",
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 1000,
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
  }
);

// Compound indexes for scalable comment queries
CommentSchema.index({ post: 1, createdAt: 1 });
CommentSchema.index({ author: 1, createdAt: -1 });
CommentSchema.index({ isDeleted: 1, createdAt: -1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.Comment) {
  delete (mongoose.models as Record<string, unknown>).Comment;
}

export const Comment: Model<ICommentDocument> =
  mongoose.models.Comment ||
  mongoose.model<ICommentDocument>("Comment", CommentSchema);
