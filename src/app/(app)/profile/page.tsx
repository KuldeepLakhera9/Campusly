"use client";

import * as React from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { AVATAR_PRESETS, AvatarPreset, getAvatarPreset } from "@/lib/utils/avatars";
import { CAMPUS_INTERESTS_LIST } from "@/lib/validations/auth";
import { MOCK_HANGOUTS, MOCK_POSTS } from "@/lib/data/mock-data";
import { HangoutCard } from "@/components/hangouts/hangout-card";
import { PostCard } from "@/components/feed/post-card";
import {
  ShieldCheck,
  Sparkles,
  Edit3,
  LogOut,
  Check,
  Flame,
  Calendar,
  AlertCircle,
} from "lucide-react";

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();

  const [activeTab, setActiveTab] = React.useState("activity");
  const [stats, setStats] = React.useState({ posts: 0, hangouts: 0, sparks: 10 });
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  // Edit Modal State
  const [editUsername, setEditUsername] = React.useState("");
  const [editAvatar, setEditAvatar] = React.useState<AvatarPreset>(AVATAR_PRESETS[0]);
  const [editBio, setEditBio] = React.useState("");
  const [editInterests, setEditInterests] = React.useState<string[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = React.useState<string | null>(null);

  // Load profile stats
  React.useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.profile?.stats) {
            setStats(data.profile.stats);
          }
        }
      } catch (err) {
        console.error("Failed to load profile stats:", err);
      }
    }
    loadStats();
  }, []);

  // Blocked Users state
  const [blockedUsers, setBlockedUsers] = React.useState<
    Array<{ id: string; username: string; avatarId: string; avatarColor: string; collegeName: string }>
  >([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = React.useState(false);

  React.useEffect(() => {
    if (activeTab !== "privacy") return;
    let isMounted = true;
    async function loadBlocked() {
      setIsLoadingBlocked(true);
      try {
        const res = await fetch("/api/users/blocked");
        if (res.ok && isMounted) {
          const data = await res.json();
          setBlockedUsers(data.blockedUsers || []);
        }
      } catch (err) {
        console.error("Failed to load blocked users:", err);
      } finally {
        if (isMounted) setIsLoadingBlocked(false);
      }
    }
    loadBlocked();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const handleUnblockUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/block`, { method: "DELETE" });
      if (res.ok) {
        setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (err) {
      console.error("Unblock failed:", err);
    }
  };

  // Initialize edit form when opening modal
  const openEditModal = () => {
    if (user) {
      setEditUsername(user.publicIdentity.username);
      setEditAvatar(getAvatarPreset(user.publicIdentity.avatarId));
      setEditBio(user.publicIdentity.bio || "");
      setEditInterests(user.publicIdentity.interests || []);
      setSaveError(null);
      setIsEditModalOpen(true);
    }
  };

  const toggleInterest = (interest: string) => {
    if (editInterests.includes(interest)) {
      setEditInterests((prev) => prev.filter((i) => i !== interest));
    } else {
      if (editInterests.length >= 8) return;
      setEditInterests((prev) => [...prev, interest]);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editInterests.length < 3) {
      setSaveError("Please select at least 3 campus interests.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editUsername.trim(),
          avatarId: editAvatar.id,
          avatarColor: editAvatar.color,
          bio: editBio.trim(),
          interests: editInterests,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setSaveError(data.error || "Failed to update profile.");
        setIsSaving(false);
        return;
      }

      updateUser(data.user);
      setIsSaving(false);
      setIsEditModalOpen(false);
      setSaveSuccessMessage("Identity updated successfully.");
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Profile update error:", err);
      setSaveError("An unexpected error occurred. Please try again.");
      setIsSaving(false);
    }
  };

  // Privacy toggles handler
  const handleTogglePrivacy = async (key: string, value: boolean) => {
    if (!user) return;
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privacySettings: { [key]: value },
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        updateUser(data.user);
        setSaveSuccessMessage("Privacy settings updated.");
        setTimeout(() => setSaveSuccessMessage(null), 2500);
      }
    } catch (err) {
      console.error("Failed to toggle privacy setting:", err);
    }
  };

  const username = user?.publicIdentity?.username || "Anonymous Student";
  const avatarId = user?.publicIdentity?.avatarId;
  const avatarColor = user?.publicIdentity?.avatarColor || "#C15438";
  const collegeName = user?.college?.name || "Campus Community";
  const bio = user?.publicIdentity?.bio || "Exploring campus without the social pressure.";
  const interests = user?.publicIdentity?.interests || [];
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Recently joined";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
      {saveSuccessMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Profile Persona Card */}
      <Card className="p-6 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <Avatar
              moniker={username}
              avatarId={avatarId}
              color={avatarColor}
              size="xl"
              className="shadow-2xs"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-serif text-2xl font-bold text-campus-charcoal">
                  {username}
                </h1>
                <Badge variant="accent" size="sm">
                  Verified Student
                </Badge>
              </div>

              <p className="text-xs text-campus-muted mt-0.5">
                {collegeName} • <span className="text-stone-400">Pseudonymous Identity</span>
              </p>

              <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-campus-muted">
                <span className="inline-flex items-center gap-1 font-semibold text-campus-accent bg-campus-accent-soft px-2.5 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3" />
                  <span>{stats.sparks ?? 10} Sparks</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-campus-subtle" />
                  <span>Joined {joinedDate}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <Button variant="outline" size="sm" onClick={openEditModal} className="text-xs">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Identity</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="text-xs text-red-700 hover:bg-red-50">
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Public Activity Statistics Grid */}
        <div className="grid grid-cols-3 gap-3 my-5 py-3 border-y border-campus-border/70 text-center">
          <div className="p-2 rounded-lg bg-campus-bg/50">
            <div className="font-serif text-xl font-bold text-campus-charcoal">
              {stats.posts}
            </div>
            <div className="text-[11px] font-medium text-campus-muted">Campus Posts</div>
          </div>
          <div className="p-2 rounded-lg bg-campus-bg/50">
            <div className="font-serif text-xl font-bold text-campus-charcoal">
              {stats.hangouts}
            </div>
            <div className="text-[11px] font-medium text-campus-muted">Hangouts Hosted</div>
          </div>
          <div className="p-2 rounded-lg bg-campus-bg/50">
            <div className="font-serif text-xl font-bold text-campus-charcoal">
              {stats.sparks ?? 10}
            </div>
            <div className="text-[11px] font-medium text-campus-muted">Campus Sparks</div>
          </div>
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-xs sm:text-sm text-campus-body leading-relaxed italic">
            &ldquo;{bio}&rdquo;
          </p>
        )}

        {/* Interests */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {interests.map((interest) => (
            <Badge key={interest} variant="default" size="sm">
              {interest}
            </Badge>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-campus-border/60 flex items-center justify-between text-xs text-campus-muted">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Anonymous to other students • Real email encrypted & private</span>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "activity", label: "My Campus Activity" },
          { id: "privacy", label: "Privacy & Identity Controls" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab 1: Activity */}
      {activeTab === "activity" && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-lg font-medium text-campus-charcoal flex items-center gap-2">
                <Flame className="w-4 h-4 text-campus-accent" />
                <span>Active Spontaneous Meetup</span>
              </h2>
            </div>
            <HangoutCard hangout={MOCK_HANGOUTS[0]} />
          </div>

          <div>
            <h2 className="font-serif text-lg font-medium text-campus-charcoal mb-3">
              Thoughts Shared Pseudonymously
            </h2>
            <PostCard post={MOCK_POSTS[0]} />
          </div>
        </div>
      )}

      {/* Tab 2: Privacy Controls */}
      {activeTab === "privacy" && (
        <div className="space-y-6">
          <Card className="p-6 bg-white space-y-6">
          <div>
            <h2 className="font-serif text-lg font-medium text-campus-charcoal">
              Privacy Architecture
            </h2>
            <p className="text-xs text-campus-muted mt-0.5">
              Campusly is built to protect your identity from internet surveillance and campus pressure.
            </p>
          </div>

          <div className="divide-y divide-campus-border/70">
            {/* Setting 1 */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <span className="block text-sm font-semibold text-campus-charcoal">
                  Hide Academic Year
                </span>
                <span className="block text-xs text-campus-muted mt-0.5">
                  When enabled, only your pseudonym and campus affiliation are visible to peers.
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleTogglePrivacy(
                    "hideMajor",
                    !user?.privacySettings?.hideMajor
                  )
                }
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                  user?.privacySettings?.hideMajor ? "bg-campus-accent" : "bg-stone-300"
                }`}
                aria-label="Toggle hide major"
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    user?.privacySettings?.hideMajor ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Setting 2 */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <span className="block text-sm font-semibold text-campus-charcoal">
                  Direct Messages
                </span>
                <span className="block text-xs text-campus-muted mt-0.5">
                  Allow other verified students to start private pseudonymous threads with you.
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleTogglePrivacy(
                    "allowDirectMessages",
                    !user?.privacySettings?.allowDirectMessages
                  )
                }
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                  user?.privacySettings?.allowDirectMessages
                    ? "bg-campus-accent"
                    : "bg-stone-300"
                }`}
                aria-label="Toggle direct messages"
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    user?.privacySettings?.allowDirectMessages
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Setting 3 */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <span className="block text-sm font-semibold text-campus-charcoal">
                  Auto-Expire Spontaneous Hangouts
                </span>
                <span className="block text-xs text-campus-muted mt-0.5">
                  Automatically clear your hangout history and location spots once the session ends.
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleTogglePrivacy(
                    "autoExpireHangouts",
                    !user?.privacySettings?.autoExpireHangouts
                  )
                }
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                  user?.privacySettings?.autoExpireHangouts
                    ? "bg-campus-accent"
                    : "bg-stone-300"
                }`}
                aria-label="Toggle auto expire hangouts"
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    user?.privacySettings?.autoExpireHangouts
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        {/* Blocked Students Section */}
        <Card className="p-6 bg-white border-campus-border/80 shadow-xs">
          <div className="pb-4 border-b border-campus-border/60">
            <h3 className="text-base font-bold text-campus-charcoal">
              Blocked Students
            </h3>
            <p className="text-xs text-campus-muted mt-1">
              Students you have blocked will not be able to message you.
            </p>
          </div>

          <div className="mt-4">
            {isLoadingBlocked ? (
              <p className="text-xs text-campus-muted py-4 text-center">
                Loading blocked list...
              </p>
            ) : blockedUsers.length > 0 ? (
              <div className="divide-y divide-campus-border/50">
                {blockedUsers.map((bu) => (
                  <div key={bu.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        moniker={bu.username}
                        avatarId={bu.avatarId}
                        color={bu.avatarColor}
                        size="sm"
                      />
                      <div>
                        <span className="text-xs font-bold text-campus-charcoal block">
                          {bu.username}
                        </span>
                        <span className="text-[10px] text-campus-muted">
                          {bu.collegeName}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblockUser(bu.id)}
                      className="text-xs"
                    >
                      Unblock
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-campus-muted py-3 text-center">
                You haven&apos;t blocked any students.
              </p>
            )}
          </div>
        </Card>
      </div>
      )}

      {/* EDIT PROFILE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Campus Identity"
        subtitle="Update your pseudonymous moniker, avatar style, bio, and campus interests."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <Input
            label="Pseudonymous Moniker"
            value={editUsername}
            onChange={(e) => setEditUsername(e.target.value)}
            helperText="Letters and numbers only. Must be unique on campus."
            required
          />

          <div>
            <label className="block text-xs font-semibold tracking-wide uppercase text-campus-muted mb-2">
              Abstract Avatar Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = editAvatar.id === preset.id;
                return (
                  <button
                    type="button"
                    key={preset.id}
                    onClick={() => setEditAvatar(preset)}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? "bg-white border-campus-accent ring-2 ring-campus-accent/20"
                        : "bg-campus-bg border-campus-border hover:bg-white"
                    }`}
                  >
                    <Avatar
                      moniker={preset.initials}
                      avatarId={preset.id}
                      color={preset.color}
                      size="sm"
                    />
                    <span className="text-[11px] font-semibold text-campus-charcoal truncate">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Textarea
            label="Bio"
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            rows={3}
            helperText={`${editBio.length} / 240 characters.`}
          />

          <div>
            <label className="block text-xs font-semibold tracking-wide uppercase text-campus-muted mb-1.5">
              Interests (Select 3 to 8)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CAMPUS_INTERESTS_LIST.map((interest) => {
                const isSelected = editInterests.includes(interest);
                return (
                  <button
                    type="button"
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors flex items-center gap-1 ${
                      isSelected
                        ? "bg-campus-accent text-white border-campus-accent"
                        : "bg-white text-campus-body border-campus-border hover:bg-stone-50"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{interest}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-campus-border/70">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
            >
              Save Identity
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
