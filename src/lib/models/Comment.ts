import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommentDocument extends Document {
  post: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  authorPseudonym: string;
  authorAvatarId: string;
  authorAvatarColor: string;
  content: string;
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
  },
  {
    timestamps: true,
  }
);

// Compound indexes for scalable comment queries
CommentSchema.index({ post: 1, createdAt: 1 });
CommentSchema.index({ author: 1, createdAt: -1 });

export const Comment: Model<ICommentDocument> =
  mongoose.models.Comment ||
  mongoose.model<ICommentDocument>("Comment", CommentSchema);
