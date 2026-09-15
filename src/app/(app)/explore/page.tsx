"use client";

import * as React from "react";
import Link from "next/link";
import { IPost, PostCategory, POST_CATEGORIES, PostSortOption } from "@/types/post";
import { PostCard } from "@/components/feed/post-card";
import { CreatePostModal } from "@/components/feed/create-post-modal";
import { CreateHangoutModal } from "@/components/hangouts/create-hangout-modal";
import { IHangout } from "@/types/hangout";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Search,
  Plus,
  Sparkles,
  Flame,
  ArrowRight,
  TrendingUp,
  Clock,
  ThumbsUp,
  Compass,
  Users,
  MessageSquare,
  User,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const CATEGORY_FILTERS: Array<"All" | PostCategory> = [
  "All",
  ...POST_CATEGORIES,
];

const SORT_OPTIONS: { id: PostSortOption; label: string; icon: React.ElementType }[] = [
  { id: "latest", label: "Latest", icon: Clock },
  { id: "popular", label: "Popular", icon: ThumbsUp },
  { id: "trending", label: "Trending", icon: TrendingUp },
];

export default function ExplorePage() {
  const { user } = useAuth();

  const [posts, setPosts] = React.useState<IPost[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeCategory, setActiveCategory] = React.useState<"All" | PostCategory>("All");
  const [activeSort, setActiveSort] = React.useState<PostSortOption>("latest");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [nextCursor, setNextCursor] = React.useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isHangoutModalOpen, setIsHangoutModalOpen] = React.useState(false);
  const [todayHangouts, setTodayHangouts] = React.useState<IHangout[]>([]);

  // Fetch live hangouts for sidebar
  React.useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(async () => {
      try {
        const res = await fetch("/api/hangouts?limit=3");
        const data = await res.json();
        if (isMounted && res.ok && data.hangouts) {
          setTodayHangouts(data.hangouts);
        }
      } catch (err) {
        console.error("Failed to load sidebar hangouts:", err);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch posts from backend API
  const fetchPosts = React.useCallback(
    async (reset = true, cursor?: string) => {
      if (reset) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        const params = new URLSearchParams();
        if (activeCategory !== "All") {
          params.set("category", activeCategory);
        }
        params.set("sort", activeSort);
        if (debouncedSearch.trim()) {
          params.set("search", debouncedSearch.trim());
        }
        if (cursor) {
          params.set("cursor", cursor);
        }
        params.set("limit", "15");

        const res = await fetch(`/api/posts?${params.toString()}`);
        const data = await res.json();

        if (res.ok && data.posts) {
          if (reset) {
            setPosts(data.posts);
          } else {
            setPosts((prev) => [...prev, ...data.posts]);
          }
          setHasMore(Boolean(data.hasMore));
          setNextCursor(data.nextCursor);
        }
      } catch (err) {
        console.error("Failed to load posts:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [activeCategory, activeSort, debouncedSearch]
  );

  // Fetch initial posts on filter or sort change
  React.useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(async () => {
      if (!isMounted) return;
      setIsLoading(true);

      try {
        const params = new URLSearchParams();
        if (activeCategory !== "All") {
          params.set("category", activeCategory);
        }
        params.set("sort", activeSort);
        if (debouncedSearch.trim()) {
          params.set("search", debouncedSearch.trim());
        }
        params.set("limit", "15");

        const res = await fetch(`/api/posts?${params.toString()}`);
        const data = await res.json();

        if (isMounted && res.ok && data.posts) {
          setPosts(data.posts);
          setHasMore(Boolean(data.hasMore));
          setNextCursor(data.nextCursor);
        }
      } catch (err) {
        console.error("Failed to load posts:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeCategory, activeSort, debouncedSearch]);

  // Handle new post creation
  const handlePostCreated = (newPost: IPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  // Handle post deletion
  const handlePostDeleted = (deletedPostId: string) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedPostId));
  };

  const username = user?.publicIdentity?.username || "Anonymous Student";
  const avatarId = user?.publicIdentity?.avatarId || "terracotta-prism";
  const avatarColor = user?.publicIdentity?.avatarColor || "#C15438";
  const collegeName = user?.college?.name || "Campus Community";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      {/* 3-Column Desktop Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Quick Navigation & Campus Identity (3 cols on lg) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-5">
          {/* Student Identity Card */}
          <Card className="p-4 bg-white space-y-3">
            <div className="flex items-center gap-3">
              <Avatar
                moniker={username}
                avatarId={avatarId}
                color={avatarColor}
                size="md"
              />
              <div className="min-w-0">
                <div className="font-bold text-sm text-campus-charcoal truncate">
                  {username}
                </div>
                <div className="text-[11px] text-campus-muted truncate">
                  {collegeName}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-campus-border/60 flex items-center justify-between text-xs">
              <span className="text-campus-muted">Campus Sparks</span>
              <span className="font-semibold text-campus-accent flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {user?.sparksCount ?? 10}
              </span>
            </div>
          </Card>

          {/* Quick Navigation Links */}
          <Card className="p-3 bg-white space-y-1">
            <Link
              href="/explore"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold bg-campus-bg text-campus-charcoal"
            >
              <Compass className="w-4 h-4 text-campus-accent" />
              <span>Campus Feed</span>
            </Link>
            <Link
              href="/hangouts"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-campus-body hover:bg-stone-50 transition-colors"
            >
              <Users className="w-4 h-4 text-campus-muted" />
              <span>Spontaneous Hangouts</span>
            </Link>
            <Link
              href="/messages"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-campus-body hover:bg-stone-50 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-campus-muted" />
              <span>Messages</span>
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-campus-body hover:bg-stone-50 transition-colors"
            >
              <User className="w-4 h-4 text-campus-muted" />
              <span>Pseudonymous Profile</span>
            </Link>
          </Card>

          {/* Privacy Guarantee Card */}
          <div className="p-4 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-campus-accent" />
              <span className="text-xs font-semibold text-campus-charcoal">
                Strict Student Privacy
              </span>
            </div>
            <p className="text-[11px] text-campus-muted leading-relaxed">
              Posts and comments never reveal your email or real name. You are always represented by your pseudonymous moniker.
            </p>
          </div>
        </aside>

        {/* Center Column: Campus Feed (6 cols on lg) */}
        <main className="lg:col-span-6 space-y-5">
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-4 pb-2">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-medium text-campus-charcoal">
                Campus Feed
              </h1>
              <p className="text-xs text-campus-muted mt-0.5">
                Anonymous discussions, questions & observations across {collegeName}.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHangoutModalOpen(true)}
                className="hidden sm:inline-flex text-xs"
              >
                <Flame className="w-3.5 h-3.5 text-campus-accent mr-1" />
                <span>Host Hangout</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                className="shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Start a conversation</span>
                <span className="sm:hidden">Post</span>
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2.5 bg-white px-3.5 py-2.5 rounded-lg border border-campus-border shadow-2xs">
            <Search className="w-4 h-4 text-campus-muted shrink-0" />
            <input
              type="text"
              placeholder="Search campus thoughts, questions, or lost items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm bg-transparent outline-none text-campus-charcoal placeholder:text-campus-subtle"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-campus-muted hover:text-campus-charcoal"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills (Horizontal Scroll) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORY_FILTERS.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-md font-medium whitespace-nowrap border transition-colors",
                    isActive
                      ? "bg-campus-charcoal text-white border-campus-charcoal shadow-2xs"
                      : "bg-white text-campus-body border-campus-border hover:bg-stone-50"
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {/* Quick Composer Trigger Card */}
          <Card className="p-4 bg-white/90 border-dashed border-campus-border hover:border-campus-accent/70 transition-all">
            <div className="flex items-center gap-3">
              <Avatar
                moniker={username}
                avatarId={avatarId}
                color={avatarColor}
                size="sm"
              />
              <div
                onClick={() => setIsCreateModalOpen(true)}
                className="text-xs sm:text-sm text-campus-muted flex-1 font-normal select-none truncate cursor-pointer"
              >
                What&apos;s happening on campus? Share a thought as {username}...
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsHangoutModalOpen(true)}
                  className="text-xs py-1 px-2.5 hidden sm:inline-flex"
                >
                  <Flame className="w-3 h-3 text-campus-accent mr-1" />
                  <span>Hangout</span>
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="text-xs py-1 px-2.5"
                >
                  <span>Post</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Sorting Tabs Bar */}
          <div className="flex items-center justify-between gap-2 pt-1 border-b border-campus-border/60 pb-2">
            <div className="flex items-center gap-1">
              {SORT_OPTIONS.map((opt) => {
                const isSelected = activeSort === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setActiveSort(opt.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors",
                      isSelected
                        ? "bg-stone-200 text-campus-charcoal font-semibold"
                        : "text-campus-muted hover:text-campus-charcoal hover:bg-stone-100"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] text-campus-muted">
              {posts.length} {posts.length === 1 ? "thought" : "thoughts"}
            </span>
          </div>

          {/* Posts Feed */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-5 bg-white animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-stone-200" />
                    <div className="space-y-1.5 flex-1">
                      <div className="w-24 h-3 bg-stone-200 rounded" />
                      <div className="w-16 h-2 bg-stone-100 rounded" />
                    </div>
                  </div>
                  <div className="w-full h-12 bg-stone-100 rounded" />
                  <div className="w-20 h-4 bg-stone-100 rounded" />
                </Card>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onPostDeleted={handlePostDeleted}
                />
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="pt-2 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPosts(false, nextCursor)}
                    isLoading={isLoadingMore}
                    className="text-xs px-6"
                  >
                    Load more thoughts
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="The campus is quiet here."
              description={
                activeCategory !== "All"
                  ? `No thoughts shared under "${activeCategory}" yet. Be the first to start the conversation.`
                  : "No posts found matching your search. Start a conversation and connect with classmates."
              }
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  <span>Start a conversation</span>
                </Button>
              }
            />
          )}
        </main>

        {/* Right Column: Campus Pulse & Happenings (3 cols on lg) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          {/* Active Spontaneous Hangouts Card */}
          <Card className="p-5 bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-campus-border/70 mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-campus-accent" />
                <h3 className="font-serif text-base font-medium text-campus-charcoal">
                  Happening Today
                </h3>
              </div>
              <Link
                href="/hangouts"
                className="text-xs text-campus-accent hover:underline font-medium flex items-center gap-1"
              >
                <span>All</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {todayHangouts.length > 0 ? (
                todayHangouts.map((h) => {
                  const spotsLeft = Math.max(0, h.maxParticipants - (h.participantsCount ?? 1));
                  return (
                    <Link
                      key={h._id}
                      href={`/hangouts/${h._id}`}
                      className="block p-3 bg-stone-50 rounded-lg border border-campus-border/70 space-y-1.5 hover:border-campus-accent/70 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-campus-accent">
                          {h.activity}
                        </span>
                        <span className="text-[10px] text-campus-muted">
                          {spotsLeft === 0 ? "Full" : `${spotsLeft} spots left`}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-campus-charcoal leading-snug truncate">
                        {h.title}
                      </div>
                      <div className="text-[11px] text-campus-muted truncate">
                        📍 {h.location} • {h.startTime}
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-4 text-xs text-campus-muted">
                  No hangouts scheduled today yet.
                </div>
              )}
            </div>
          </Card>

          {/* Campus Etiquette / Guidelines Card */}
          <Card className="p-5 bg-stone-50 border-stone-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-campus-accent" />
              <h3 className="font-serif text-sm font-medium text-campus-charcoal">
                Campus Etiquette
              </h3>
            </div>
            <p className="text-xs text-campus-muted leading-relaxed">
              Pseudonymity is a trust system, not a shield for hostility. Keep criticism constructive, protect classmate privacy, and report harassment.
            </p>
          </Card>
        </aside>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
      />

      {/* Create Hangout Modal */}
      <CreateHangoutModal
        isOpen={isHangoutModalOpen}
        onClose={() => setIsHangoutModalOpen(false)}
        onSuccess={(h) => setTodayHangouts((prev) => [h, ...prev])}
      />
    </div>
  );
}
