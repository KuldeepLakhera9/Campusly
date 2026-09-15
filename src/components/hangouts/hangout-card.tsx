"use client";

import * as React from "react";
import Link from "next/link";
import { IHangout } from "@/types/hangout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { MapPin, Clock, Check, Users, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface HangoutCardProps {
  hangout: IHangout;
  onStatusChange?: (updatedHangout: IHangout) => void;
}

export function HangoutCard({ hangout, onStatusChange }: HangoutCardProps) {
  const [hasJoined, setHasJoined] = React.useState(
    Boolean(hangout.hasJoined)
  );
  const [participantsCount, setParticipantsCount] = React.useState(
    hangout.participantsCount ?? hangout.participants?.length ?? 1
  );
  const [status, setStatus] = React.useState(hangout.status || "open");
  const [isUpdating, setIsUpdating] = React.useState(false);

  React.useEffect(() => {
    Promise.resolve().then(() => {
      setHasJoined(Boolean(hangout.hasJoined));
      setParticipantsCount(
        hangout.participantsCount ?? hangout.participants?.length ?? 1
      );
      setStatus(hangout.status || "open");
    });
  }, [hangout]);

  const maxParticipants = hangout.maxParticipants || 4;
  const spotsLeft = Math.max(0, maxParticipants - participantsCount);
  const isFull = status === "full" || spotsLeft === 0;
  const isCancelled = status === "cancelled";
  const isCreator = Boolean(hangout.isCreator);

  const handleToggleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUpdating || isCancelled) return;

    setIsUpdating(true);
    const prevJoined = hasJoined;
    const prevCount = participantsCount;
    const prevStatus = status;

    if (prevJoined) {
      // Leave
      setHasJoined(false);
      const newCount = Math.max(1, prevCount - 1);
      setParticipantsCount(newCount);
      if (status === "full") setStatus("open");

      try {
        const res = await fetch(`/api/hangouts/${hangout._id}/join`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setStatus(data.status || "open");
        setParticipantsCount(data.participantsCount ?? newCount);
        if (onStatusChange) {
          onStatusChange({
            ...hangout,
            hasJoined: false,
            participantsCount: data.participantsCount ?? newCount,
            status: data.status || "open",
          });
        }
      } catch {
        setHasJoined(prevJoined);
        setParticipantsCount(prevCount);
        setStatus(prevStatus);
      } finally {
        setIsUpdating(false);
      }
    } else {
      // Join
      if (isFull) {
        setIsUpdating(false);
        return;
      }

      setHasJoined(true);
      const newCount = prevCount + 1;
      setParticipantsCount(newCount);
      if (newCount >= maxParticipants) setStatus("full");

      try {
        const res = await fetch(`/api/hangouts/${hangout._id}/join`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setStatus(data.status || (newCount >= maxParticipants ? "full" : "open"));
        setParticipantsCount(data.participantsCount ?? newCount);
        if (onStatusChange) {
          onStatusChange({
            ...hangout,
            hasJoined: true,
            participantsCount: data.participantsCount ?? newCount,
            status: data.status || "open",
          });
        }
      } catch {
        setHasJoined(prevJoined);
        setParticipantsCount(prevCount);
        setStatus(prevStatus);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const hostName =
    hangout.creator?.username || hangout.hostPseudonym || "Campus Student";
  const hostAvatarId = hangout.creator?.avatarId || "terracotta-prism";
  const hostAvatarColor =
    hangout.creator?.avatarColor || hangout.hostAvatarColor || "#C15438";

  // Format scheduled time display
  const timeDisplay = hangout.startTime || "Soon";

  return (
    <Link href={`/hangouts/${hangout._id}`} className="block h-full">
      <Card className="p-5 flex flex-col justify-between hover:border-campus-border-strong transition-all group h-full bg-white relative">
        <div>
          {/* Top meta: Activity Pill & Status */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-campus-accent bg-campus-accent-soft px-2.5 py-1 rounded-md border border-campus-accent-border/50">
              {hangout.activity || hangout.category || "Social"}
            </span>

            {isCancelled ? (
              <Badge variant="outline" size="sm" className="text-stone-500 border-stone-300 bg-stone-50">
                Cancelled
              </Badge>
            ) : isFull ? (
              <Badge variant="outline" size="sm" className="text-amber-700 border-amber-300 bg-amber-50">
                Full
              </Badge>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-medium text-campus-muted">
                <Clock className="w-3.5 h-3.5 text-campus-accent" />
                <span>{timeDisplay}</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-serif text-lg font-medium text-campus-charcoal leading-snug group-hover:text-campus-accent transition-colors">
            {hangout.title}
          </h3>

          {/* Description */}
          {hangout.description && (
            <p className="mt-2 text-xs text-campus-body leading-relaxed line-clamp-2">
              {hangout.description}
            </p>
          )}

          {/* Campus Location Spot */}
          <div className="mt-3.5 flex items-center gap-1.5 text-xs text-stone-700 bg-stone-50 px-2.5 py-1.5 rounded-md border border-campus-border/70">
            <MapPin className="w-3.5 h-3.5 text-campus-accent shrink-0" />
            <span className="truncate font-medium">
              {hangout.location || hangout.locationSpot || "Campus Grounds"}
            </span>
          </div>
        </div>

        {/* Bottom section: Host avatar, Capacity ratio, Action Button */}
        <div className="mt-5 pt-3.5 border-t border-campus-border/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar
              moniker={hostName}
              avatarId={hostAvatarId}
              color={hostAvatarColor}
              size="sm"
            />
            <div className="text-left min-w-0">
              <span className="block text-[11px] font-semibold text-campus-charcoal leading-tight truncate">
                {hostName}
              </span>
              <span className="block text-[10px] text-campus-muted truncate">
                {isCancelled
                  ? "Meetup cancelled"
                  : isFull
                  ? "At capacity"
                  : `${spotsLeft} of ${maxParticipants} spots left`}
              </span>
            </div>
          </div>

          {/* Action Button */}
          {isCancelled ? (
            <span className="text-xs text-stone-400 font-medium px-2 py-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Cancelled
            </span>
          ) : isCreator ? (
            <span className="text-[11px] font-semibold text-campus-accent bg-campus-bg px-2.5 py-1 rounded-md border border-campus-border">
              Hosting
            </span>
          ) : (
            <Button
              size="sm"
              variant={hasJoined ? "subtle" : isFull ? "ghost" : "primary"}
              disabled={(isFull && !hasJoined) || isUpdating}
              isLoading={isUpdating}
              onClick={handleToggleJoin}
              className={cn(
                "text-xs shrink-0 transition-all",
                hasJoined && "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              )}
            >
              {hasJoined ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600 group-hover:hidden" />
                  <span className="group-hover:hidden">Joined</span>
                  <span className="hidden group-hover:inline">Leave</span>
                </>
              ) : isFull ? (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Full
                </span>
              ) : (
                "Join"
              )}
            </Button>
          )}
        </div>
      </Card>
    </Link>
  );
}
