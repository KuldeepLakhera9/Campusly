import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Report } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
import { createReportSchema } from "@/lib/validations/post";
import { ReportReason } from "@/types/post";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid post identifier." },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUserSafe();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required to submit reports." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parseResult = createReportSchema.safeParse({
      targetId: body.targetId || id,
      targetType: body.targetType || "post",
      reason: body.reason,
      details: body.details,
    });

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstIssue?.message || "Invalid report data." },
        { status: 400 }
      );
    }

    const { targetId, targetType, reason, details } = parseResult.data;

    await connectToDatabase();

    // Check for duplicate reports from the same user on the same target
    const existing = await Report.findOne({
      target: targetId,
      reporter: currentUser.id,
    });

    if (existing) {
      return NextResponse.json(
        {
          success: true,
          message: "You have already submitted a report for this content.",
        },
        { status: 200 }
      );
    }

    const reportDoc = new Report({
      reporter: currentUser.id,
      target: targetId,
      targetType,
      reason: reason as ReportReason,
      details,
      status: "pending",
    });
    await reportDoc.save();

    return NextResponse.json({
      success: true,
      message:
        "Report submitted confidentially. Our moderation team will review it.",
    });
  } catch (err) {
    console.error("POST report error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to submit report." },
      { status: 500 }
    );
  }
}
