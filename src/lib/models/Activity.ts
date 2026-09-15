import mongoose, { Schema, Document, Model } from "mongoose";
import { IActivity } from "@/types/hangout";

export interface IActivityDocument extends Omit<IActivity, "_id">, Document {}

const ActivitySchema = new Schema<IActivityDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    icon: {
      type: String,
      default: "Coffee",
    },
    category: {
      type: String,
      default: "Social",
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

export const DEFAULT_ACTIVITIES = [
  { name: "Chai", slug: "chai", icon: "Coffee", category: "Social" },
  { name: "Food", slug: "food", icon: "Utensils", category: "Social" },
  { name: "Cricket", slug: "cricket", icon: "Trophy", category: "Sports" },
  { name: "Football", slug: "football", icon: "Flame", category: "Sports" },
  { name: "Gaming", slug: "gaming", icon: "Gamepad2", category: "Lifestyle" },
  { name: "Coding", slug: "coding", icon: "Code", category: "Tech" },
  { name: "Study", slug: "study", icon: "BookOpen", category: "Academic" },
  { name: "Gym", slug: "gym", icon: "Dumbbell", category: "Fitness" },
  { name: "Movie", slug: "movie", icon: "Film", category: "Entertainment" },
  { name: "Photography", slug: "photography", icon: "Camera", category: "Creative" },
  { name: "Music", slug: "music", icon: "Music", category: "Creative" },
  { name: "Walk", slug: "walk", icon: "Footprints", category: "Lifestyle" },
  { name: "Project", slug: "project", icon: "Laptop", category: "Academic" },
  { name: "Travel", slug: "travel", icon: "Compass", category: "Adventure" },
  { name: "Other", slug: "other", icon: "Sparkles", category: "General" },
];

export const Activity: Model<IActivityDocument> =
  mongoose.models.Activity ||
  mongoose.model<IActivityDocument>("Activity", ActivitySchema);
