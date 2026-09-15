"use client";

import * as React from "react";
import Link from "next/link";
import { IPersonMatch, PeopleSortOption, CAMPUS_INTENTS_LIST } from "@/types/people";
import { CAMPUS_INTERESTS_LIST } from "@/lib/validations/auth";
import { PersonCard } from "@/components/people/person-card";
import { PublicProfileModal } from "@/components/profile/public-profile-modal";
import { Button } from "@/components/ui/button";
import {
  Search,
  SlidersHorizontal,
  Users,
  Sparkles,
  RefreshCw,
  AlertCircle,
  EyeOff,
  Filter,
  X,
} from "lucide-react";

export default function PeoplePage() {
  const [people, setPeople] = React.useState<IPersonMatch[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pagination, setPagination] = React.useState({
    total: 0,
    page: 1,
    limit: 18,
    hasMore: false,
  });

  // Filters State
  const [search, setSearch] = React.useState("");
  const [selectedIntent, setSelectedIntent] = React.useState<string>("Anything");
  const [selectedInterest, setSelectedInterest] = React.useState<string>("");
  const [minShared, setMinShared] = React.useState<number | undefined>(undefined);
  const [sort, setSort] = React.useState<PeopleSortOption>("recommended");
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  // Status flags from API
  const [discoveryEnabled, setDiscoveryEnabled] = React.useState<boolean>(true);
  const [userInterestsCount, setUserInterestsCount] = React.useState<number>(0);

  // Modal State
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);

  // Fetch matches from API
  const fetchPeople = React.useCallback(
    async (pageToLoad = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (selectedInterest) params.set("interest", selectedInterest);
        if (selectedIntent && selectedIntent !== "Anything") {
          params.set("intent", selectedIntent);
        }
        if (minShared) params.set("minShared", minShared.toString());
        params.set("sort", sort);
        params.set("page", pageToLoad.toString());
        params.set("limit", "18");

        const res = await fetch(`/api/people?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to find campus peers.");
        }

        if (pageToLoad === 1) {
          setPeople(data.people || []);
        } else {
          setPeople((prev) => [...prev, ...(data.people || [])]);
        }

        setPagination(data.pagination || { total: 0, page: 1, limit: 18, hasMore: false });
        if (typeof data.currentUserDiscoveryEnabled === "boolean") {
          setDiscoveryEnabled(data.currentUserDiscoveryEnabled);
        }
        if (typeof data.currentUserInterestsCount === "number") {
          setUserInterestsCount(data.currentUserInterestsCount);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error finding people.");
      } finally {
        setIsLoading(false);
      }
    },
    [search, selectedInterest, selectedIntent, minShared, sort]
  );

  // Fetch when filters change
  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchPeople(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchPeople]);

  const handleClearFilters = () => {
    setSearch("");
    setSelectedIntent("Anything");
    setSelectedInterest("");
    setMinShared(undefined);
    setSort("recommended");
  };

  const handleEnableDiscovery = async () => {
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privacySettings: { appearInFindPeople: true },
        }),
      });
      if (res.ok) {
        setDiscoveryEnabled(true);
        fetchPeople(1);
      }
    } catch (err) {
      console.error("Failed to enable discovery:", err);
    }
  };

  const hasActiveFilters =
    Boolean(search) ||
    (selectedIntent !== "Anything" && Boolean(selectedIntent)) ||
    Boolean(selectedInterest) ||
    Boolean(minShared);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-campus-border/70 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-campus-accent/10 text-campus-accent">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-campus-muted">
              Campus Matching
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-campus-charcoal">
            Find People
          </h1>
          <p className="text-sm text-campus-muted mt-1 max-w-xl">
            Discover verified campus peers who share your interests, study habits,
            and project goals.
          </p>
        </div>

        {/* Discovery Opt-out Notice / Toggle */}
        {!discoveryEnabled && (
          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-2 rounded-xl text-xs self-start sm:self-auto">
            <EyeOff className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <span className="font-semibold block">You are currently hidden</span>
              <span className="text-[11px] text-amber-800">
                You won&apos;t appear in peers&apos; recommendations.
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnableDiscovery}
              className="ml-2 bg-white text-xs text-amber-900 border-amber-300 hover:bg-amber-100"
            >
              Turn On
            </Button>
          </div>
        )}
      </div>

      {/* Suggestion prompt if current user has not added interests */}
      {userInterestsCount < 3 && (
        <div className="p-4 rounded-xl bg-stone-100/90 border border-stone-300/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-campus-accent shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-campus-charcoal">
                Add more interests for higher matching accuracy
              </h4>
              <p className="text-xs text-campus-muted mt-0.5">
                Campusly matches work best when you choose at least 3 campus interests.
              </p>
            </div>
          </div>
          <Link href="/profile">
            <Button variant="outline" size="sm" className="text-xs shrink-0">
              Update Interests
            </Button>
          </Link>
        </div>
      )}

      {/* Main Controls Section: Search + Intent Filter + Mobile Toggle */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-campus-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by pseudonym, interest, or bio..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-campus-border bg-white text-sm text-campus-charcoal placeholder:text-campus-muted focus:outline-none focus:ring-2 focus:ring-campus-accent/20 focus:border-campus-accent transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-campus-muted hover:text-campus-charcoal p-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Looking For Dropdown */}
          <div className="w-full sm:w-56 shrink-0">
            <label className="sr-only">Looking For</label>
            <select
              value={selectedIntent}
              onChange={(e) => setSelectedIntent(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-campus-border bg-white text-sm text-campus-charcoal focus:outline-none focus:ring-2 focus:ring-campus-accent/20 focus:border-campus-accent"
            >
              <option value="Anything">Looking for: Anything</option>
              {CAMPUS_INTENTS_LIST.filter((i) => i !== "Anything").map((intent) => (
                <option key={intent} value={intent}>
                  Looking for: {intent}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Switcher */}
          <div className="w-full sm:w-44 shrink-0">
            <label className="sr-only">Sort By</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as PeopleSortOption)}
              className="w-full px-3 py-2.5 rounded-lg border border-campus-border bg-white text-sm text-campus-charcoal focus:outline-none focus:ring-2 focus:ring-campus-accent/20 focus:border-campus-accent"
            >
              <option value="recommended">Recommended</option>
              <option value="shared">Most Shared</option>
              <option value="active">Recently Active</option>
              <option value="newest">Newest Members</option>
            </select>
          </div>

          {/* Mobile Filter Toggle */}
          <Button
            variant="outline"
            size="md"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="sm:hidden w-full flex items-center justify-center gap-2 text-xs"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{showMobileFilters ? "Hide Filters" : "Filter by Interests"}</span>
          </Button>
        </div>

        {/* Interests & Shared Overlap Pills (Desktop always, Mobile collapsible) */}
        <div
          className={`${
            showMobileFilters ? "block" : "hidden"
          } sm:block p-4 rounded-xl bg-white border border-campus-border space-y-3.5`}
        >
          {/* Filter by Specific Campus Interest */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-campus-muted">
                Filter by Campus Interest
              </span>
              {selectedInterest && (
                <button
                  type="button"
                  onClick={() => setSelectedInterest("")}
                  className="text-xs text-campus-accent hover:underline font-medium"
                >
                  Clear Interest
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {CAMPUS_INTERESTS_LIST.map((interest) => {
                const isSelected = selectedInterest === interest;
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() =>
                      setSelectedInterest(isSelected ? "" : interest)
                    }
                    className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all ${
                      isSelected
                        ? "bg-campus-accent text-white border-campus-accent shadow-2xs"
                        : "bg-campus-bg text-campus-body border-campus-border hover:bg-white hover:text-campus-charcoal"
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shared Interests Threshold */}
          <div className="flex items-center justify-between pt-3 border-t border-campus-border/60 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-campus-charcoal">
                Shared Overlap:
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  { label: "All", value: undefined },
                  { label: "≥ 1 common", value: 1 },
                  { label: "≥ 2 common", value: 2 },
                  { label: "≥ 3 common", value: 3 },
                ].map((opt) => {
                  const isActive = minShared === opt.value;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setMinShared(opt.value)}
                      className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-colors ${
                        isActive
                          ? "bg-campus-charcoal text-white border-campus-charcoal font-semibold"
                          : "bg-campus-bg text-campus-muted border-campus-border hover:bg-white hover:text-campus-charcoal"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs text-campus-muted hover:text-campus-charcoal"
              >
                Reset All Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-campus-muted pt-2">
        <span>
          {isLoading && people.length === 0
            ? "Finding people on campus..."
            : `${pagination.total} ${
                pagination.total === 1 ? "student match" : "student matches"
              } found`}
        </span>
        {sort === "recommended" && (
          <span className="flex items-center gap-1 text-[11px] text-campus-muted">
            <Sparkles className="w-3 h-3 text-campus-accent" />
            Ranked by interest &amp; activity compatibility
          </span>
        )}
      </div>

      {/* People Grid / States */}
      {isLoading && people.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 py-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl border border-campus-border bg-white animate-pulse space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-stone-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-stone-200 rounded w-28" />
                  <div className="h-3 bg-stone-100 rounded w-20" />
                </div>
                <div className="h-6 bg-stone-200 rounded-full w-16" />
              </div>
              <div className="h-12 bg-stone-100 rounded" />
              <div className="flex gap-1.5">
                <div className="h-5 bg-stone-200 rounded w-14" />
                <div className="h-5 bg-stone-200 rounded w-16" />
                <div className="h-5 bg-stone-200 rounded w-12" />
              </div>
              <div className="flex gap-2 pt-2 border-t border-stone-100">
                <div className="h-8 bg-stone-200 rounded flex-1" />
                <div className="h-8 bg-stone-200 rounded flex-1" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-12 text-center bg-white rounded-xl border border-campus-border p-6 space-y-3">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
          <p className="text-sm text-campus-charcoal font-semibold">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchPeople(1)}>
            Try Again
          </Button>
        </div>
      ) : people.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-campus-border p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-campus-bg border border-campus-border flex items-center justify-center mx-auto text-campus-muted">
            <Filter className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-campus-charcoal">
            No one matched those filters
          </h3>
          <p className="text-xs sm:text-sm text-campus-muted max-w-sm mx-auto">
            Try broadening your search keywords, clearing intent preferences, or
            resetting the shared overlap filter.
          </p>
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear All Filters
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {people.map((match) => (
              <PersonCard
                key={match.user.id}
                match={match}
                onViewProfile={(userId) => setSelectedUserId(userId)}
              />
            ))}
          </div>

          {/* Load More / Pagination */}
          {pagination.hasMore && (
            <div className="pt-4 text-center">
              <Button
                variant="outline"
                size="md"
                onClick={() => fetchPeople(pagination.page + 1)}
                disabled={isLoading}
                className="px-6"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading more matches...</span>
                  </>
                ) : (
                  <span>Load More Students</span>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Public Profile Modal */}
      <PublicProfileModal
        userId={selectedUserId}
        isOpen={Boolean(selectedUserId)}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}
