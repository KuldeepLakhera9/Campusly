"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { CampusCircle } from "@/types/post";
import { Sparkles } from "lucide-react";

export interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (content: string, circle: CampusCircle) => void;
}

const CIRCLES: CampusCircle[] = [
  "Academics",
  "Dorm Life",
  "Late Night",
  "Course Advice",
  "Lost & Found",
  "Campus Confessions",
  "Opportunities",
];

export function CreatePostModal({
  isOpen,
  onClose,
  onPostCreated,
}: CreatePostModalProps) {
  const [content, setContent] = React.useState("");
  const [selectedCircle, setSelectedCircle] =
    React.useState<CampusCircle>("Academics");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (onPostCreated) {
        onPostCreated(content, selectedCircle);
      }
      setContent("");
      onClose();
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share with Campus"
      subtitle="Your post appears under your pseudonymous moniker. No social score or pressure."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Circle Selector */}
        <div>
          <label className="block text-xs font-semibold tracking-wide uppercase text-campus-muted mb-2">
            Select Campus Circle
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CIRCLES.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setSelectedCircle(c)}
                className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
                  selectedCircle === c
                    ? "bg-campus-charcoal text-white border-campus-charcoal"
                    : "bg-white text-campus-body border-campus-border hover:bg-campus-muted-bg"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <Textarea
          placeholder="What's happening on campus? Questions, advice, thoughts, or quiet observations..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          required
        />

        {/* Privacy Note */}
        <div className="p-3 bg-campus-muted-bg rounded-lg border border-campus-border flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-campus-accent shrink-0 mt-0.5" />
          <p className="text-xs text-campus-muted">
            Posting as <strong className="text-campus-charcoal">Library Fox</strong>. Your real email and identity are never exposed.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-campus-border/70">
          <Button type="button" variant="ghost" onClick={onClose}>
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
