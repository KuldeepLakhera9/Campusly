import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Post, Reaction, User } from "@/lib/models";
import { getCurrentUserSafe } from "@/lib/auth/session";
import { createPostSchema, postQuerySchema } from "@/lib/validations/post";
import { checkUserModerationStatus } from "@/lib/auth/admin";
import { PostCategory } from "@/types/post";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parseResult = postQuerySchema.safeParse({
      category: searchParams.get("category") || undefined,
      sort: searchParams.get("sort") || "latest",
      search: searchParams.get("search") || undefined,
      limit: searchParams.get("limit") || 20,
      cursor: searchParams.get("cursor") || undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters." },
        { status: 400 }
      );
    }

    const { category, sort, search, limit, cursor } = parseResult.data;
    const currentUser = await getCurrentUserSafe();

    await connectToDatabase();

    // Opportunistic cleanup of expired confessions older than 14 days
    Post.deleteMany({
      $or: [
        { category: "Confession", createdAt: { $lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
        { expiresAt: { $ne: null, $lte: new Date() } },
      ],
    }).exec().catch(() => {});

    // Base query filter (exclude soft-deleted posts and expired confessions from public feed)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {
      isDeleted: { $ne: true },
      $or: [
        { expiresAt: null },
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    };

    if (category && category !== "All" && category !== "All Circles") {
      filter.category = category;
    }

    if (search && search.trim().length > 0) {
      const sanitized = search.trim();
      const expiryClause = {
        $or: [
          { expiresAt: null },
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } },
        ],
      };
      delete filter.$or;
      filter.$and = [
        expiryClause,
        {
          $or: [
            { content: { $regex: sanitized, $options: "i" } },
            { category: { $regex: sanitized, $options: "i" } },
          ],
        },
      ];
    }

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        filter.createdAt = { $lt: cursorDate };
      }
    }

    let rawPosts: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (sort === "trending") {
      // Aggregate with recency & engagement score: (likes*2 + comments*3 + 1) / (hoursAge + 2)^1.5
      const pipeline: mongoose.PipelineStage[] = [
        { $match: filter },
        {
          $addFields: {
            ageInHours: {
              $divide: [
                { $subtract: [new Date(), "$createdAt"] },
                1000 * 60 * 60,
              ],
            },
          },
        },
        {
          $addFields: {
            trendingScore: {
              $divide: [
                {
                  $add: [
                    { $multiply: ["$reactionCount", 2] },
                    { $multiply: ["$commentCount", 3] },
                    1,
                  ],
                },
                { $pow: [{ $add: ["$ageInHours", 2] }, 1.5] },
              ],
            },
          },
        },
        { $sort: { trendingScore: -1, createdAt: -1 } },
        { $limit: limit + 1 },
      ];

      rawPosts = await Post.aggregate(pipeline);
    } else {
      let sortSpec: Record<string, 1 | -1> = { createdAt: -1 };
      if (sort === "popular") {
        sortSpec = { reactionCount: -1, commentCount: -1, createdAt: -1 };
      }

      rawPosts = await Post.find(filter)
        .sort(sortSpec)
        .limit(limit + 1)
        .lean();
    }

    const hasMore = rawPosts.length > limit;
    const postsToReturn = hasMore ? rawPosts.slice(0, limit) : rawPosts;
    const nextCursor =
      postsToReturn.length > 0
        ? postsToReturn[postsToReturn.length - 1].createdAt?.toISOString?.() ||
          new Date(postsToReturn[postsToReturn.length - 1].createdAt).toISOString()
        : undefined;

    // Check which posts the current user has reacted to
    const reactedPostIds = new Set<string>();
    if (currentUser && postsToReturn.length > 0) {
      const postIds = postsToReturn.map((p) => p._id);
      const userReactions = await Reaction.find({
        post: { $in: postIds },
        user: currentUser.id,
        type: "like",
      })
        .select("post")
        .lean();

      userReactions.forEach((r) => reactedPostIds.add(r.post.toString()));
    }

    // Map to sanitized public interface strictly omitting private data
    const posts = postsToReturn.map((p) => {
      const postIdStr = p._id.toString();
      const authorIdStr = p.author?.toString?.() || "";
      const isAuthor = Boolean(currentUser && authorIdStr === currentUser.id);

      return {
        id: postIdStr,
        _id: postIdStr,
        content: p.content,
        category: p.category,
        collegeName: p.collegeName || "Campus",
        collegeDomain: p.collegeDomain || "college.edu",
        reactionCount: p.reactionCount ?? 0,
        commentCount: p.commentCount ?? 0,
        hasReacted: reactedPostIds.has(postIdStr),
        isAuthor,
        expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString() : null,
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
        author: {
          id: authorIdStr,
          username: p.authorPseudonym || "Campus Student",
          avatarId: p.authorAvatarId || "terracotta-prism",
          avatarColor: p.authorAvatarColor || "#C15438",
        },
        // Backward compatibility
        circle: p.category,
        authorPseudonym: p.authorPseudonym,
        authorAvatarColor: p.authorAvatarColor,
        upvotesCount: p.reactionCount ?? 0,
        repliesCount: p.commentCount ?? 0,
        userUpvoted: reactedPostIds.has(postIdStr),
        campus: p.collegeName,
      };
    });

    return NextResponse.json({
      success: true,
      posts,
      hasMore,
      nextCursor: hasMore ? nextCursor : undefined,
    });
  } catch (err) {
    console.error("GET /api/posts error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load campus feed." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserSafe();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required to share a thought." },
        { status: 401 }
      );
    }

    const modCheck = await checkUserModerationStatus(currentUser.id);
    if (!modCheck.allowed) {
      return modCheck.errorResponse!;
    }

    const body = await req.json();
    const parseResult = createPostSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstIssue?.message || "Invalid post data." },
        { status: 400 }
      );
    }

    const { content, category } = parseResult.data;

    await connectToDatabase();

    const isConfession = category === "Confession";
    const expiresAt = isConfession
      ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      : null;

    const postDoc = new Post({
      author: currentUser.id,
      authorPseudonym: currentUser.publicIdentity.username,
      authorAvatarId: currentUser.publicIdentity.avatarId,
      authorAvatarColor: currentUser.publicIdentity.avatarColor,
      collegeName: currentUser.college.name,
      collegeDomain: currentUser.college.domain,
      content,
      category: category as PostCategory,
      reactionCount: 0,
      commentCount: 0,
      expiresAt,
    });
    await postDoc.save();

    // Award 2 sparks to the user for contributing to campus
    await User.findByIdAndUpdate(currentUser.id, {
      $inc: { sparksCount: 2 },
    });

    const sanitizedPost = {
      id: postDoc._id.toString(),
      _id: postDoc._id.toString(),
      content: postDoc.content,
      category: postDoc.category,
      collegeName: postDoc.collegeName,
      collegeDomain: postDoc.collegeDomain,
      reactionCount: 0,
      commentCount: 0,
      hasReacted: false,
      isAuthor: true,
      expiresAt: postDoc.expiresAt ? postDoc.expiresAt.toISOString() : null,
      createdAt: postDoc.createdAt.toISOString(),
      author: {
        username: postDoc.authorPseudonym,
        avatarId: postDoc.authorAvatarId,
        avatarColor: postDoc.authorAvatarColor,
      },
      // Backward compatibility
      circle: postDoc.category,
      authorPseudonym: postDoc.authorPseudonym,
      authorAvatarColor: postDoc.authorAvatarColor,
      upvotesCount: 0,
      repliesCount: 0,
      userUpvoted: false,
      campus: postDoc.collegeName,
    };

    return NextResponse.json(
      {
        success: true,
        post: sanitizedPost,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/posts error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to publish post." },
      { status: 500 }
    );
  }
}
