"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AVATAR_PRESETS, AvatarPreset } from "@/lib/utils/avatars";
import { CAMPUS_INTERESTS_LIST } from "@/lib/validations/auth";
import {
  ShieldCheck,
  RefreshCw,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);

  // Identity Form State
  const [username, setUsername] = React.useState(
    user?.publicIdentity?.username || "MidnightFox"
  );
  const [selectedAvatar, setSelectedAvatar] = React.useState<AvatarPreset>(
    AVATAR_PRESETS[0]
  );
  const [usernameStatus, setUsernameStatus] = React.useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("available");
  const [usernameMessage, setUsernameMessage] = React.useState<string | null>(null);

  // Interests Form State
  const [selectedInterests, setSelectedInterests] = React.useState<string[]>([
    "Coding",
    "Chai",
    "Study",
  ]);

  // Bio Form State
  const [bio, setBio] = React.useState(
    "Curious student exploring campus life without the pressure."
  );

  // Submission State
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Real-time debounced username validation inside timer
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      const trimmed = username.trim();
      if (!trimmed) {
        setUsernameStatus("invalid");
        setUsernameMessage("Username cannot be empty.");
        return;
      }

      if (trimmed.length < 3 || trimmed.length > 24) {
        setUsernameStatus("invalid");
        setUsernameMessage("Must be between 3 and 24 characters.");
        return;
      }

      if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
        setUsernameStatus("invalid");
        setUsernameMessage("Only letters and numbers are allowed.");
        return;
      }

      setUsernameStatus("checking");
      try {
        const res = await fetch(
          `/api/auth/check-username?username=${encodeURIComponent(trimmed)}`
        );
        const data = await res.json();
        if (data.available) {
          setUsernameStatus("available");
          setUsernameMessage("Username is available!");
        } else {
          setUsernameStatus("taken");
          setUsernameMessage(data.error || "This username is already taken.");
        }
      } catch {
        setUsernameStatus("idle");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username]);

  // Shuffle username
  const handleShuffleUsername = async () => {
    try {
      const res = await fetch("/api/auth/generate-username");
      const data = await res.json();
      if (data.success && data.username) {
        setUsername(data.username);
      }
    } catch (err) {
      console.error("Shuffle username failed:", err);
    }
  };

  // Toggle interest
  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests((prev) => prev.filter((i) => i !== interest));
    } else {
      if (selectedInterests.length >= 8) return;
      setSelectedInterests((prev) => [...prev, interest]);
    }
  };

  // Submit complete onboarding
  const handleCompleteOnboarding = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          avatarId: selectedAvatar.id,
          avatarColor: selectedAvatar.color,
          bio: bio.trim(),
          interests: selectedInterests,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to complete onboarding.");
        setIsSubmitting(false);
        return;
      }

      await refreshUser();
      router.push("/explore");
      router.refresh();
    } catch (err) {
      console.error("Onboarding submission error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-campus-bg text-campus-charcoal">
      <div className="w-full max-w-xl">
        <Card className="shadow-sm">
          <CardHeader className="text-center pb-4">
            <div className="font-serif text-2xl font-bold tracking-tight text-campus-charcoal">
              CAMPUSLY
            </div>
            <h1 className="font-serif text-xl font-medium text-campus-charcoal mt-1">
              {step === 1 && "Choose How People Know You"}
              {step === 2 && "What Are You Into?"}
              {step === 3 && "A Little About Yourself"}
              {step === 4 && "You're Ready for Campus"}
            </h1>
            <p className="text-xs text-campus-muted mt-0.5">
              Step {step} of 4 • Pseudonymous by design
            </p>

            {/* Stepper Progress Bar */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s === step
                      ? "w-8 bg-campus-accent"
                      : s < step
                      ? "w-4 bg-stone-500"
                      : "w-4 bg-stone-200"
                  }`}
                />
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-2">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: IDENTITY & AVATAR PRESET */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Active Preview */}
                <div className="p-5 rounded-xl bg-campus-muted-bg/60 border border-campus-border flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <Avatar
                      moniker={username}
                      avatarId={selectedAvatar.id}
                      color={selectedAvatar.color}
                      size="lg"
                    />
                    <div>
                      <div className="font-serif text-lg font-bold text-campus-charcoal">
                        {username || "YourMoniker"}
                      </div>
                      <div className="text-xs text-campus-muted">
                        {selectedAvatar.name} Preset • Pseudonymous
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleShuffleUsername}
                    className="text-xs shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Shuffle</span>
                  </Button>
                </div>

                {/* Custom Username Input */}
                <div className="space-y-1.5">
                  <Input
                    label="Pseudonymous Moniker"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. MidnightFox, QuietCoder"
                    helperText={
                      usernameMessage || "Only letters and numbers. 3 to 24 characters."
                    }
                    error={
                      usernameStatus === "taken" || usernameStatus === "invalid"
                        ? usernameMessage || undefined
                        : undefined
                    }
                  />
                  {usernameStatus === "available" && (
                    <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{usernameMessage}</span>
                    </p>
                  )}
                </div>

                {/* Abstract Avatar Presets */}
                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase text-campus-muted mb-2.5">
                    Select Abstract Avatar Style
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {AVATAR_PRESETS.map((preset) => {
                      const isSelected = selectedAvatar.id === preset.id;
                      return (
                        <button
                          type="button"
                          key={preset.id}
                          onClick={() => setSelectedAvatar(preset)}
                          className={`p-2.5 rounded-lg border text-left transition-all flex items-center gap-2.5 ${
                            isSelected
                              ? "bg-white border-campus-accent ring-2 ring-campus-accent/20 shadow-xs"
                              : "bg-white/60 border-campus-border hover:bg-white"
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

                <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-lg flex items-start gap-2.5 text-xs text-campus-muted">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    Your real name and email remain encrypted and will never appear on campus boards.
                  </span>
                </div>
              </div>
            )}

            {/* STEP 2: INTEREST SELECTION */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold tracking-wide uppercase text-campus-muted">
                    Pick your campus circles & interests
                  </label>
                  <span
                    className={`text-xs font-medium ${
                      selectedInterests.length >= 3 && selectedInterests.length <= 8
                        ? "text-emerald-700"
                        : "text-campus-accent"
                    }`}
                  >
                    {selectedInterests.length} of 8 selected (min 3)
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {CAMPUS_INTERESTS_LIST.map((interest) => {
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <button
                        type="button"
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-campus-accent text-white border-campus-accent shadow-2xs font-semibold"
                            : "bg-white text-campus-body border-campus-border hover:bg-stone-50"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                        <span>{interest}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-campus-muted pt-2">
                  Interests help you discover relevant spontaneous hangouts and course circles without social performance.
                </p>
              </div>
            )}

            {/* STEP 3: BIO */}
            {step === 3 && (
              <div className="space-y-4">
                <Textarea
                  label="Short Bio (Optional)"
                  placeholder="e.g. Studying cognitive science, fond of 3rd floor library corners, late night tea, and quiet problem sets."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  helperText={`${bio.length} / 240 characters. Keep it friendly and low-pressure.`}
                />

                <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-lg flex items-start gap-2.5 text-xs text-campus-muted">
                  <Sparkles className="w-4 h-4 text-campus-accent shrink-0 mt-0.5" />
                  <span>
                    Do not include personal contact information, phone numbers, or external social handles in your bio.
                  </span>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & CONFIRM */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="p-6 rounded-xl bg-white border border-campus-border shadow-xs space-y-4 text-left">
                  <div className="flex items-center gap-4 pb-4 border-b border-campus-border/70">
                    <Avatar
                      moniker={username}
                      avatarId={selectedAvatar.id}
                      color={selectedAvatar.color}
                      size="lg"
                    />
                    <div>
                      <div className="font-serif text-xl font-bold text-campus-charcoal">
                        {username}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="accent" size="sm">
                          Verified Student
                        </Badge>
                        <span className="text-xs text-campus-muted">
                          {user?.college?.name || "Campus Community"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {bio && (
                    <p className="text-xs sm:text-sm text-campus-body italic leading-relaxed">
                      &ldquo;{bio}&rdquo;
                    </p>
                  )}

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-campus-muted block mb-2">
                      Selected Circles
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedInterests.map((interest) => (
                        <Badge key={interest} variant="default" size="sm">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-center text-campus-muted">
                  You can edit your avatar, moniker, and interests at any time from your Profile.
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between pt-4 border-t border-campus-border/70">
            {step > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                type="button"
                variant="primary"
                disabled={
                  (step === 1 && usernameStatus !== "available") ||
                  (step === 2 && selectedInterests.length < 3)
                }
                onClick={() => setStep((s) => (s + 1) as 2 | 3 | 4)}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                isLoading={isSubmitting}
                onClick={handleCompleteOnboarding}
              >
                <span>Enter Campusly</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
