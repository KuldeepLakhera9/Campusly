import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Report, User, Post, Comment, Hangout, AuditLog } from "@/lib/models";
import { requireModerator } from "@/lib/auth/admin";

export async function GET() {
  try {
    const auth = await requireModerator();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    await connectToDatabase();

    const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      pendingReports,
      resolvedReports,
      totalReports,
      criticalReports,
      suspendedUsers,
      bannedUsers,
      totalUsers,
      removedPosts,
      removedComments,
      removedHangouts,
      recentAuditLogsCount,
    ] = await Promise.all([
      Report.countDocuments({ status: "pending" }),
      Report.countDocuments({ status: { $in: ["resolved", "dismissed"] } }),
      Report.countDocuments(),
      Report.countDocuments({ status: "pending", priority: "critical" }),
      User.countDocuments({ moderationStatus: "suspended" }),
      User.countDocuments({ moderationStatus: "banned" }),
      User.countDocuments(),
      Post.countDocuments({ isDeleted: true }),
      Comment.countDocuments({ isDeleted: true }),
      Hangout.countDocuments({ isDeleted: true }),
      AuditLog.countDocuments({ createdAt: { $gte: past24h } }),
    ]);

    // Priority aggregation on pending reports
    const priorityAggregation = await Report.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    const priorityBreakdown: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    priorityAggregation.forEach((item) => {
      if (item._id && priorityBreakdown[item._id] !== undefined) {
        priorityBreakdown[item._id] = item.count;
      }
    });

    // Target type aggregation on pending reports
    const targetTypeAggregation = await Report.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: "$targetType", count: { $sum: 1 } } },
    ]);

    const targetTypeBreakdown: Record<string, number> = {
      post: 0,
      comment: 0,
      message: 0,
      user: 0,
      hangout: 0,
    };
    targetTypeAggregation.forEach((item) => {
      if (item._id && targetTypeBreakdown[item._id] !== undefined) {
        targetTypeBreakdown[item._id] = item.count;
      }
    });

    return NextResponse.json({
      success: true,
      metrics: {
        pendingReports,
        resolvedReports,
        totalReports,
        criticalReports,
        suspendedUsers,
        bannedUsers,
        totalUsers,
        removedPosts,
        removedComments,
        removedHangouts,
        recentAuditLogsCount,
        priorityBreakdown,
        targetTypeBreakdown,
      },
    });
  } catch (err) {
    console.error("GET /api/admin/metrics error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve admin metrics." },
      { status: 500 }
    );
  }
}
