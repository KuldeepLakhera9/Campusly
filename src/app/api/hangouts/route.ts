import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Hangout, Post, User } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
import { createHangoutSchema, hangoutQuerySchema } from "@/lib/validations/hangout";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parseResult = hangoutQuerySchema.safeParse({
      activity: searchParams.get("activity") || undefined,
      dateFilter: searchParams.get("dateFilter") || "all",
      availability: searchParams.get("availability") || "all",
      search: searchParams.get("search") || undefined,
      scope: searchParams.get("scope") || "all",
      limit: searchParams.get("limit") || 20,
      cursor: searchParams.get("cursor") || undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters." },
        { status: 400 }
      );
    }

    const { activity, dateFilter, availability, search, scope, limit, cursor } =
      parseResult.data;

    const currentUser = await getCurrentUserSafe();
    await connectToDatabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    // Campus Scoping
    if (currentUser?.college?.domain) {
      filter.collegeDomain = currentUser.college.domain;
    }

    // Activity Filter
    if (activity && activity !== "All") {
      filter.activity = { $regex: new RegExp(`^${activity}$`, "i") };
    }

    // Scope Filter (All vs Created by me vs Joined by me)
    if (scope === "created") {
      if (!currentUser) {
        return NextResponse.json(
          { success: false, error: "Unauthorized." },
          { status: 401 }
        );
      }
      filter.creator = currentUser.id;
    } else if (scope === "joined") {
      if (!currentUser) {
        return NextResponse.json(
          { success: false, error: "Unauthorized." },
          { status: 401 }
        );
      }
      filter["participants.userId"] = currentUser.id;
    }

    // Search Query (title, description, activity, location)
    if (search && search.trim().length > 0) {
      const sanitized = search.trim();
      filter.$or = [
        { title: { $regex: sanitized, $options: "i" } },
        { description: { $regex: sanitized, $options: "i" } },
        { activity: { $regex: sanitized, $options: "i" } },
        { location: { $regex: sanitized, $options: "i" } },
      ];
    }

    // Date Filters
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (dateFilter === "today") {
      filter.scheduledAt = { $gte: startOfToday, $lte: endOfToday };
    } else if (dateFilter === "tomorrow") {
      const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
      const endOfTomorrow = new Date(endOfToday.getTime() + 24 * 60 * 60 * 1000);
      filter.scheduledAt = { $gte: startOfTomorrow, $lte: endOfTomorrow };
    } else if (dateFilter === "this_week") {
      const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
      filter.scheduledAt = { $gte: startOfToday, $lte: endOfWeek };
    }

    // Availability Filter
    if (availability === "has_spots") {
      filter.status = "open";
      filter.$expr = { $lt: ["$participantsCount", "$maxParticipants"] };
    } else if (availability === "almost_full") {
      filter.status = "open";
      filter.$expr = {
        $and: [
          { $lt: ["$participantsCount", "$maxParticipants"] },
          { $gte: ["$participantsCount", { $subtract: ["$maxParticipants", 2] }] },
        ],
      };
    }

    // Cursor Pagination
    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        filter.createdAt = { $lt: cursorDate };
      }
    }

    const rawHangouts = await Hangout.find(filter)
      .sort({ scheduledAt: 1, createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = rawHangouts.length > limit;
    const hangoutsToReturn = hasMore ? rawHangouts.slice(0, limit) : rawHangouts;
    const nextCursor =
      hangoutsToReturn.length > 0
        ? hangoutsToReturn[hangoutsToReturn.length - 1].createdAt?.toISOString?.() ||
          new Date(hangoutsToReturn[hangoutsToReturn.length - 1].createdAt).toISOString()
        : undefined;

    // Sanitize and derive dynamic status
    const hangouts = hangoutsToReturn.map((h) => {
      const creatorIdStr = h.creator?.toString?.() || "";
      const isCreator = Boolean(currentUser && creatorIdStr === currentUser.id);

      const hasJoined = Boolean(
        currentUser &&
          h.participants?.some(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (p: any) => p.userId?.toString?.() === currentUser.id
          )
      );

      // Derive status if time has passed
      let dynamicStatus = h.status;
      if (h.status !== "cancelled") {
        if (h.participantsCount >= h.maxParticipants) {
          dynamicStatus = "full";
        } else if (new Date(h.scheduledAt).getTime() < now.getTime() - 2 * 60 * 60 * 1000) {
          dynamicStatus = "completed";
        } else if (
          new Date(h.scheduledAt).getTime() <= now.getTime() &&
          new Date(h.scheduledAt).getTime() >= now.getTime() - 2 * 60 * 60 * 1000
        ) {
          dynamicStatus = "ongoing";
        }
      }

      return {
        _id: h._id.toString(),
        title: h.title,
        description: h.description,
        activity: h.activity,
        location: h.location,
        date: h.date ? new Date(h.date).toISOString() : new Date().toISOString(),
        startTime: h.startTime,
        endTime: h.endTime,
        scheduledAt: h.scheduledAt ? new Date(h.scheduledAt).toISOString() : new Date().toISOString(),
        maxParticipants: h.maxParticipants,
        participantsCount: h.participantsCount ?? h.participants?.length ?? 1,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        participants: (h.participants || []).map((p: any) => ({
          userId: p.userId?.toString?.() || "",
          pseudonym: p.pseudonym,
          avatarId: p.avatarId || "terracotta-prism",
          avatarColor: p.avatarColor || "#C15438",
          joinedAt: p.joinedAt ? new Date(p.joinedAt).toISOString() : new Date().toISOString(),
        })),
        creator: {
          username: h.creatorPseudonym,
          avatarId: h.creatorAvatarId || "terracotta-prism",
          avatarColor: h.creatorAvatarColor || "#C15438",
        },
        collegeName: h.collegeName,
        collegeDomain: h.collegeDomain,
        status: dynamicStatus,
        isCreator,
        hasJoined,
        shareToFeed: h.shareToFeed ?? true,
        createdAt: h.createdAt ? new Date(h.createdAt).toISOString() : new Date().toISOString(),
        // Backward compatibility
        category: h.activity,
        campus: h.collegeName,
        locationSpot: h.location,
        scheduledTime: h.scheduledAt,
        hostPseudonym: h.creatorPseudonym,
        hostAvatarColor: h.creatorAvatarColor,
      };
    });

    return NextResponse.json({
      success: true,
      hangouts,
      hasMore,
      nextCursor: hasMore ? nextCursor : undefined,
    });
  } catch (err) {
    console.error("GET /api/hangouts error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve hangouts." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserSafe();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required to host a hangout." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parseResult = createHangoutSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstIssue?.message || "Invalid hangout details." },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      activity,
      location,
      date,
      startTime,
      endTime,
      maxParticipants,
      shareToFeed,
    } = parseResult.data;

    // Construct scheduled timestamp
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid date format." },
        { status: 400 }
      );
    }

    // Parse startTime (e.g. "17:30" or "5:30 PM")
    let hours = 17;
    let minutes = 30;
    if (startTime.includes(":")) {
      const parts = startTime.split(":");
      hours = parseInt(parts[0], 10) || 12;
      minutes = parseInt(parts[1], 10) || 0;
      if (startTime.toLowerCase().includes("pm") && hours < 12) hours += 12;
      if (startTime.toLowerCase().includes("am") && hours === 12) hours = 0;
    }

    const scheduledAt = new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      hours,
      minutes
    );

    await connectToDatabase();

    const creatorPseudonym =
      currentUser.publicIdentity?.username || `Student${currentUser.id.slice(-4)}`;
    const creatorAvatarId =
      currentUser.publicIdentity?.avatarId || "terracotta-prism";
    const creatorAvatarColor =
      currentUser.publicIdentity?.avatarColor || "#C15438";

    // Auto-join creator as participant #1
    const initialParticipant = {
      userId: new mongoose.Types.ObjectId(currentUser.id),
      pseudonym: creatorPseudonym,
      avatarId: creatorAvatarId,
      avatarColor: creatorAvatarColor,
      joinedAt: new Date(),
    };

    const hangoutDoc = new Hangout({
      creator: new mongoose.Types.ObjectId(currentUser.id),
      creatorPseudonym,
      creatorAvatarId,
      creatorAvatarColor,
      collegeName: currentUser.college?.name || "UC Berkeley",
      collegeDomain: currentUser.college?.domain || "berkeley.edu",
      title,
      description: description || "",
      activity,
      location,
      date: dateObj,
      startTime,
      endTime,
      scheduledAt,
      maxParticipants,
      participantsCount: 1,
      participants: [initialParticipant],
      status: "open",
      shareToFeed,
    });

    await hangoutDoc.save();

    // Award 3 sparks to creator for hosting a campus activity
    await User.findByIdAndUpdate(currentUser.id, {
      $inc: { sparksCount: 3 },
    });

    // Optionally share a companion post to the anonymous campus feed
    if (shareToFeed) {
      try {
        const feedPost = new Post({
          author: new mongoose.Types.ObjectId(currentUser.id),
          authorPseudonym: currentUser.publicIdentity.username,
          authorAvatarId: currentUser.publicIdentity.avatarId,
          authorAvatarColor: currentUser.publicIdentity.avatarColor,
          collegeName: currentUser.college.name,
          collegeDomain: currentUser.college.domain,
          content: `⚡ ${title.toUpperCase()}\n\n${description ? description + "\n\n" : ""}📍 ${location}\n⏰ ${startTime}\nSpots: ${maxParticipants - 1} open (1/${maxParticipants} joined)\n\nJoin this spontaneous meetup on the Hangouts board!`,
          category: "Hangout",
          reactionCount: 0,
          commentCount: 0,
        });
        await feedPost.save();
      } catch (feedErr) {
        console.error("Failed to generate companion feed post:", feedErr);
      }
    }

    const sanitizedHangout = {
      _id: hangoutDoc._id.toString(),
      title: hangoutDoc.title,
      description: hangoutDoc.description,
      activity: hangoutDoc.activity,
      location: hangoutDoc.location,
      date: hangoutDoc.date.toISOString(),
      startTime: hangoutDoc.startTime,
      endTime: hangoutDoc.endTime,
      scheduledAt: hangoutDoc.scheduledAt.toISOString(),
      maxParticipants: hangoutDoc.maxParticipants,
      participantsCount: 1,
      participants: [
        {
          userId: currentUser.id,
          pseudonym: initialParticipant.pseudonym,
          avatarId: initialParticipant.avatarId,
          avatarColor: initialParticipant.avatarColor,
          joinedAt: initialParticipant.joinedAt.toISOString(),
        },
      ],
      creator: {
        username: hangoutDoc.creatorPseudonym,
        avatarId: hangoutDoc.creatorAvatarId,
        avatarColor: hangoutDoc.creatorAvatarColor,
      },
      collegeName: hangoutDoc.collegeName,
      collegeDomain: hangoutDoc.collegeDomain,
      status: "open",
      isCreator: true,
      hasJoined: true,
      shareToFeed: hangoutDoc.shareToFeed,
      createdAt: hangoutDoc.createdAt.toISOString(),
      // Backward compatibility
      category: hangoutDoc.activity,
      campus: hangoutDoc.collegeName,
      locationSpot: hangoutDoc.location,
      scheduledTime: hangoutDoc.scheduledAt,
      hostPseudonym: hangoutDoc.creatorPseudonym,
      hostAvatarColor: hangoutDoc.creatorAvatarColor,
    };

    return NextResponse.json(
      {
        success: true,
        hangout: sanitizedHangout,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/hangouts error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create hangout." },
      { status: 500 }
    );
  }
}
