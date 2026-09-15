import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { AuditLog } from "@/lib/models";
import { requireModerator } from "@/lib/auth/admin";
import { auditLogsQuerySchema } from "@/lib/validations/admin";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireModerator();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { searchParams } = new URL(req.url);
    const parseResult = auditLogsQuerySchema.safeParse({
      action: searchParams.get("action") || undefined,
      actor: searchParams.get("actor") || undefined,
      targetType: searchParams.get("targetType") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "25",
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters." },
        { status: 400 }
      );
    }

    const { action, actor, targetType, search, page, limit } = parseResult.data;

    await connectToDatabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (action && action !== "all") {
      filter.action = action;
    }
    if (targetType && targetType !== "all") {
      filter.targetType = targetType;
    }
    if (actor) {
      filter.actorPseudonym = { $regex: actor, $options: "i" };
    }
    if (search) {
      filter.$or = [
        { reason: { $regex: search, $options: "i" } },
        { targetId: { $regex: search, $options: "i" } },
        { actorPseudonym: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("actor", "email role publicIdentity")
        .lean(),
    ]);

    interface PopulatedActor {
      _id?: mongoose.Types.ObjectId;
      email?: string;
      role?: string;
      publicIdentity?: { username?: string };
    }

    const formattedLogs = logs.map((log) => {
      const actorObj = log.actor as unknown as PopulatedActor | undefined;
      return {
        id: log._id.toString(),
        actor: {
          id: actorObj?._id?.toString(),
          pseudonym: log.actorPseudonym || actorObj?.publicIdentity?.username || "Staff",
          role: log.actorRole || actorObj?.role || "moderator",
          email: actorObj?.email,
        },
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        reason: log.reason,
        metadata: log.metadata,
        createdAt: log.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/admin/audit-logs error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to query audit logs." },
      { status: 500 }
    );
  }
}
