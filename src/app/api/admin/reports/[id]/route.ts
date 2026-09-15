import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Report, Post, Comment, Message, User, Hangout } from "@/lib/models";
import { requireModerator, recordAuditLog } from "@/lib/auth/admin";
import { updateReportSchema } from "@/lib/validations/admin";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireModerator();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid report ID." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const report = await Report.findById(id)
      .populate("reporter", "email collegeName collegeDomain publicIdentity")
      .populate("reviewedBy", "publicIdentity role")
      .lean();

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found." },
        { status: 404 }
      );
    }

    // Retrieve target details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let targetDetails: any = null;
    try {
      switch (report.targetType) {
        case "post": {
          targetDetails = await Post.findById(report.target).lean();
          break;
        }
        case "comment": {
          targetDetails = await Comment.findById(report.target).lean();
          break;
        }
        case "message": {
          targetDetails = await Message.findById(report.target).lean();
          break;
        }
        case "hangout": {
          targetDetails = await Hangout.findById(report.target).lean();
          break;
        }
        case "user": {
          targetDetails = await User.findById(report.target)
            .select("email collegeName role moderationStatus suspensionExpiresAt publicIdentity createdAt")
            .lean();
          break;
        }
      }
    } catch {
      targetDetails = null;
    }

    return NextResponse.json({
      success: true,
      report: {
        ...report,
        id: report._id.toString(),
      },
      targetDetails,
    });
  } catch (err) {
    console.error("GET /api/admin/reports/[id] error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve report." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireModerator();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid report ID." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parseResult = updateReportSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstIssue?.message || "Invalid update data." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const report = await Report.findById(id);
    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found." },
        { status: 404 }
      );
    }

    const { status, priority, resolutionReason, assignedTo } = parseResult.data;

    const previousStatus = report.status;
    if (status) report.status = status;
    if (priority) report.priority = priority;
    if (resolutionReason !== undefined) report.resolutionReason = resolutionReason;
    if (assignedTo !== undefined) {
      report.assignedTo = assignedTo ? new mongoose.Types.ObjectId(assignedTo) : null;
    }

    if (status === "resolved" || status === "dismissed") {
      report.reviewedBy = auth.adminContext.user._id;
      report.reviewedAt = new Date();
    }

    await report.save();

    await recordAuditLog({
      actor: auth.adminContext.user,
      action: status === "resolved" ? "report_resolved" : status === "dismissed" ? "report_dismissed" : "report_updated",
      targetType: "report",
      targetId: report._id,
      reason: resolutionReason || `Status changed from ${previousStatus} to ${report.status}`,
      metadata: {
        previousStatus,
        newStatus: report.status,
        targetType: report.targetType,
        targetId: report.target.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Report ${report.status}.`,
      report: {
        id: report._id.toString(),
        status: report.status,
        priority: report.priority,
        resolutionReason: report.resolutionReason,
        reviewedAt: report.reviewedAt,
      },
    });
  } catch (err) {
    console.error("PATCH /api/admin/reports/[id] error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update report." },
      { status: 500 }
    );
  }
}
