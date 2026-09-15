import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User, Block } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
import { peopleQuerySchema } from "@/lib/validations/people";
import { calculateMatch, CandidateUser } from "@/lib/matching/engine";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserSafe();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required to discover campus peers." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const queryParams = {
      search: searchParams.get("search") || undefined,
      interest: searchParams.get("interest") || undefined,
      intent: searchParams.get("intent") || undefined,
      minShared: searchParams.get("minShared") || undefined,
      sort: searchParams.get("sort") || "recommended",
      limit: searchParams.get("limit") || undefined,
      page: searchParams.get("page") || undefined,
    };

    const parseResult = peopleQuerySchema.safeParse(queryParams);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.issues[0]?.message || "Invalid query parameters." },
        { status: 400 }
      );
    }

    const { search, interest, intent, minShared, sort, limit, page } = parseResult.data;

    await connectToDatabase();
    const currentUserId = new mongoose.Types.ObjectId(currentUser.id);

    // 1. Fetch blocked user relationships (two-way exclusion)
    const blockDocs = await Block.find({
      $or: [{ blocker: currentUserId }, { blocked: currentUserId }],
    })
      .select("blocker blocked")
      .lean();

    const blockedUserIds: mongoose.Types.ObjectId[] = [];
    for (const b of blockDocs) {
      if (b.blocker.toString() === currentUser.id) {
        blockedUserIds.push(b.blocked as mongoose.Types.ObjectId);
      } else {
        blockedUserIds.push(b.blocker as mongoose.Types.ObjectId);
      }
    }

    // 2. Build MongoDB query filter
    // Strict Campus Isolation: only peers from same college domain
    const queryFilter: Record<string, unknown> = {
      _id: { $ne: currentUserId, $nin: blockedUserIds },
      collegeDomain: currentUser.college.domain,
      onboardingCompleted: true,
      status: "active",
      "privacySettings.appearInFindPeople": { $ne: false },
    };

    // Filter by specific interest tag if selected
    if (interest && interest.trim() !== "") {
      queryFilter["publicIdentity.interests"] = {
        $regex: new RegExp(`^${interest.trim()}$`, "i"),
      };
    }

    // Filter by intent / lookingFor if selected
    if (intent && intent !== "Anything" && intent.trim() !== "") {
      queryFilter["publicIdentity.lookingFor"] = {
        $regex: new RegExp(`^${intent.trim()}$`, "i"),
      };
    }

    // Search query: username, interest, or bio
    if (search && search.trim() !== "") {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      queryFilter.$or = [
        { "publicIdentity.username": { $regex: sanitized, $options: "i" } },
        { "publicIdentity.interests": { $regex: sanitized, $options: "i" } },
        { "publicIdentity.lookingFor": { $regex: sanitized, $options: "i" } },
        { "publicIdentity.bio": { $regex: sanitized, $options: "i" } },
      ];
    }

    // 3. Query candidate set (fetch top 150 matching candidates to score in memory)
    const candidateDocs = (await User.find(queryFilter)
      .select("publicIdentity collegeName sparksCount createdAt updatedAt")
      .limit(150)
      .lean()) as unknown as CandidateUser[];

    // 4. Calculate deterministic match scores and explanations
    let matches = candidateDocs.map((candidate) =>
      calculateMatch(
        {
          id: currentUser.id,
          interests: currentUser.publicIdentity.interests || [],
          lookingFor: currentUser.publicIdentity.lookingFor || [],
          sparksCount: currentUser.sparksCount,
        },
        candidate
      )
    );

    // 5. Apply minShared threshold if requested
    if (typeof minShared === "number" && minShared > 0) {
      matches = matches.filter((m) => m.sharedCount >= minShared);
    }

    // 6. Sort results
    if (sort === "shared") {
      matches.sort((a, b) => b.sharedCount - a.sharedCount || b.score - a.score);
    } else if (sort === "newest") {
      matches.sort((a, b) => {
        const dateA = a.user.createdAt ? new Date(a.user.createdAt).getTime() : 0;
        const dateB = b.user.createdAt ? new Date(b.user.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    } else if (sort === "active") {
      matches.sort((a, b) => b.user.sparksCount - a.user.sparksCount || b.score - a.score);
    } else {
      // Default: "recommended"
      matches.sort((a, b) => b.score - a.score || b.sharedCount - a.sharedCount);
    }

    // 7. Paginate
    const total = matches.length;
    const startIndex = (page - 1) * limit;
    const paginatedPeople = matches.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < total;

    return NextResponse.json({
      success: true,
      people: paginatedPeople,
      pagination: {
        total,
        page,
        limit,
        hasMore,
      },
      currentUserDiscoveryEnabled:
        currentUser.privacySettings.appearInFindPeople !== false,
      currentUserInterestsCount:
        currentUser.publicIdentity.interests?.length || 0,
    });
  } catch (err) {
    console.error("GET /api/people error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve campus matches." },
      { status: 500 }
    );
  }
}
