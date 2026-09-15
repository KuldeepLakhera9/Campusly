"use client";

import * as React from "react";
import { MOCK_USER, MOCK_HANGOUTS, MOCK_POSTS } from "@/lib/data/mock-data";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { HangoutCard } from "@/components/hangouts/hangout-card";
import { PostCard } from "@/components/feed/post-card";
import {
  ShieldCheck,
  Sparkles,
  Flame,
} from "lucide-react";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = React.useState("activity");
  const user = MOCK_USER;
  const [privacySettings, setPrivacySettings] = React.useState(
    MOCK_USER.privacySettings
  );
  const [savedSuccess, setSavedSuccess] = React.useState(false);

  const toggleSetting = (key: keyof typeof privacySettings) => {
    setPrivacySettings((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
      return updated;
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
      {/* Profile Persona Card */}
      <Card className="p-6 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <Avatar
              moniker={user.pseudonym}
              color={user.avatarColor}
              size="xl"
              className="shadow-2xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl font-medium text-campus-charcoal">
                  {user.pseudonym}
                </h1>
                <Badge variant="accent" size="sm">
                  Verified Student
                </Badge>
              </div>

              <p className="text-xs text-campus-muted mt-0.5">
                {user.universityName} • {user.major} (Class of {user.graduationYear})
              </p>

              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-campus-accent bg-campus-accent-soft px-2.5 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3" />
                  <span>{user.sparksCount} Campus Sparks</span>
                </span>
                <span className="text-[11px] text-campus-muted">
                  Earned via verified hangouts & helpful notes
                </span>
              </div>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Identity Encrypted</span>
            </span>
          </div>
        </div>

        {/* Bio */}
        <p className="mt-5 pt-4 border-t border-campus-border/70 text-xs sm:text-sm text-campus-body leading-relaxed">
          {user.bio}
        </p>

        {/* Interests */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {user.interests.map((interest) => (
            <Badge key={interest} variant="default" size="sm">
              {interest}
            </Badge>
          ))}
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
        <Card className="p-6 bg-white space-y-6">
          <div>
            <h2 className="font-serif text-lg font-medium text-campus-charcoal">
              Privacy Architecture
            </h2>
            <p className="text-xs text-campus-muted mt-0.5">
              Campusly is built to protect your identity from internet surveillance and campus pressure.
            </p>
          </div>

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Privacy settings updated securely.</span>
            </div>
          )}

          <div className="divide-y divide-campus-border/70">
            {/* Setting 1 */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <span className="block text-sm font-semibold text-campus-charcoal">
                  Hide Major & Year
                </span>
                <span className="block text-xs text-campus-muted mt-0.5">
                  When enabled, only your pseudonym and campus affiliation are visible to peers.
                </span>
              </div>
              <button
                onClick={() => toggleSetting("hideMajor")}
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                  privacySettings.hideMajor ? "bg-campus-accent" : "bg-stone-300"
                }`}
                aria-label="Toggle hide major"
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    privacySettings.hideMajor
                      ? "translate-x-6"
                      : "translate-x-1"
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
                onClick={() => toggleSetting("allowDirectMessages")}
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                  privacySettings.allowDirectMessages ? "bg-campus-accent" : "bg-stone-300"
                }`}
                aria-label="Toggle direct messages"
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    privacySettings.allowDirectMessages
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
                onClick={() => toggleSetting("autoExpireHangouts")}
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                  privacySettings.autoExpireHangouts ? "bg-campus-accent" : "bg-stone-300"
                }`}
                aria-label="Toggle auto expire hangouts"
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    privacySettings.autoExpireHangouts
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
