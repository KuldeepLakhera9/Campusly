"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ShieldCheck, Flame, Loader2 } from "lucide-react";

export interface PublicProfileData {
  id: string;
  username: string;
  avatarId: string;
  avatarColor: string;
  bio?: string;
  interests?: string[];
  sparksCount?: number;
  collegeName?: string;
  isCurrentUser?: boolean;
  stats?: {
    posts: number;
    hangouts: number;
  };
}

interface PublicProfileModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PublicProfileModal({
  userId,
  isOpen,
  onClose,
}: PublicProfileModalProps) {
  const router = useRouter();
  const [profile, setProfile] = React.useState<PublicProfileData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isStartingChat, setIsStartingChat] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen || !userId) return;

    let isMounted = true;
    async function fetchProfile() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/users/${userId}/public-profile`);
        if (!res.ok) {
          throw new Error("Failed to load student profile.");
        }
        const data = await res.json();
        if (isMounted) {
          setProfile(data.profile);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error loading profile");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [isOpen, userId]);

  const handleStartMessage = async () => {
    if (!profile) return;
    setIsStartingChat(true);
    setError(null);

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: profile.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to start conversation.");
      }

      onClose();
      router.push(`/messages?c=${data.conversation.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start chat.");
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Campusly Student" size="md">
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-campus-accent animate-spin mb-3" />
          <p className="text-xs text-campus-muted">Loading student moniker...</p>
        </div>
      ) : error ? (
        <div className="py-8 text-center">
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : profile ? (
        <div className="space-y-6 pt-2">
          {/* Header Card */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-campus-bg/50 border border-campus-border/60">
            <Avatar
              moniker={profile.username}
              avatarId={profile.avatarId}
              color={profile.avatarColor}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-campus-charcoal truncate">
                  {profile.username}
                </h3>
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  <Flame className="w-3 h-3 text-amber-600 fill-amber-600" />
                  <span className="font-medium">{profile.sparksCount || 0} sparks</span>
                </span>
              </div>
              <p className="text-xs text-campus-muted mt-0.5">{profile.collegeName}</p>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-campus-muted">
                About
              </span>
              <p className="text-xs sm:text-sm text-campus-charcoal leading-relaxed bg-white p-3 rounded-lg border border-campus-border/60">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Campus Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-campus-muted">
                Campus Interests
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((interest) => (
                  <Badge key={interest} variant="outline" size="sm">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Note */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 text-[11px] text-campus-muted">
            <ShieldCheck className="w-4 h-4 text-campus-accent shrink-0" />
            <span>
              Pseudonymous identity protected. Real email and student credentials are never shared.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-campus-border/60">
            <Button variant="outline" size="md" onClick={onClose}>
              Close
            </Button>
            {!profile.isCurrentUser && (
              <Button
                variant="primary"
                size="md"
                onClick={handleStartMessage}
                disabled={isStartingChat}
                className="flex items-center gap-2"
              >
                {isStartingChat ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Opening Chat...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>Message</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
