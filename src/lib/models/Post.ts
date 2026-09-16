import mongoose, { Schema, Document, Model } from "mongoose";
import { PostCategory, POST_CATEGORIES } from "@/types/post";

export interface IPostDocument extends Document {
  author: mongoose.Types.ObjectId;
  authorPseudonym: string;
  authorAvatarId: string;
  authorAvatarColor: string;
  collegeName: string;
  collegeDomain: string;
  content: string;
  category: PostCategory;
  reactionCount: number;
  commentCount: number;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: mongoose.Types.ObjectId | null;
  deletionReason?: string | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Backward compatibility getters
  upvotesCount?: number;
  repliesCount?: number;
  circle?: string;
  campus?: string;
}

const PostSchema = new Schema<IPostDocument>(
  {
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
      index: true,
    },
    authorAvatarId: {
      type: String,
      default: "terracotta-prism",
    },
    authorAvatarColor: {
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
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      enum: POST_CATEGORIES,
      default: "Discussion",
      index: true,
    },
    reactionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
      min: 0,
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
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-populate expiresAt for Confessions to 14 days if not already set
PostSchema.pre("save", function () {
  if (this.category === "Confession" && !this.expiresAt) {
    const baseTime = this.createdAt ? new Date(this.createdAt).getTime() : Date.now();
    this.expiresAt = new Date(baseTime + 14 * 24 * 60 * 60 * 1000);
  }
});

// TTL index for automatic MongoDB document deletion upon expiration
PostSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes for high performance feed retrieval
PostSchema.index({ collegeDomain: 1, createdAt: -1 });
PostSchema.index({ collegeDomain: 1, category: 1, createdAt: -1 });
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ isDeleted: 1, createdAt: -1 });

// Text index for search functionality
PostSchema.index({ content: "text", category: "text" });

// Virtuals for backward compatibility with Phase 1 components
PostSchema.virtual("upvotesCount").get(function () {
  return this.reactionCount;
});

PostSchema.virtual("repliesCount").get(function () {
  return this.commentCount;
});

PostSchema.virtual("circle").get(function () {
  return this.category;
});

PostSchema.virtual("campus").get(function () {
  return this.collegeName;
});

if (process.env.NODE_ENV !== "production" && mongoose.models.Post) {
  delete (mongoose.models as Record<string, unknown>).Post;
}

export const Post: Model<IPostDocument> =
  mongoose.models.Post || mongoose.model<IPostDocument>("Post", PostSchema);
