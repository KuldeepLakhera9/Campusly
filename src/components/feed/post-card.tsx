"use client";

import * as React from "react";
import { IPost, IComment } from "@/types/post";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils/formatters";
import { useAuth } from "@/components/providers/auth-provider";
import { ReportModal } from "@/components/feed/report-modal";
import { Modal } from "@/components/ui/modal";
import {
  Heart,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Trash2,
  Flag,
  Send,
  CornerDownRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface PostCardProps {
  post: IPost;
  onPostDeleted?: (postId: string) => void;
}

export function PostCard({ post, onPostDeleted }: PostCardProps) {
  const { user } = useAuth();

  // Reaction state with optimistic updates
  const [reactionCount, setReactionCount] = React.useState(
    post.reactionCount ?? post.upvotesCount ?? 0
  );
  const [hasReacted, setHasReacted] = React.useState(
    post.hasReacted ?? post.userUpvoted ?? false
  );
  const [isReacting, setIsReacting] = React.useState(false);

  // Comment section state
  const [isCommentsOpen, setIsCommentsOpen] = React.useState(false);
  const [comments, setComments] = React.useState<IComment[]>([]);
  const [commentCount, setCommentCount] = React.useState(
    post.commentCount ?? post.repliesCount ?? 0
  );
  const [isLoadingComments, setIsLoadingComments] = React.useState(false);
  const [newCommentText, setNewCommentText] = React.useState("");
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);

  // Menu & Modals state
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);

  // Report Modal state
  const [reportTarget, setReportTarget] = React.useState<{
    id: string;
    type: "post" | "comment";
    author: string;
  } | null>(null);

  // Check if current user is the post author
  const isPostAuthor =
    post.isAuthor ||
    (user && user.publicIdentity?.username === post.author?.username);

  // Toggle Reaction with optimistic UI + rollback
  const handleToggleReaction = async () => {
    if (isReacting) return;
    setIsReacting(true);

    const prevCount = reactionCount;
    const prevReacted = hasReacted;

    // Optimistic update
    setHasReacted(!prevReacted);
    setReactionCount(prevReacted ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await fetch(`/api/posts/${post._id}/reactions`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update reaction");
      }

      setHasReacted(data.reacted);
      setReactionCount(data.reactionCount);
    } catch {
      // Rollback on failure
      setHasReacted(prevReacted);
      setReactionCount(prevCount);
    } finally {
      setIsReacting(false);
    }
  };

  // Toggle comments and fetch on first expand
  const handleToggleComments = async () => {
    const nextState = !isCommentsOpen;
    setIsCommentsOpen(nextState);

    if (nextState && comments.length === 0) {
      setIsLoadingComments(true);
      try {
        const res = await fetch(`/api/posts/${post._id}/comments`);
        const data = await res.json();
        if (res.ok && data.comments) {
          setComments(data.comments);
          setCommentCount(data.comments.length);
        }
      } catch (err) {
        console.error("Failed to load comments:", err);
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  // Submit comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${post._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newCommentText.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to post comment");
      }

      setComments((prev) => [...prev, data.comment]);
      setCommentCount((prev) => prev + 1);
      setNewCommentText("");
    } catch (err) {
      console.error("Error creating comment:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(
        `/api/posts/${post._id}/comments/${commentId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        setCommentCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  // Delete post
  const handleConfirmDeletePost = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        if (onPostDeleted) {
          onPostDeleted(post._id);
        }
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy share link
  const handleShare = () => {
    const url = `${window.location.origin}/explore#post-${post._id}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const authorName = post.author?.username || post.authorPseudonym || "Anonymous Student";
  const avatarId = post.author?.avatarId || "terracotta-prism";
  const avatarColor = post.author?.avatarColor || post.authorAvatarColor || "#C15438";

  return (
    <>
      <Card
        id={`post-${post._id}`}
        className="p-5 hover:border-campus-border-strong transition-all bg-white"
      >
        {/* Author Bar */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <Avatar
              moniker={authorName}
              avatarId={avatarId}
              color={avatarColor}
              size="sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-campus-charcoal">
                  {authorName}
                </span>
                <span className="text-[11px] text-campus-subtle">•</span>
                <span className="text-[11px] text-campus-muted">
                  {formatRelativeTime(post.createdAt)}
                </span>
              </div>
              <div className="text-[10px] text-campus-subtle">
                {post.collegeName || post.campus || "Accredited Campus"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" size="sm">
              {post.category || post.circle || "Discussion"}
            </Badge>

            {/* Post Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 text-campus-subtle hover:text-campus-charcoal hover:bg-stone-100 rounded-md transition-colors"
                aria-label="Post actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-44 bg-white border border-campus-border rounded-lg shadow-lg py-1 z-30 text-xs">
                    {isPostAuthor ? (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsDeleteModalOpen(true);
                        }}
                        className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Thought</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setReportTarget({
                            id: post._id,
                            type: "post",
                            author: authorName,
                          });
                        }}
                        className="w-full px-3 py-2 text-left text-campus-charcoal hover:bg-stone-50 flex items-center gap-2 transition-colors"
                      >
                        <Flag className="w-3.5 h-3.5 text-campus-accent" />
                        <span>Report Content</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleShare();
                      }}
                      className="w-full px-3 py-2 text-left text-campus-charcoal hover:bg-stone-50 flex items-center gap-2 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Post Body */}
        <div className="text-xs sm:text-sm text-campus-charcoal leading-relaxed whitespace-pre-line py-1">
          {post.content}
        </div>

        {/* Interaction Footer */}
        <div className="mt-4 pt-3 border-t border-campus-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Reaction Button (Heart) */}
            <button
              onClick={handleToggleReaction}
              disabled={isReacting}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all active:scale-95",
                hasReacted
                  ? "bg-rose-50 text-rose-600 font-semibold"
                  : "text-campus-muted hover:text-campus-charcoal hover:bg-stone-100"
              )}
              aria-label={hasReacted ? "Unlike post" : "Like post"}
            >
              <Heart
                className={cn(
                  "w-3.5 h-3.5 transition-transform",
                  hasReacted && "fill-current text-rose-500 scale-110"
                )}
              />
              <span>{reactionCount}</span>
            </button>

            {/* Comments Toggle Button */}
            <button
              onClick={handleToggleComments}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                isCommentsOpen
                  ? "bg-stone-100 text-campus-charcoal"
                  : "text-campus-muted hover:text-campus-charcoal hover:bg-stone-100"
              )}
              aria-label="Toggle comments"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{commentCount}</span>
            </button>
          </div>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="p-1.5 text-campus-subtle hover:text-campus-charcoal hover:bg-stone-100 rounded-md transition-colors flex items-center gap-1 text-xs"
            aria-label="Share post"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] text-emerald-600 font-medium">Copied</span>
              </>
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Single-Level Comments Section */}
        {isCommentsOpen && (
          <div className="mt-4 pt-4 border-t border-dashed border-campus-border/70 space-y-4">
            {/* Comments List */}
            {isLoadingComments ? (
              <div className="text-center py-4 text-xs text-campus-muted">
                Loading campus comments...
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => {
                  const commentAuthor =
                    comment.author?.username || "Anonymous Student";
                  const commentAvatarId =
                    comment.author?.avatarId || "terracotta-prism";
                  const commentAvatarColor =
                    comment.author?.avatarColor || "#C15438";
                  const isCommentAuthor =
                    comment.isAuthor ||
                    (user && user.publicIdentity?.username === commentAuthor);

                  return (
                    <div
                      key={comment._id}
                      className="flex items-start justify-between gap-2.5 p-3 rounded-lg bg-campus-bg/60 border border-campus-border/50 text-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <Avatar
                          moniker={commentAuthor}
                          avatarId={commentAvatarId}
                          color={commentAvatarColor}
                          size="xs"
                        />
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-campus-charcoal">
                              {commentAuthor}
                            </span>
                            <span className="text-[10px] text-campus-muted">
                              • {formatRelativeTime(comment.createdAt)}
                            </span>
                          </div>
                          <div className="text-campus-charcoal whitespace-pre-line leading-relaxed">
                            {comment.content}
                          </div>
                        </div>
                      </div>

                      {/* Comment Actions */}
                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        {isCommentAuthor ? (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="p-1 text-campus-subtle hover:text-red-600 rounded transition-colors"
                            title="Delete comment"
                            aria-label="Delete comment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setReportTarget({
                                id: comment._id,
                                type: "comment",
                                author: commentAuthor,
                              })
                            }
                            className="p-1 text-campus-subtle hover:text-campus-accent rounded transition-colors"
                            title="Report comment"
                            aria-label="Report comment"
                          >
                            <Flag className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-campus-muted">
                No comments yet. Start the conversation below.
              </div>
            )}

            {/* Inline Comment Composer */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <CornerDownRight className="w-4 h-4 text-campus-muted shrink-0 ml-1" />
              <input
                type="text"
                placeholder={
                  user
                    ? `Comment as ${user.publicIdentity.username}...`
                    : "Add a comment..."
                }
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                maxLength={1000}
                className="flex-1 text-xs bg-stone-50 border border-campus-border rounded-md px-3 py-2 outline-none text-campus-charcoal placeholder:text-campus-subtle focus:border-campus-charcoal focus:bg-white transition-all"
              />
              <Button
                type="submit"
                size="sm"
                variant="primary"
                disabled={!newCommentText.trim() || isSubmittingComment}
                isLoading={isSubmittingComment}
                className="shrink-0 text-xs px-3"
              >
                <Send className="w-3 h-3" />
                <span className="hidden sm:inline">Reply</span>
              </Button>
            </form>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Thought"
        subtitle="This action cannot be undone. All comments and reactions will also be removed."
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-campus-muted">
            Are you sure you want to permanently remove this thought from the campus feed?
          </p>
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-campus-border/70">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmDeletePost}
              isLoading={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={Boolean(reportTarget)}
          onClose={() => setReportTarget(null)}
          targetId={reportTarget.id}
          targetType={reportTarget.type}
          targetAuthor={reportTarget.author}
        />
      )}
    </>
  );
}
