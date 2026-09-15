"use client";

import * as React from "react";
import { IPost } from "@/types/post";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils/formatters";
import { MessageSquare, ArrowBigUp, Share2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface PostCardProps {
  post: IPost;
}

export function PostCard({ post }: PostCardProps) {
  const [upvotes, setUpvotes] = React.useState(post.upvotesCount);
  const [hasUpvoted, setHasUpvoted] = React.useState(post.userUpvoted || false);

  const handleUpvote = () => {
    if (hasUpvoted) {
      setHasUpvoted(false);
      setUpvotes((prev) => prev - 1);
    } else {
      setHasUpvoted(true);
      setUpvotes((prev) => prev + 1);
    }
  };

  return (
    <Card className="p-5 hover:border-campus-border-strong transition-all">
      {/* Author Bar */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <Avatar
            moniker={post.authorPseudonym}
            color={post.authorAvatarColor}
            size="sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-campus-charcoal">
                {post.authorPseudonym}
              </span>
              <span className="text-[11px] text-campus-subtle">•</span>
              <span className="text-[11px] text-campus-muted">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>
            <div className="text-[10px] text-campus-subtle">
              {post.campus}
            </div>
          </div>
        </div>

        <Badge variant="outline" size="sm">
          {post.circle}
        </Badge>
      </div>

      {/* Post Body */}
      <div className="text-xs sm:text-sm text-campus-charcoal leading-relaxed whitespace-pre-line py-1">
        {post.content}
      </div>

      {/* Tags if any */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] text-campus-muted hover:text-campus-accent cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Interaction Footer */}
      <div className="mt-4 pt-3 border-t border-campus-border/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Upvote Pill */}
          <button
            onClick={handleUpvote}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
              hasUpvoted
                ? "bg-campus-accent-soft text-campus-accent font-semibold"
                : "text-campus-muted hover:text-campus-charcoal hover:bg-campus-muted-bg"
            )}
            aria-label="Upvote post"
          >
            <ArrowBigUp
              className={cn("w-4 h-4", hasUpvoted && "fill-current")}
            />
            <span>{upvotes}</span>
          </button>

          {/* Reply Button */}
          <button
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-campus-muted hover:text-campus-charcoal hover:bg-campus-muted-bg transition-colors"
            aria-label="Replies"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{post.repliesCount}</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="p-1.5 text-campus-subtle hover:text-campus-charcoal hover:bg-campus-muted-bg rounded-md transition-colors"
            aria-label="Share"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 text-campus-subtle hover:text-campus-charcoal hover:bg-campus-muted-bg rounded-md transition-colors"
            aria-label="Options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}
