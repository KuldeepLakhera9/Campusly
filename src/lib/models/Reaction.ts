import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReactionDocument extends Document {
  post: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  type: string;
  createdAt: Date;
}

const ReactionSchema = new Schema<IReactionDocument>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      default: "like",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound unique index ensuring only 1 active reaction of a type per user per post
ReactionSchema.index({ post: 1, user: 1, type: 1 }, { unique: true });
ReactionSchema.index({ user: 1, createdAt: -1 });

export const Reaction: Model<IReactionDocument> =
  mongoose.models.Reaction ||
  mongoose.model<IReactionDocument>("Reaction", ReactionSchema);
