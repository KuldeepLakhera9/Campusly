import mongoose, { Schema, Document, Model } from "mongoose";
import { ICollege } from "@/types/college";

export interface ICollegeDocument extends Omit<ICollege, "_id">, Document {}

const CollegeSchema = new Schema<ICollegeDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    city: {
      type: String,
      default: "",
      trim: true,
    },
    state: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const College: Model<ICollegeDocument> =
  mongoose.models.College ||
  mongoose.model<ICollegeDocument>("College", CollegeSchema);
