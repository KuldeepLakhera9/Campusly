import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBlockDocument extends Document {
  blocker: mongoose.Types.ObjectId;
  blocked: mongoose.Types.ObjectId;
  createdAt: Date;
}

const BlockSchema = new Schema<IBlockDocument>(
  {
    blocker: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    blocked: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound unique index ensuring no duplicate blocks
BlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

if (process.env.NODE_ENV !== "production" && mongoose.models.Block) {
  delete (mongoose.models as Record<string, unknown>).Block;
}

export const Block: Model<IBlockDocument> =
  mongoose.models.Block ||
  mongoose.model<IBlockDocument>("Block", BlockSchema);
