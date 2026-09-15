"use client";

import * as React from "react";
import { IHangout, HANGOUT_ACTIVITIES, HangoutDateFilter, HangoutAvailabilityFilter } from "@/types/hangout";
import { HangoutCard } from "@/components/hangouts/hangout-card";
import { CreateHangoutModal } from "@/components/hangouts/create-hangout-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { Plus, Search, Calendar, Sparkles, Filter } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const DATE_TABS: { id: HangoutDateFilter; label: string }[] = [
  { id: "all", label: "All Dates" },
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "this_week", label: "This Week" },
];

const AVAILABILITY_OPTIONS: { id: HangoutAvailabilityFilter; label: string }[] = [
  { id: "all", label: "All Statuses" },
  { id: "has_spots", label: "Has spots" },
  { id: "almost_full", label: "Almost full" },
];

export default function HangoutsPage() {
  const { user } = useAuth();

  const [hangouts, setHangouts] = React.useState<IHangout[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeDateTab, setActiveDateTab] = React.useState<HangoutDateFilter>("all");
  const [selectedActivity, setSelectedActivity] = React.useState<string>("All");
  const [selectedAvailability, setSelectedAvailability] =
    React.useState<HangoutAvailabilityFilter>("all");
  const [scope, setScope] = React.useState<"all" | "created" | "joined">("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Pagination
  const [nextCursor, setNextCursor] = React.useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch hangouts
  const fetchHangouts = React.useCallback(
    async (reset = true, cursor?: string) => {
      if (reset) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        const params = new URLSearchParams();
        if (selectedActivity !== "All") {
          params.set("activity", selectedActivity);
        }
        if (activeDateTab !== "all") {
          params.set("dateFilter", activeDateTab);
        }
        if (selectedAvailability !== "all") {
          params.set("availability", selectedAvailability);
        }
        if (scope !== "all") {
          params.set("scope", scope);
        }
        if (debouncedSearch.trim()) {
          params.set("search", debouncedSearch.trim());
        }
        if (cursor) {
          params.set("cursor", cursor);
        }
        params.set("limit", "18");

        const res = await fetch(`/api/hangouts?${params.toString()}`);
        const data = await res.json();

        if (res.ok && data.hangouts) {
          if (reset) {
            setHangouts(data.hangouts);
          } else {
            setHangouts((prev) => [...prev, ...data.hangouts]);
          }
          setHasMore(Boolean(data.hasMore));
          setNextCursor(data.nextCursor);
        }
      } catch (err) {
        console.error("Failed to load hangouts:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [selectedActivity, activeDateTab, selectedAvailability, scope, debouncedSearch]
  );

  // Fetch initial on filter/search change
  React.useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(async () => {
      if (!isMounted) return;
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedActivity !== "All") {
          params.set("activity", selectedActivity);
        }
        if (activeDateTab !== "all") {
          params.set("dateFilter", activeDateTab);
        }
        if (selectedAvailability !== "all") {
          params.set("availability", selectedAvailability);
        }
        if (scope !== "all") {
          params.set("scope", scope);
        }
        if (debouncedSearch.trim()) {
          params.set("search", debouncedSearch.trim());
        }
        params.set("limit", "18");

        const res = await fetch(`/api/hangouts?${params.toString()}`);
        const data = await res.json();

        if (isMounted && res.ok && data.hangouts) {
          setHangouts(data.hangouts);
          setHasMore(Boolean(data.hasMore));
          setNextCursor(data.nextCursor);
        }
      } catch (err) {
        console.error("Failed to fetch hangouts:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedActivity, activeDateTab, selectedAvailability, scope, debouncedSearch]);

  const handleHangoutCreated = (newHangout: IHangout) => {
    setHangouts((prev) => [newHangout, ...prev]);
  };

  const handleStatusChange = (updated: IHangout) => {
    setHangouts((prev) =>
      prev.map((h) => (h._id === updated._id ? updated : h))
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-campus-border/70">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-campus-accent" />
            <span className="text-xs uppercase font-bold tracking-widest text-campus-accent">
              Real-World Meetups
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-campus-charcoal">
            Campus Hangouts
          </h1>
          <p className="text-xs sm:text-sm text-campus-muted mt-1">
            Discover spontaneous activities happening across campus. See something, join in.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-auto shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4 mr-1" />
          <span>Host Hangout</span>
        </Button>
      </div>

      {/* Control Bar: Search & Scope Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="flex items-center gap-2.5 bg-white px-3.5 py-2.5 rounded-lg border border-campus-border shadow-2xs flex-1 max-w-md">
          <Search className="w-4 h-4 text-campus-muted shrink-0" />
          <input
            type="text"
            placeholder="Search activities, campus spots, or cricket..."
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

        {/* View Scope Switcher: All vs Created vs Joined */}
        {user && (
          <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-campus-border self-start md:self-auto text-xs font-medium">
            <button
              onClick={() => setScope("all")}
              className={cn(
                "px-3 py-1.5 rounded-md transition-all",
                scope === "all"
                  ? "bg-white text-campus-charcoal font-semibold shadow-2xs"
                  : "text-campus-muted hover:text-campus-charcoal"
              )}
            >
              All Hangouts
            </button>
            <button
              onClick={() => setScope("joined")}
              className={cn(
                "px-3 py-1.5 rounded-md transition-all",
                scope === "joined"
                  ? "bg-white text-campus-charcoal font-semibold shadow-2xs"
                  : "text-campus-muted hover:text-campus-charcoal"
              )}
            >
              You&apos;ve Joined
            </button>
            <button
              onClick={() => setScope("created")}
              className={cn(
                "px-3 py-1.5 rounded-md transition-all",
                scope === "created"
                  ? "bg-white text-campus-charcoal font-semibold shadow-2xs"
                  : "text-campus-muted hover:text-campus-charcoal"
              )}
            >
              Created by You
            </button>
          </div>
        )}
      </div>

      {/* Filter Toolbar: Date Tabs + Availability */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Date Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          {DATE_TABS.map((tab) => {
            const isActive = activeDateTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveDateTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-campus-charcoal text-white font-semibold shadow-2xs"
                    : "text-campus-muted hover:text-campus-charcoal hover:bg-stone-100"
                )}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Availability Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-campus-muted hidden sm:inline" />
          {AVAILABILITY_OPTIONS.map((opt) => {
            const isSelected = selectedAvailability === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedAvailability(opt.id)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-md border font-medium transition-colors",
                  isSelected
                    ? "bg-stone-200 border-campus-charcoal text-campus-charcoal font-semibold"
                    : "bg-white border-campus-border text-campus-muted hover:text-campus-charcoal"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity Filter Pills (Horizontal Scroll) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedActivity("All")}
          className={cn(
            "text-xs px-3 py-1.5 rounded-md font-medium whitespace-nowrap border transition-colors",
            selectedActivity === "All"
              ? "bg-campus-charcoal text-white border-campus-charcoal shadow-2xs"
              : "bg-white text-campus-body border-campus-border hover:bg-stone-50"
          )}
        >
          All Activities
        </button>
        {HANGOUT_ACTIVITIES.map((act) => {
          const isActive = selectedActivity === act;
          return (
            <button
              key={act}
              onClick={() => setSelectedActivity(act)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-md font-medium whitespace-nowrap border transition-colors",
                isActive
                  ? "bg-campus-charcoal text-white border-campus-charcoal shadow-2xs"
                  : "bg-white text-campus-body border-campus-border hover:bg-stone-50"
              )}
            >
              {act}
            </button>
          );
        })}
      </div>

      {/* Hangouts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-5 bg-white animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="w-20 h-5 bg-stone-200 rounded" />
                <div className="w-16 h-4 bg-stone-100 rounded" />
              </div>
              <div className="w-3/4 h-5 bg-stone-200 rounded" />
              <div className="w-full h-12 bg-stone-100 rounded" />
              <div className="w-full h-8 bg-stone-100 rounded" />
              <div className="flex justify-between items-center pt-3 border-t border-campus-border">
                <div className="w-24 h-6 bg-stone-200 rounded" />
                <div className="w-16 h-7 bg-stone-200 rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : hangouts.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {hangouts.map((hangout) => (
              <HangoutCard
                key={hangout._id}
                hangout={hangout}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchHangouts(false, nextCursor)}
                isLoading={isLoadingMore}
                className="text-xs px-6"
              >
                Load more hangouts
              </Button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title={
            scope === "joined"
              ? "You haven't joined any hangouts yet."
              : scope === "created"
              ? "You haven't hosted any hangouts yet."
              : selectedActivity !== "All"
              ? `No ${selectedActivity} hangouts happening right now.`
              : "No hangouts match your search."
          }
          description={
            scope === "joined"
              ? "Discover spontaneous meetups happening around campus and join in."
              : "Be the student who starts something. Casual chai, quick cricket games, or library study sprints."
          }
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>Host a Hangout</span>
            </Button>
          }
        />
      )}

      {/* Create Hangout Modal */}
      <CreateHangoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleHangoutCreated}
      />
    </div>
  );
}
