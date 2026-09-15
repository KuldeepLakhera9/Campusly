import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Report, Post, Comment, Message, User, Hangout } from "@/lib/models";
import { requireModerator } from "@/lib/auth/admin";
import { reportsQuerySchema } from "@/lib/validations/admin";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireModerator();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { searchParams } = new URL(req.url);
    const parseResult = reportsQuerySchema.safeParse({
      status: searchParams.get("status") || "pending",
      priority: searchParams.get("priority") || undefined,
      targetType: searchParams.get("targetType") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters." },
        { status: 400 }
      );
    }

    const { status, priority, targetType, search, page, limit } = parseResult.data;

    await connectToDatabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (status && status !== "all") {
      filter.status = status;
    }
    if (priority && priority !== "all") {
      filter.priority = priority;
    }
    if (targetType && targetType !== "all") {
      filter.targetType = targetType;
    }
    if (search) {
      filter.$or = [
        { reason: { $regex: search, $options: "i" } },
        { details: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, reports] = await Promise.all([
      Report.countDocuments(filter),
      Report.find(filter)
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("reporter", "email collegeName publicIdentity")
        .populate("reviewedBy", "publicIdentity role")
        .populate("assignedTo", "publicIdentity role")
        .lean(),
    ]);

    // Enhance reports with target content preview
    const enhancedReports = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reports.map(async (rep: any) => {
        let targetSummary: {
          title?: string;
          contentSnippet?: string;
          authorPseudonym?: string;
          isDeleted?: boolean;
        } = {};

        try {
          switch (rep.targetType) {
            case "post": {
              const p = await Post.findById(rep.target).select("content isDeleted authorPseudonym title").lean();
              if (p) {
                targetSummary = {
                  contentSnippet: p.content ? p.content.slice(0, 100) : "",
                  authorPseudonym: p.authorPseudonym,
                  isDeleted: p.isDeleted,
                };
              }
              break;
            }
            case "comment": {
              const c = await Comment.findById(rep.target).select("content isDeleted authorPseudonym").lean();
              if (c) {
                targetSummary = {
                  contentSnippet: c.content ? c.content.slice(0, 100) : "",
                  authorPseudonym: c.authorPseudonym,
                  isDeleted: c.isDeleted,
                };
              }
              break;
            }
            case "message": {
              const m = await Message.findById(rep.target).select("content isDeleted senderPseudonym").lean();
              if (m) {
                targetSummary = {
                  contentSnippet: m.content ? m.content.slice(0, 100) : "",
                  authorPseudonym: m.senderPseudonym,
                  isDeleted: m.isDeleted,
                };
              }
              break;
            }
            case "hangout": {
              const h = await Hangout.findById(rep.target).select("title description isDeleted hostPseudonym").lean();
              if (h) {
                targetSummary = {
                  title: h.title,
                  contentSnippet: h.description ? h.description.slice(0, 100) : "",
                  authorPseudonym: h.hostPseudonym,
                  isDeleted: h.isDeleted,
                };
              }
              break;
            }
            case "user": {
              const u = await User.findById(rep.target).select("publicIdentity moderationStatus collegeName").lean();
              if (u) {
                targetSummary = {
                  authorPseudonym: u.publicIdentity?.username,
                  contentSnippet: `Status: ${u.moderationStatus || "active"} • ${u.collegeName}`,
                };
              }
              break;
            }
          }
        } catch {
          // ignore target preview error
        }

        return {
          id: rep._id.toString(),
          targetId: rep.target?.toString(),
          targetType: rep.targetType,
          reason: rep.reason,
          details: rep.details,
          status: rep.status,
          priority: rep.priority,
          createdAt: rep.createdAt,
          reporter: rep.reporter
            ? {
                id: rep.reporter._id?.toString(),
                email: rep.reporter.email,
                pseudonym: rep.reporter.publicIdentity?.username,
                collegeName: rep.reporter.collegeName,
              }
            : null,
          reviewedBy: rep.reviewedBy
            ? {
                id: rep.reviewedBy._id?.toString(),
                pseudonym: rep.reviewedBy.publicIdentity?.username,
              }
            : null,
          reviewedAt: rep.reviewedAt,
          resolutionReason: rep.resolutionReason,
          targetSummary,
        };
      })
    );

    return NextResponse.json({
      success: true,
      reports: enhancedReports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/admin/reports error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to query reports." },
      { status: 500 }
    );
  }
}
