"use client";

import * as React from "react";
import { IHangout } from "@/types/hangout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { MapPin, Clock, Check } from "lucide-react";

export interface HangoutCardProps {
  hangout: IHangout;
  onJoin?: (id: string) => void;
}

export function HangoutCard({ hangout, onJoin }: HangoutCardProps) {
  const [hasJoined, setHasJoined] = React.useState(false);
  const [participantsCount, setParticipantsCount] = React.useState(
    hangout.participants?.length || 1
  );

  const spotsLeft = Math.max(0, hangout.maxParticipants - participantsCount);
  const isFull = spotsLeft === 0;

  const handleToggleJoin = () => {
    if (hasJoined) {
      setHasJoined(false);
      setParticipantsCount((prev) => Math.max(1, prev - 1));
    } else {
      setHasJoined(true);
      setParticipantsCount((prev) => prev + 1);
      if (hangout._id && onJoin) {
        onJoin(hangout._id);
      }
    }
  };

  return (
    <Card className="p-5 flex flex-col justify-between hover:border-campus-border-strong transition-all group">
      <div>
        {/* Top meta: Category & Time remaining */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant="subtle" size="sm">
            {hangout.category}
          </Badge>
          <span className="flex items-center gap-1 text-[11px] font-medium text-campus-muted">
            <Clock className="w-3 h-3 text-campus-accent" />
            <span>Happening today</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="font-serif text-lg font-medium text-campus-charcoal leading-snug group-hover:text-campus-accent transition-colors">
          {hangout.title}
        </h3>

        {/* Description */}
        <p className="mt-2 text-xs sm:text-sm text-campus-body leading-relaxed line-clamp-2">
          {hangout.description}
        </p>

        {/* Location Spot */}
        <div className="mt-3.5 flex items-center gap-1.5 text-xs text-stone-700 bg-campus-muted-bg/70 px-2.5 py-1.5 rounded-md border border-campus-border/60">
          <MapPin className="w-3.5 h-3.5 text-campus-accent shrink-0" />
          <span className="truncate font-medium">{hangout.locationSpot}</span>
        </div>
      </div>

      {/* Bottom section: Host moniker, Spots left, Join Button */}
      <div className="mt-5 pt-3.5 border-t border-campus-border/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Avatar
            moniker={hangout.hostPseudonym}
            color={hangout.hostAvatarColor}
            size="sm"
          />
          <div className="text-left">
            <span className="block text-[11px] font-semibold text-campus-charcoal leading-tight truncate max-w-[100px] sm:max-w-[130px]">
              {hangout.hostPseudonym}
            </span>
            <span className="block text-[10px] text-campus-muted">
              {spotsLeft === 0 ? "Full" : `${spotsLeft} spot${spotsLeft > 1 ? "s" : ""} left`}
            </span>
          </div>
        </div>

        <Button
          size="sm"
          variant={hasJoined ? "subtle" : isFull ? "ghost" : "outline"}
          disabled={isFull && !hasJoined}
          onClick={handleToggleJoin}
          className="text-xs"
        >
          {hasJoined ? (
            <>
              <Check className="w-3 h-3 text-campus-accent" />
              <span>Attending</span>
            </>
          ) : isFull ? (
            "Full"
          ) : (
            "Join"
          )}
        </Button>
      </div>
    </Card>
  );
}
