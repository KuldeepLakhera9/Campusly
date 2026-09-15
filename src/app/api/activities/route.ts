import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Activity, DEFAULT_ACTIVITIES } from "@/lib/models/Activity";

export async function GET() {
  try {
    await connectToDatabase();

    // Auto-seed activities if empty
    const count = await Activity.countDocuments();
    if (count === 0) {
      await Activity.insertMany(DEFAULT_ACTIVITIES);
    }

    const activities = await Activity.find({ isActive: true })
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      activities: activities.map((a) => ({
        id: a._id.toString(),
        name: a.name,
        slug: a.slug,
        icon: a.icon,
        category: a.category,
      })),
    });
  } catch (err) {
    console.error("GET /api/activities error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load activities." },
      { status: 500 }
    );
  }
}
