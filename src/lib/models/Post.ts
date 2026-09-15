import mongoose, { Schema, Document, Model } from "mongoose";
import { IPost, CampusCircle } from "@/types/post";

export interface IPostDocument extends Omit<IPost, "_id">, Document {}

const PostSchema = new Schema<IPostDocument>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    authorPseudonym: {
      type: String,
      required: true,
      index: true,
    },
    authorAvatarColor: {
      type: String,
      default: "#C15438",
    },
    authorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    campus: {
      type: String,
      required: true,
      default: "UC Berkeley",
    },
    circle: {
      type: String,
      required: true,
      enum: [
        "All Circles",
        "Academics",
        "Dorm Life",
        "Late Night",
        "Course Advice",
        "Lost & Found",
        "Campus Confessions",
        "Opportunities",
      ] as CampusCircle[],
      default: "Academics",
      index: true,
    },
    upvotesCount: {
      type: Number,
      default: 0,
    },
    repliesCount: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Post: Model<IPostDocument> =
  mongoose.models.Post || mongoose.model<IPostDocument>("Post", PostSchema);
