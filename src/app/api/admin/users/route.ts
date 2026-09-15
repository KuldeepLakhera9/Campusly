import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User, Report } from "@/lib/models";
import { requireModerator } from "@/lib/auth/admin";
import { usersQuerySchema } from "@/lib/validations/admin";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireModerator();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { searchParams } = new URL(req.url);
    const parseResult = usersQuerySchema.safeParse({
      search: searchParams.get("search") || undefined,
      role: searchParams.get("role") || undefined,
      moderationStatus: searchParams.get("moderationStatus") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters." },
        { status: 400 }
      );
    }

    const { search, role, moderationStatus, page, limit } = parseResult.data;

    await connectToDatabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (role && role !== "all") {
      filter.role = role;
    }
    if (moderationStatus && moderationStatus !== "all") {
      filter.moderationStatus = moderationStatus;
    }
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { "publicIdentity.username": { $regex: search, $options: "i" } },
        { collegeName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Count reports against each user
    const userIds = users.map((u) => u._id);
    const reportCounts = await Report.aggregate([
      { $match: { target: { $in: userIds }, targetType: "user" } },
      { $group: { _id: "$target", count: { $sum: 1 } } },
    ]);
    const reportCountMap = new Map(
      reportCounts.map((r) => [r._id.toString(), r.count])
    );

    const safeUsers = users.map((u) => ({
      id: u._id.toString(),
      email: u.email,
      collegeName: u.collegeName,
      role: u.role || "student",
      moderationStatus: u.moderationStatus || "active",
      suspensionExpiresAt: u.suspensionExpiresAt,
      lastWarnedAt: u.lastWarnedAt,
      bannedAt: u.bannedAt,
      moderationNote: u.moderationNote,
      publicIdentity: {
        username: u.publicIdentity?.username || "Student",
        avatarId: u.publicIdentity?.avatarId || "terracotta-prism",
        avatarColor: u.publicIdentity?.avatarColor || "#C15438",
      },
      reportsCount: reportCountMap.get(u._id.toString()) || 0,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({
      success: true,
      users: safeUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/admin/users error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to query users." },
      { status: 500 }
    );
  }
}
