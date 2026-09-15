import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { College } from "@/lib/models/College";

const DEFAULT_COLLEGES = [
  { name: "UC Berkeley", domain: "berkeley.edu", city: "Berkeley", state: "CA", isActive: true },
  { name: "Stanford University", domain: "stanford.edu", city: "Stanford", state: "CA", isActive: true },
  { name: "UCLA", domain: "ucla.edu", city: "Los Angeles", state: "CA", isActive: true },
  { name: "Columbia University", domain: "columbia.edu", city: "New York", state: "NY", isActive: true },
  { name: "University of Michigan", domain: "umich.edu", city: "Ann Arbor", state: "MI", isActive: true },
  { name: "University of Washington", domain: "uw.edu", city: "Seattle", state: "WA", isActive: true },
  { name: "MIT", domain: "mit.edu", city: "Cambridge", state: "MA", isActive: true },
  { name: "UT Austin", domain: "utexas.edu", city: "Austin", state: "TX", isActive: true },
  { name: "Georgia Tech", domain: "gatech.edu", city: "Atlanta", state: "GA", isActive: true },
  { name: "Other Accredited College", domain: "college.edu", city: "Campus", state: "US", isActive: true },
];

export async function GET() {
  try {
    await connectToDatabase();

    let colleges = await College.find({ isActive: true }).sort({ name: 1 }).lean();

    // Auto-seed default colleges if none exist
    if (!colleges || colleges.length === 0) {
      await College.insertMany(DEFAULT_COLLEGES);
      colleges = await College.find({ isActive: true }).sort({ name: 1 }).lean();
    }

    return NextResponse.json({
      success: true,
      colleges: colleges.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        domain: c.domain,
        city: c.city,
        state: c.state,
      })),
    });
  } catch (err) {
    console.error("Colleges API error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve colleges.",
        colleges: DEFAULT_COLLEGES.map((c, idx) => ({ id: `default-${idx}`, ...c })),
      },
      { status: 500 }
    );
  }
}
