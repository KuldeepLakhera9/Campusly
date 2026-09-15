"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { HangoutCategory } from "@/types/hangout";
import { Clock, Users, Sparkles } from "lucide-react";

export interface CreateHangoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES: HangoutCategory[] = [
  "Study",
  "Food & Drink",
  "Campus Walk",
  "Sports & Fitness",
  "Gaming",
  "Creative",
  "Late Night",
];

export function CreateHangoutModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateHangoutModalProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<HangoutCategory>("Study");
  const [locationSpot, setLocationSpot] = React.useState("");
  const [maxParticipants, setMaxParticipants] = React.useState(4);
  const [durationHours, setDurationHours] = React.useState(2);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locationSpot.trim()) {
      setError("Please provide a title and exact spot on campus.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Simulate creation for Phase 1
    setTimeout(() => {
      setIsSubmitting(false);
      setTitle("");
      setDescription("");
      setLocationSpot("");
      onClose();
      if (onSuccess) onSuccess();
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Host a Spontaneous Hangout"
      subtitle="Gather students nearby for a low-pressure activity happening now or today."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Category Pills */}
        <div>
          <label className="block text-xs font-semibold tracking-wide uppercase text-campus-muted mb-2">
            Activity Type
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-xs px-2.5 py-1.5 rounded-md border font-medium transition-colors ${
                  category === cat
                    ? "bg-campus-accent text-white border-campus-accent"
                    : "bg-white text-campus-body border-campus-border hover:bg-campus-muted-bg"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <Input
          label="Hangout Title"
          placeholder="e.g., 45-min Deep Focus Pomodoro sprint or Boba run"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Location Spot */}
        <div className="relative">
          <Input
            label="Specific Campus Spot"
            placeholder="e.g., Main Library 3rd Floor East Stacks, Table 12"
            value={locationSpot}
            onChange={(e) => setLocationSpot(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <Textarea
          label="What's the plan? (Optional)"
          placeholder="e.g., Working on CS61A problem set. Bring headphones. Free tea if you want."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        {/* Capacity & Auto-Expire Controls */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold tracking-wide uppercase text-campus-muted mb-1.5">
              Capacity Limit
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-campus-border rounded-lg text-sm">
              <Users className="w-4 h-4 text-campus-muted" />
              <select
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="bg-transparent w-full text-campus-charcoal outline-none text-sm font-medium"
              >
                {[2, 3, 4, 5, 6, 8, 10].map((num) => (
                  <option key={num} value={num}>
                    Up to {num} students
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wide uppercase text-campus-muted mb-1.5">
              Auto-Expires In
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-campus-border rounded-lg text-sm">
              <Clock className="w-4 h-4 text-campus-muted" />
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="bg-transparent w-full text-campus-charcoal outline-none text-sm font-medium"
              >
                <option value={1}>1 hour</option>
                <option value={2}>2 hours</option>
                <option value={3}>3 hours</option>
                <option value={5}>Tonight (5h)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Privacy reassurance callout */}
        <div className="p-3 bg-campus-muted-bg rounded-lg border border-campus-border flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-campus-accent shrink-0 mt-0.5" />
          <p className="text-xs text-campus-muted leading-normal">
            You will be hosting as <strong className="text-campus-charcoal">Library Fox</strong>. Your real identity is never displayed on the campus board.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-campus-border/70">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Publish to Campus Board
          </Button>
        </div>
      </form>
    </Modal>
  );
}
