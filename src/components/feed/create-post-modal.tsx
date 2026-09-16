"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { PostCategory, POST_CATEGORIES, IPost } from "@/types/post";
import { useAuth } from "@/components/providers/auth-provider";
import { Sparkles, AlertCircle, Clock } from "lucide-react";

export interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: IPost) => void;
}

export function CreatePostModal({
  isOpen,
  onClose,
  onPostCreated,
}: CreatePostModalProps) {
  const { user } = useAuth();
  const [content, setContent] = React.useState("");
  const [selectedCategory, setSelectedCategory] =
    React.useState<PostCategory>("Discussion");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      Promise.resolve().then(() => {
        setContent("");
        setSelectedCategory("Discussion");
        setErrorMessage(null);
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length < 3) {
      setErrorMessage("Please write at least 3 characters.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          category: selectedCategory,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to publish post.");
      }

      if (onPostCreated && data.post) {
        onPostCreated(data.post);
      }

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish post.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const username = user?.publicIdentity?.username || "Anonymous Student";
  const avatarId = user?.publicIdentity?.avatarId || "terracotta-prism";
  const avatarColor = user?.publicIdentity?.avatarColor || "#C15438";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start a conversation"
      subtitle="Share questions, thoughts, or observations. Your real identity is never exposed."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Category Selector */}
        <div>
          <label className="block text-xs font-semibold tracking-wide uppercase text-campus-muted mb-2">
            Select Category
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {POST_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
                    isSelected
                      ? "bg-campus-charcoal text-white border-campus-charcoal"
                      : "bg-white text-campus-body border-campus-border hover:bg-stone-50"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {selectedCategory === "Confession" && (
            <div className="mt-2.5 p-3 bg-amber-50/90 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 animate-in fade-in">
              <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">14-Day Auto-Deletion Policy</span>
                <span className="text-[11px] text-amber-800 leading-relaxed">
                  Campus Confessions are ephemeral. This post will automatically expire and be permanently removed after 14 days for student privacy.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Content Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold tracking-wide uppercase text-campus-muted">
              Your Thought
            </label>
            <span className="text-[11px] text-campus-muted">
              {content.length} / 2,000
            </span>
          </div>
          <Textarea
            placeholder="What's happening on campus? Course advice, honest questions, library tips, or spontaneous thoughts..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            maxLength={2000}
            required
          />
        </div>

        {/* Privacy Note */}
        <div className="p-3 bg-campus-bg/80 rounded-lg border border-campus-border/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar moniker={username} avatarId={avatarId} color={avatarColor} size="sm" />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-campus-charcoal truncate">
                Posting as {username}
              </div>
              <div className="text-[11px] text-campus-muted truncate">
                Real name & email remain 100% private
              </div>
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-campus-accent shrink-0" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-campus-border/70">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Publish Thought
          </Button>
        </div>
      </form>
    </Modal>
  );
}
