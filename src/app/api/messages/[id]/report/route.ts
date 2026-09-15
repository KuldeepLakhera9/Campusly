import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Message, Report } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
import { reportMessageSchema } from "@/lib/validations/message";
import mongoose from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserSafe();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid message ID." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parseResult = reportMessageSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstIssue?.message || "Invalid report data." },
        { status: 400 }
      );
    }

    const { reason, details } = parseResult.data;

    await connectToDatabase();
    const msgId = new mongoose.Types.ObjectId(id);
    const reporterId = new mongoose.Types.ObjectId(currentUser.id);

    const message = await Message.findById(msgId);
    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message not found." },
        { status: 404 }
      );
    }

    // Check for duplicate report
    const existingReport = await Report.findOne({
      target: msgId,
      reporter: reporterId,
    });

    if (existingReport) {
      return NextResponse.json(
        { success: true, message: "Report received previously.", reportId: existingReport._id },
        { status: 200 }
      );
    }

    const report = new Report({
      reporter: reporterId,
      target: msgId,
      targetType: "message",
      reason,
      details: details || "",
      status: "pending",
    });
    await report.save();

    return NextResponse.json(
      {
        success: true,
        message: "Thank you. Our campus moderation team has received your report.",
        reportId: report._id,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/messages/[id]/report error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to submit report." },
      { status: 500 }
    );
  }
}
