"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { HangoutCard } from "@/components/hangouts/hangout-card";
import { PostCard } from "@/components/feed/post-card";
import { Footer } from "@/components/layout/footer";
import { generatePseudonym, PseudonymOption } from "@/lib/utils/pseudonym";
import { IPost } from "@/types/post";
import { IHangout } from "@/types/hangout";
import { PostCardSkeleton, HangoutCardSkeleton } from "@/components/ui/skeleton-loader";
import {
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Compass,
  ArrowRight,
  EyeOff,
  Flame,
  Clock,
} from "lucide-react";

export default function LandingPage() {
  const [demoMoniker, setDemoMoniker] = React.useState<PseudonymOption>({
    moniker: "Library Fox",
    avatarColor: "#C15438",
    avatarIcon: "LF",
    circle: "Campus Common",
  });
  const [isSpinning, setIsSpinning] = React.useState(false);

  const [pulseHangout, setPulseHangout] = React.useState<IHangout | null>(null);
  const [pulsePost, setPulsePost] = React.useState<IPost | null>(null);
  const [isLoadingPulse, setIsLoadingPulse] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    async function loadLivePulse() {
      try {
        const [hangoutRes, postRes] = await Promise.all([
          fetch("/api/hangouts?limit=1"),
          fetch("/api/posts?limit=1"),
        ]);
        if (isMounted) {
          if (hangoutRes.ok) {
            const hData = await hangoutRes.json();
            if (hData.hangouts && hData.hangouts.length > 0) {
              setPulseHangout(hData.hangouts[0]);
            }
          }
          if (postRes.ok) {
            const pData = await postRes.json();
            if (pData.posts && pData.posts.length > 0) {
              setPulsePost(pData.posts[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load live pulse:", err);
      } finally {
        if (isMounted) setIsLoadingPulse(false);
      }
    }
    loadLivePulse();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSpinMoniker = () => {
    setIsSpinning(true);
    setTimeout(() => {
      setDemoMoniker(generatePseudonym());
      setIsSpinning(false);
    }, 250);
  };

  return (
    <div className="min-h-screen flex flex-col bg-campus-bg text-campus-charcoal">
      {/* Top Editorial Header */}
      <header className="border-b border-campus-border/80 bg-campus-bg/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-semibold tracking-tight text-campus-charcoal">
              CAMPUSLY
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">
                Join Your Campus
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-16 md:pt-24 md:pb-20 border-b border-campus-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Trust Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200/90 text-xs font-medium mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Exclusively for verified .edu college students</span>
          </div>

          {/* Editorial Headline */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-campus-charcoal tracking-tight leading-[1.15] max-w-3xl mx-auto">
            Your campus, your circle.{" "}
            <span className="italic block mt-1 text-campus-accent">
              Connect without the pressure.
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-base sm:text-lg text-campus-body max-w-2xl mx-auto leading-relaxed font-normal">
            A privacy-first campus social platform where verified students interact through pseudonymous identities, discover campus activities, and create spontaneous hangouts without social posturing.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" className="w-full sm:w-auto">
                <span>Claim Your Campus Moniker</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/explore" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Compass className="w-4 h-4" />
                <span>Explore Live Pulse</span>
              </Button>
            </Link>
          </div>

          {/* Tactile Micro-interaction: Moniker Spinner */}
          <div className="mt-14 max-w-md mx-auto p-4 rounded-xl bg-white border border-campus-border shadow-xs text-left">
            <div className="flex items-center justify-between pb-3 border-b border-campus-border/70">
              <span className="text-[11px] font-bold uppercase tracking-wider text-campus-muted">
                Interactive Moniker Generator
              </span>
              <button
                onClick={handleSpinMoniker}
                disabled={isSpinning}
                className="flex items-center gap-1.5 text-xs text-campus-accent hover:text-campus-accent-hover font-medium"
              >
                <RefreshCw className={`w-3 h-3 ${isSpinning ? "animate-spin" : ""}`} />
                <span>Spin Moniker</span>
              </button>
            </div>

            <div className="pt-3 flex items-center gap-3">
              <Avatar
                moniker={demoMoniker.moniker}
                color={demoMoniker.avatarColor}
                size="md"
              />
              <div className="flex-1">
                <div className="text-sm font-bold text-campus-charcoal">
                  {demoMoniker.moniker}
                </div>
                <div className="text-xs text-campus-muted">
                  Pseudonymous identity • Real name hidden by default
                </div>
              </div>
              <Badge variant="accent" size="sm">
                Verified
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Editorial Pillars */}
      <section className="py-16 md:py-20 border-b border-campus-border/60 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl mx-auto text-center mb-12">
            <span className="text-xs uppercase font-bold tracking-widest text-campus-accent">
              The Campusly Ethos
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-campus-charcoal mt-2">
              Social life designed for humans, not algorithms.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-xl border border-campus-border bg-campus-bg/40 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-campus-accent-soft text-campus-accent flex items-center justify-center border border-campus-accent-border/60">
                <EyeOff className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-medium text-campus-charcoal">
                Pseudonymous by Default
              </h3>
              <p className="text-xs sm:text-sm text-campus-muted leading-relaxed">
                Post honest questions, confess struggles, and join study groups under a protected campus moniker. Reveal your real identity only when mutual trust is built.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-xl border border-campus-border bg-campus-bg/40 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center border border-stone-200">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-medium text-campus-charcoal">
                Spontaneous Hangouts
              </h3>
              <p className="text-xs sm:text-sm text-campus-muted leading-relaxed">
                Need study partners at Doe Library for 45 minutes? Looking for a 3rd player for spikeball? Post an open spot, set a capacity limit, and auto-expire when finished.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-xl border border-campus-border bg-campus-bg/40 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-medium text-campus-charcoal">
                Zero Social Pressure
              </h3>
              <p className="text-xs sm:text-sm text-campus-muted leading-relaxed">
                No public follower counts, no performative photo curation, no algorithmic feed traps. Just real peers sharing your college grounds right now.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Sneak Peek: Spontaneous Hangouts & Campus Thoughts */}
      <section className="py-16 md:py-20 border-b border-campus-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-campus-accent">
                Happening Right Now
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-campus-charcoal mt-1">
                Live Pulse on Campus
              </h2>
            </div>

            <Link href="/explore">
              <Button variant="outline" size="sm">
                <span>View Full Campus Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spontaneous Hangout Pulse */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-campus-muted flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-campus-accent" />
                <span>Live Spontaneous Meetup</span>
              </div>
              {isLoadingPulse ? (
                <HangoutCardSkeleton />
              ) : pulseHangout ? (
                <HangoutCard hangout={pulseHangout} />
              ) : (
                <div className="p-6 rounded-xl border border-dashed border-campus-border/80 bg-white text-center flex flex-col items-center justify-center min-h-[220px]">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-campus-accent flex items-center justify-center mb-2.5">
                    <Flame className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-sm font-semibold text-campus-charcoal mb-1">
                    No Active Meetup Right Now
                  </h3>
                  <p className="text-xs text-campus-muted max-w-xs mb-3 leading-relaxed">
                    Be the first on campus to ignite a coffee run, library study block, or lawn hangout.
                  </p>
                  <Link href="/register">
                    <Button size="sm" variant="primary">
                      Host First Meetup
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Pseudonymous Thought Pulse */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-campus-muted flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-campus-accent" />
                <span>Recent Campus Thought</span>
              </div>
              {isLoadingPulse ? (
                <PostCardSkeleton />
              ) : pulsePost ? (
                <PostCard post={pulsePost} />
              ) : (
                <div className="p-6 rounded-xl border border-dashed border-campus-border/80 bg-white text-center flex flex-col items-center justify-center min-h-[220px]">
                  <div className="w-10 h-10 rounded-full bg-stone-100 text-campus-charcoal flex items-center justify-center mb-2.5">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-sm font-semibold text-campus-charcoal mb-1">
                    Campus Board is Quiet
                  </h3>
                  <p className="text-xs text-campus-muted max-w-xs mb-3 leading-relaxed">
                    Drop a question, thought, or story pseudonymously to start the collegiate conversation.
                  </p>
                  <Link href="/register">
                    <Button size="sm" variant="primary">
                      Share First Thought
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Collegiate Manifesto Callout */}
      <section className="py-16 bg-[#F5F0E8] border-b border-campus-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="font-serif text-xl sm:text-2xl text-campus-charcoal italic leading-relaxed block">
            &ldquo;College shouldn&apos;t feel like an ongoing audition for strangers on the internet. It should feel like walking into a library where everyone is quietly on your side.&rdquo;
          </span>
          <div className="mt-5 text-xs uppercase tracking-widest font-semibold text-campus-accent">
            — The Campusly Student Charter
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
