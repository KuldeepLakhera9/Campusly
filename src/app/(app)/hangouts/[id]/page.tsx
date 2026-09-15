"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { IHangout } from "@/types/hangout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { PublicProfileModal } from "@/components/profile/public-profile-modal";
import { useAuth } from "@/components/providers/auth-provider";
import { formatRelativeTime } from "@/lib/utils/formatters";
import {
  MapPin,
  Clock,
  Users,
  Check,
  ArrowLeft,
  Share2,
  AlertCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export default function HangoutDetailsPage() {
  const params = useParams();
  const { user } = useAuth();
  const id = params?.id as string;

  const [hangout, setHangout] = React.useState<IHangout | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isActionLoading, setIsActionLoading] = React.useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [profileModalUserId, setProfileModalUserId] = React.useState<string | null>(null);

  // Fetch hangout details
  const fetchHangout = React.useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/hangouts/${id}`);
      const data = await res.json();
      if (res.ok && data.hangout) {
        setHangout(data.hangout);
      } else {
        setErrorMessage(data.error || "Hangout not found.");
      }
    } catch (err) {
      console.error("Failed to load hangout:", err);
      setErrorMessage("Failed to load hangout details.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) fetchHangout();
    });
    return () => {
      isMounted = false;
    };
  }, [fetchHangout]);

  // Handle Join or Leave
  const handleToggleJoin = async () => {
    if (!hangout || isActionLoading || hangout.status === "cancelled") return;

    setIsActionLoading(true);
    const hasJoined = Boolean(hangout.hasJoined);

    try {
      const res = await fetch(`/api/hangouts/${hangout._id}/join`, {
        method: hasJoined ? "DELETE" : "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update participation.");
      }

      // Refresh hangout details
      await fetchHangout();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Action failed.";
      alert(msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Host Cancel
  const handleCancelHangout = async () => {
    if (!hangout || isCancelling) return;
    setIsCancelling(true);

    try {
      const res = await fetch(`/api/hangouts/${hangout._id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel hangout.");
      }

      setIsCancelModalOpen(false);
      await fetchHangout();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel.";
      alert(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  // Copy share link
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 animate-pulse">
        <div className="w-24 h-6 bg-stone-200 rounded" />
        <div className="w-2/3 h-8 bg-stone-200 rounded" />
        <div className="w-full h-48 bg-stone-100 rounded-xl" />
      </div>
    );
  }

  if (errorMessage || !hangout) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-xl font-medium text-campus-charcoal">
          {errorMessage || "Hangout Not Found"}
        </h2>
        <p className="text-xs text-campus-muted">
          This hangout may have expired or been removed by the host.
        </p>
        <Link href="/hangouts">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Back to Hangouts</span>
          </Button>
        </Link>
      </div>
    );
  }

  const maxParticipants = hangout.maxParticipants || 4;
  const participantsCount = hangout.participantsCount || hangout.participants?.length || 1;
  const spotsLeft = Math.max(0, maxParticipants - participantsCount);
  const isFull = hangout.status === "full" || spotsLeft === 0;
  const isCancelled = hangout.status === "cancelled";
  const isCreator =
    hangout.isCreator ||
    (user && user.publicIdentity?.username === hangout.creator?.username);
  const hasJoined = Boolean(hangout.hasJoined);

  const creatorName = hangout.creator?.username || hangout.hostPseudonym || "Campus Student";
  const creatorAvatarId = hangout.creator?.avatarId || "terracotta-prism";
  const creatorAvatarColor = hangout.creator?.avatarColor || "#C15438";

  // Capacity percentage for progress bar
  const capacityPercent = Math.min(100, Math.round((participantsCount / maxParticipants) * 100));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-8">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/hangouts"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-campus-muted hover:text-campus-charcoal transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Hangouts</span>
        </Link>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-xs text-campus-muted hover:text-campus-charcoal px-3 py-1.5 rounded-md border border-campus-border bg-white transition-colors"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600 font-medium">Link Copied</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Hangout</span>
            </>
          )}
        </button>
      </div>

      {/* Main Meetup Hero Card */}
      <Card className="p-6 sm:p-8 bg-white space-y-6">
        {/* Status and Activity Badges */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-campus-accent bg-campus-accent-soft px-3 py-1.5 rounded-md border border-campus-accent-border/50">
            {hangout.activity || "Meetup"}
          </span>

          {isCancelled ? (
            <Badge variant="outline" size="md" className="text-stone-500 border-stone-300 bg-stone-50">
              Cancelled by Host
            </Badge>
          ) : isFull ? (
            <Badge variant="outline" size="md" className="text-amber-700 border-amber-300 bg-amber-50">
              At Full Capacity
            </Badge>
          ) : (
            <Badge variant="subtle" size="md" className="text-emerald-700 border-emerald-300 bg-emerald-50">
              {spotsLeft} spot{spotsLeft > 1 ? "s" : ""} remaining
            </Badge>
          )}
        </div>

        {/* Title & Detailed Description */}
        <div className="space-y-3">
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-campus-charcoal leading-snug">
            {hangout.title}
          </h1>

          {hangout.description && (
            <p className="text-xs sm:text-sm text-campus-body leading-relaxed whitespace-pre-line">
              {hangout.description}
            </p>
          )}
        </div>

        {/* Key Logistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-campus-border/70">
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-stone-50 border border-campus-border/60">
            <Clock className="w-4 h-4 text-campus-accent mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <div className="text-[11px] font-semibold text-campus-muted uppercase tracking-wider">
                Time & Date
              </div>
              <div className="text-xs font-semibold text-campus-charcoal">
                {hangout.startTime}
              </div>
              <div className="text-[11px] text-campus-muted">
                {hangout.scheduledAt
                  ? new Date(hangout.scheduledAt).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  : "Today"}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-stone-50 border border-campus-border/60">
            <MapPin className="w-4 h-4 text-campus-accent mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <div className="text-[11px] font-semibold text-campus-muted uppercase tracking-wider">
                Campus Location
              </div>
              <div className="text-xs font-semibold text-campus-charcoal">
                {hangout.location}
              </div>
              <div className="text-[11px] text-campus-muted">
                {hangout.collegeName}
              </div>
            </div>
          </div>
        </div>

        {/* Capacity Progress Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-campus-charcoal">
              Participation ({participantsCount} / {maxParticipants} students)
            </span>
            <span className="text-campus-muted">
              {isFull ? "Full" : `${spotsLeft} spots left`}
            </span>
          </div>
          <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden border border-campus-border/60">
            <div
              className={cn(
                "h-full transition-all duration-300",
                isFull
                  ? "bg-amber-600"
                  : capacityPercent > 60
                  ? "bg-campus-accent"
                  : "bg-emerald-600"
              )}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-campus-border/70">
          <div className="flex items-center gap-3">
            <Avatar
              moniker={creatorName}
              avatarId={creatorAvatarId}
              color={creatorAvatarColor}
              size="md"
            />
            <div>
              <div className="text-xs font-bold text-campus-charcoal">
                Hosted by {creatorName}
              </div>
              <div className="text-[11px] text-campus-muted">
                Verified student • Real identity protected
              </div>
            </div>
          </div>

          {isCancelled ? (
            <span className="text-xs text-stone-500 font-medium bg-stone-100 px-3 py-2 rounded-md">
              Cancelled
            </span>
          ) : isCreator ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCancelModalOpen(true)}
              className="text-red-600 hover:bg-red-50 hover:border-red-200 text-xs"
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              <span>Cancel Hangout</span>
            </Button>
          ) : hasJoined ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleJoin}
              isLoading={isActionLoading}
              className="text-red-600 hover:bg-red-50 hover:border-red-200 text-xs"
            >
              <span>Leave Hangout</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleToggleJoin}
              disabled={isFull || isActionLoading}
              isLoading={isActionLoading}
              className="text-xs px-5 shadow-xs"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              <span>Join Hangout</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Participants List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-campus-border/70">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-campus-accent" />
            <h2 className="font-serif text-lg font-medium text-campus-charcoal">
              Students Joining ({participantsCount})
            </h2>
          </div>
          <span className="text-xs text-campus-muted">
            All pseudonymous identities
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {hangout.participants?.map((participant, index) => {
            const isParticipantHost =
              participant.pseudonym === hangout.creator?.username;

            return (
              <Card
                key={participant.userId || index}
                className="p-3.5 flex items-center justify-between gap-3 bg-white"
              >
                <button
                  type="button"
                  onClick={() => participant.userId && setProfileModalUserId(participant.userId)}
                  className="flex items-center gap-2.5 min-w-0 text-left group cursor-pointer focus:outline-none"
                  disabled={!participant.userId}
                >
                  <Avatar
                    moniker={participant.pseudonym}
                    avatarId={participant.avatarId}
                    color={participant.avatarColor}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-campus-charcoal group-hover:text-campus-accent transition-colors truncate">
                      {participant.pseudonym}
                    </div>
                    <div className="text-[10px] text-campus-muted">
                      Joined {formatRelativeTime(participant.joinedAt)}
                    </div>
                  </div>
                </button>

                {isParticipantHost && (
                  <Badge variant="subtle" size="sm">
                    Host
                  </Badge>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Safety & Etiquette Reminder */}
      <Card className="p-4 bg-stone-50 border-stone-200 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-campus-accent shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-campus-charcoal">
            Campus Meetup Guidelines
          </h4>
          <p className="text-[11px] text-campus-muted leading-relaxed">
            Spontaneous meetups take place in public campus areas. Keep communication friendly, respect peer pseudonyms, and adhere to your university honor code.
          </p>
        </div>
      </Card>

      {/* Host Cancel Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Hangout"
        subtitle="This will mark the hangout as cancelled for all joined participants."
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-campus-muted">
            Are you sure you want to cancel &ldquo;{hangout.title}&rdquo;? Joined classmates will see that the activity has been cancelled.
          </p>
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-campus-border/70">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCancelModalOpen(false)}
              disabled={isCancelling}
            >
              Keep Hangout
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCancelHangout}
              isLoading={isCancelling}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Public Profile Modal */}
      <PublicProfileModal
        userId={profileModalUserId}
        isOpen={Boolean(profileModalUserId)}
        onClose={() => setProfileModalUserId(null)}
      />
    </div>
  );
}
