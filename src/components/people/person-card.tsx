"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { IPersonMatch } from "@/types/people";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Loader2,
  Compass,
} from "lucide-react";

interface PersonCardProps {
  match: IPersonMatch;
  onViewProfile: (userId: string) => void;
}

export function PersonCard({ match, onViewProfile }: PersonCardProps) {
  const router = useRouter();
  const { user, score, sharedInterests, sharedCount, matchReasons } = match;
  const [isMessaging, setIsMessaging] = React.useState(false);
  const [msgError, setMsgError] = React.useState<string | null>(null);

  const handleStartMessage = async () => {
    setIsMessaging(true);
    setMsgError(null);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: user.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to start conversation.");
      }

      router.push(`/messages?c=${data.conversation.id}`);
    } catch (err: unknown) {
      setMsgError(err instanceof Error ? err.message : "Failed to message.");
      setIsMessaging(false);
    }
  };

  const sharedSet = new Set(sharedInterests.map((s) => s.toLowerCase()));

  return (
    <Card className="flex flex-col justify-between p-5 bg-white border border-campus-border/80 hover:border-campus-accent/40 transition-all duration-200 shadow-2xs hover:shadow-xs group">
      <div>
        {/* Top Header: Avatar + Moniker + Match Score Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              moniker={user.username}
              avatarId={user.avatarId}
              color={user.avatarColor}
              size="lg"
              className="shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="min-w-0">
              <h3 className="font-serif text-base font-bold text-campus-charcoal truncate tracking-tight">
                {user.username}
              </h3>
              <p className="text-[11px] text-campus-muted truncate">
                {user.collegeName}
              </p>
            </div>
          </div>

          {/* Compatibility Score Pill */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-campus-bg border border-campus-border text-xs font-semibold text-campus-charcoal shrink-0"
            title={`${score}% similarity based on shared campus interests and intents`}
          >
            <Sparkles className="w-3.5 h-3.5 text-campus-accent shrink-0" />
            <span>{score}% shared</span>
          </div>
        </div>

        {/* Bio if available */}
        {user.bio && (
          <p className="mt-3 text-xs text-campus-body line-clamp-2 leading-relaxed italic bg-campus-bg/40 p-2.5 rounded-md border border-campus-border/50">
            &ldquo;{user.bio}&rdquo;
          </p>
        )}

        {/* Match Reasons Explanation Box */}
        {matchReasons && matchReasons.length > 0 && (
          <div className="mt-3.5 space-y-1 bg-stone-50/80 p-2.5 rounded-lg border border-stone-200/80">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-campus-muted block">
              Why you&apos;re seeing them
            </span>
            <div className="space-y-0.5">
              {matchReasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 text-xs text-campus-charcoal"
                >
                  <CheckCircle2 className="w-3 h-3 text-campus-accent shrink-0" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interests Section */}
        {user.interests && user.interests.length > 0 && (
          <div className="mt-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-campus-muted uppercase tracking-wider text-[10px]">
                Interests
              </span>
              {sharedCount > 0 && (
                <span className="text-campus-accent font-medium">
                  {sharedCount} in common
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {user.interests.map((interest) => {
                const isShared = sharedSet.has(interest.toLowerCase());
                return (
                  <Badge
                    key={interest}
                    variant={isShared ? "accent" : "outline"}
                    size="sm"
                    className={
                      isShared
                        ? "bg-campus-accent-soft text-campus-accent border-campus-accent/30 font-semibold"
                        : "text-campus-muted bg-white"
                    }
                  >
                    {isShared && "✓ "}
                    {interest}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Looking For / Activity Preferences */}
        {user.lookingFor && user.lookingFor.length > 0 && (
          <div className="mt-3 space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-campus-muted block">
              Looking for
            </span>
            <div className="flex flex-wrap gap-1">
              {user.lookingFor.map((intent) => (
                <span
                  key={intent}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium"
                >
                  <Compass className="w-2.5 h-2.5 text-campus-muted" />
                  {intent}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-3 border-t border-campus-border/60">
        {msgError && (
          <p className="text-xs text-red-600 mb-2 truncate">{msgError}</p>
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => onViewProfile(user.id)}
          >
            View Profile
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="flex-1 text-xs flex items-center justify-center gap-1.5"
            onClick={handleStartMessage}
            disabled={isMessaging}
          >
            {isMessaging ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
