"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { HANGOUT_ACTIVITIES, CAMPUS_LOCATIONS, IHangout } from "@/types/hangout";
import { useAuth } from "@/components/providers/auth-provider";
import { Users, Sparkles, AlertCircle, Share2 } from "lucide-react";

export interface CreateHangoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (hangout: IHangout) => void;
}

export function CreateHangoutModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateHangoutModalProps) {
  const { user } = useAuth();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [activity, setActivity] = React.useState<string>("Chai");
  const [location, setLocation] = React.useState<string>("Main Canteen");
  const [customLocation, setCustomLocation] = React.useState("");
  const [date, setDate] = React.useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [startTime, setStartTime] = React.useState("5:30 PM");
  const [maxParticipants, setMaxParticipants] = React.useState(5);
  const [shareToFeed, setShareToFeed] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      Promise.resolve().then(() => {
        setTitle("");
        setDescription("");
        setActivity("Chai");
        setLocation("Main Canteen");
        setCustomLocation("");
        const today = new Date();
        setDate(today.toISOString().split("T")[0]);
        setStartTime("5:30 PM");
        setMaxParticipants(5);
        setShareToFeed(true);
        setError(null);
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a title for the hangout.");
      return;
    }

    const finalLocation =
      location === "Other" ? customLocation.trim() : location;
    if (!finalLocation) {
      setError("Please provide a campus spot.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/hangouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          activity,
          location: finalLocation,
          date,
          startTime,
          maxParticipants,
          shareToFeed,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create hangout.");
      }

      if (onSuccess && data.hangout) {
        onSuccess(data.hangout);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to host hangout.";
      setError(msg);
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
      title="Host a Spontaneous Hangout"
      subtitle="Gather classmates for an activity happening today. Low pressure, zero awkwardness."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Activity Pills */}
        <div>
          <label className="block text-xs font-semibold tracking-wide uppercase text-campus-muted mb-2">
            Activity
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {HANGOUT_ACTIVITIES.map((act) => {
              const isSelected = activity === act;
              return (
                <button
                  type="button"
                  key={act}
                  onClick={() => setActivity(act)}
                  className={`text-xs px-3 py-1 rounded-md border font-medium transition-colors ${
                    isSelected
                      ? "bg-campus-charcoal text-white border-campus-charcoal shadow-2xs"
                      : "bg-white text-campus-body border-campus-border hover:bg-stone-50"
                  }`}
                >
                  {act}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <Input
          label="What's happening?"
          placeholder="e.g. Chai after class, Cricket on college ground, Late night study sprint"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          required
        />

        {/* Description */}
        <Textarea
          label="Details (Optional)"
          placeholder="Casual meetup after lectures. Beginners welcome, no prior experience needed."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={500}
        />

        {/* Where: Campus Location Presets */}
        <div>
          <label className="block text-xs font-semibold tracking-wide uppercase text-campus-muted mb-1.5">
            Campus Location
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2">
            {CAMPUS_LOCATIONS.slice(0, 6).map((spot) => (
              <button
                type="button"
                key={spot}
                onClick={() => setLocation(spot)}
                className={`text-xs py-1.5 px-2.5 rounded-md border text-left font-medium truncate transition-colors ${
                  location === spot
                    ? "bg-stone-200 border-campus-charcoal text-campus-charcoal font-semibold"
                    : "bg-white border-campus-border text-campus-body hover:bg-stone-50"
                }`}
              >
                {spot}
              </button>
            ))}
          </div>

          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full text-xs p-2 bg-white border border-campus-border rounded-lg text-campus-charcoal outline-none"
          >
            {CAMPUS_LOCATIONS.map((spot) => (
              <option key={spot} value={spot}>
                {spot}
              </option>
            ))}
          </select>

          {location === "Other" && (
            <div className="mt-2">
              <Input
                placeholder="Type specific spot (e.g. EE building lobby, bench by fountain)"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                required
              />
            </div>
          )}
        </div>

        {/* When: Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold tracking-wide uppercase text-campus-muted mb-1.5">
              When (Date)
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-campus-border rounded-lg text-campus-charcoal outline-none font-sans"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wide uppercase text-campus-muted mb-1.5">
              Time
            </label>
            <input
              type="text"
              placeholder="e.g. 5:30 PM, 6:00 PM, Tonight"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-campus-border rounded-lg text-campus-charcoal outline-none"
              required
            />
          </div>
        </div>

        {/* Capacity & Feed Share */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold tracking-wide uppercase text-campus-muted mb-1.5">
              Capacity Limit
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-campus-border rounded-lg text-xs">
              <Users className="w-4 h-4 text-campus-muted shrink-0" />
              <select
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="bg-transparent w-full text-campus-charcoal outline-none text-xs font-medium"
              >
                {[2, 3, 4, 5, 6, 8, 10, 15, 20].map((num) => (
                  <option key={num} value={num}>
                    Maximum {num} students
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-lg border border-campus-border bg-stone-50/60 mt-1 sm:mt-0">
            <input
              type="checkbox"
              id="shareToFeed"
              checked={shareToFeed}
              onChange={(e) => setShareToFeed(e.target.checked)}
              className="w-4 h-4 rounded text-campus-accent focus:ring-campus-accent"
            />
            <label htmlFor="shareToFeed" className="text-xs text-campus-charcoal select-none cursor-pointer flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-campus-accent" />
              <span>Share to Campus Feed</span>
            </label>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="p-3 bg-campus-bg/80 rounded-lg border border-campus-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar moniker={username} avatarId={avatarId} color={avatarColor} size="sm" />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-campus-charcoal truncate">
                Hosting as {username}
              </div>
              <div className="text-[11px] text-campus-muted truncate">
                Real name & email remain 100% private
              </div>
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-campus-accent shrink-0" />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-campus-border/70">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Create Hangout
          </Button>
        </div>
      </form>
    </Modal>
  );
}
