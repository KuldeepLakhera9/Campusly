"use client";

import * as React from "react";
import Link from "next/link";
import { IPost, CampusCircle } from "@/types/post";
import { MOCK_POSTS, MOCK_HANGOUTS } from "@/lib/data/mock-data";
import { PostCard } from "@/components/feed/post-card";
import { CreatePostModal } from "@/components/feed/create-post-modal";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Search,
  Plus,
  Sparkles,
  Flame,
  ArrowRight,
} from "lucide-react";

const CIRCLE_FILTERS: CampusCircle[] = [
  "All Circles",
  "Academics",
  "Dorm Life",
  "Late Night",
  "Course Advice",
  "Campus Confessions",
  "Lost & Found",
];

export default function ExplorePage() {
  const [posts, setPosts] = React.useState<IPost[]>(MOCK_POSTS);
  const [activeCircle, setActiveCircle] = React.useState<CampusCircle>("All Circles");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  const filteredPosts = posts.filter((post) => {
    const matchesCircle =
      activeCircle === "All Circles" || post.circle === activeCircle;
    const matchesSearch =
      searchQuery.trim() === "" ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCircle && matchesSearch;
  });

  const handlePostCreated = (content: string, circle: CampusCircle) => {
    const newPost: IPost = {
      _id: `post-${Date.now()}`,
      content,
      authorPseudonym: "Library Fox",
      authorAvatarColor: "#C15438",
      campus: "UC Berkeley",
      circle,
      upvotesCount: 1,
      repliesCount: 0,
      userUpvoted: true,
      tags: ["New"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPosts([newPost, ...posts]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-campus-border/70">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-campus-charcoal">
            Campus Pulse
          </h1>
          <p className="text-xs sm:text-sm text-campus-muted mt-1">
            Real student conversations and thoughts across UC Berkeley.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Share a Thought</span>
        </Button>
      </div>

      {/* Main Grid: Feed & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* Main Feed Column (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Search and Prompt Bar */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-campus-border shadow-2xs">
            <Search className="w-4 h-4 text-campus-muted ml-1" />
            <input
              type="text"
              placeholder="Search campus thoughts, course tags, library notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm bg-transparent outline-none text-campus-charcoal placeholder:text-campus-subtle"
            />
          </div>

          {/* Circle Topic Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CIRCLE_FILTERS.map((circle) => {
              const isActive = activeCircle === circle;
              return (
                <button
                  key={circle}
                  onClick={() => setActiveCircle(circle)}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium whitespace-nowrap border transition-colors ${
                    isActive
                      ? "bg-campus-charcoal text-white border-campus-charcoal"
                      : "bg-white text-campus-body border-campus-border hover:bg-stone-50"
                  }`}
                >
                  {circle}
                </button>
              );
            })}
          </div>

          {/* Quick Composer Trigger Card */}
          <Card
            interactive
            onClick={() => setIsCreateModalOpen(true)}
            className="p-4 bg-white/90 flex items-center gap-3 border-dashed"
          >
            <Avatar moniker="Library Fox" color="#C15438" size="sm" />
            <div className="text-xs sm:text-sm text-campus-muted flex-1 font-normal select-none">
              Have an honest question, observation, or course tip? Post pseudonomously...
            </div>
            <Button size="sm" variant="outline" className="hidden sm:inline-flex text-xs">
              Post
            </Button>
          </Card>

          {/* Posts List */}
          {filteredPosts.length > 0 ? (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No posts found"
              description={`There are no campus thoughts in "${activeCircle}" matching your search.`}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveCircle("All Circles");
                    setSearchQuery("");
                  }}
                >
                  Clear Filters
                </Button>
              }
            />
          )}
        </div>

        {/* Sidebar Column (4 cols) */}
        <aside className="lg:col-span-4 space-y-6">
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
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {MOCK_HANGOUTS.slice(0, 2).map((h) => (
                <div
                  key={h._id}
                  className="p-3 bg-campus-bg/60 rounded-lg border border-campus-border/70 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-campus-accent">
                      {h.category}
                    </span>
                    <span className="text-[10px] text-campus-muted">
                      {h.maxParticipants - h.participants.length} spots left
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-campus-charcoal leading-snug">
                    {h.title}
                  </div>
                  <div className="text-[11px] text-campus-muted truncate">
                    📍 {h.locationSpot}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Campus Guidelines / Charter Card */}
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
    </div>
  );
}
