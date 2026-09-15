import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Report, Post, Comment, Message, User, Hangout } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
import { unifiedReportSchema } from "@/lib/validations/admin";
import { ReportPriority } from "@/types/admin";
import mongoose from "mongoose";

function computePriority(reason: string, details?: string): ReportPriority {
  const normalized = `${reason} ${details || ""}`.toLowerCase();
  if (
    normalized.includes("self-harm") ||
    normalized.includes("suicide") ||
    normalized.includes("danger") ||
    normalized.includes("violence") ||
    normalized.includes("threat")
  ) {
    return "critical";
  }
  if (
    normalized.includes("harassment") ||
    normalized.includes("hate") ||
    normalized.includes("doxxing") ||
    normalized.includes("inappropriate")
  ) {
    return "high";
  }
  if (normalized.includes("spam") || normalized.includes("misleading")) {
    return "low";
  }
  return "medium";
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserSafe();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required to submit reports." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parseResult = unifiedReportSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstIssue?.message || "Invalid report data." },
        { status: 400 }
      );
    }

    const { targetId, targetType, reason, details } = parseResult.data;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return NextResponse.json(
        { success: false, error: "Invalid target ID." },
        { status: 400 }
      );
    }

    if (targetType === "user" && targetId === currentUser.id) {
      return NextResponse.json(
        { success: false, error: "You cannot report yourself." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify target existence
    let targetExists = false;
    const targetObjectId = new mongoose.Types.ObjectId(targetId);

    switch (targetType) {
      case "post": {
        const post = await Post.findById(targetObjectId);
        targetExists = !!post;
        break;
      }
      case "comment": {
        const comment = await Comment.findById(targetObjectId);
        targetExists = !!comment;
        break;
      }
      case "message": {
        const msg = await Message.findById(targetObjectId);
        targetExists = !!msg;
        break;
      }
      case "user": {
        const user = await User.findById(targetObjectId);
        targetExists = !!user;
        break;
      }
      case "hangout": {
        const hangout = await Hangout.findById(targetObjectId);
        targetExists = !!hangout;
        break;
      }
    }

    if (!targetExists) {
      return NextResponse.json(
        { success: false, error: `Report target (${targetType}) not found.` },
        { status: 404 }
      );
    }

    // Check for duplicate reports by the same reporter for the same target
    const reporterObjectId = new mongoose.Types.ObjectId(currentUser.id);
    const existing = await Report.findOne({
      target: targetObjectId,
      reporter: reporterObjectId,
    });

    if (existing) {
      return NextResponse.json(
        {
          success: true,
          message: "You have already submitted a report for this item.",
          reportId: existing._id.toString(),
        },
        { status: 200 }
      );
    }

    const priority = computePriority(reason, details);

    const reportDoc = new Report({
      reporter: reporterObjectId,
      target: targetObjectId,
      targetType,
      reason,
      details,
      priority,
      status: "pending",
    });

    await reportDoc.save();

    return NextResponse.json(
      {
        success: true,
        message: "Report submitted confidentially. Our safety team will review it.",
        reportId: reportDoc._id.toString(),
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { success: true, message: "You have already submitted a report for this item." },
        { status: 200 }
      );
    }
    console.error("POST /api/reports error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to submit report." },
      { status: 500 }
    );
  }
}
