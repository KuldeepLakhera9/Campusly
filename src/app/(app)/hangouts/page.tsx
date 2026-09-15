"use client";

import * as React from "react";
import { IHangout, HangoutCategory } from "@/types/hangout";
import { MOCK_HANGOUTS } from "@/lib/data/mock-data";
import { HangoutCard } from "@/components/hangouts/hangout-card";
import { CreateHangoutModal } from "@/components/hangouts/create-hangout-modal";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus } from "lucide-react";

const CATEGORIES: ("All" | HangoutCategory)[] = [
  "All",
  "Study",
  "Food & Drink",
  "Campus Walk",
  "Sports & Fitness",
  "Creative",
  "Late Night",
];

export default function HangoutsPage() {
  const [hangouts, setHangouts] = React.useState<IHangout[]>(MOCK_HANGOUTS);
  const [activeTab, setActiveTab] = React.useState("now");
  const [selectedCategory, setSelectedCategory] = React.useState<"All" | HangoutCategory>("All");
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const filteredHangouts = hangouts.filter((h) => {
    const matchesCategory =
      selectedCategory === "All" || h.category === selectedCategory;
    return matchesCategory;
  });

  const handleHangoutCreated = () => {
    // Phase 1 preview
    const newHangout: IHangout = {
      _id: `hangout-${Date.now()}`,
      title: "Quick Coffee & Problem Set Sprint",
      description: "Working on problem set for 45 mins. Grab a table with me.",
      category: "Study",
      campus: "UC Berkeley",
      locationSpot: "FSM Cafe Outdoor Tables",
      scheduledTime: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 90),
      maxParticipants: 4,
      hostPseudonym: "Library Fox",
      hostAvatarColor: "#C15438",
      participants: [
        {
          pseudonym: "Library Fox",
          avatarColor: "#C15438",
          joinedAt: new Date(),
        },
      ],
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setHangouts([newHangout, ...hangouts]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-campus-border/70">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-campus-charcoal">
            Spontaneous Hangouts
          </h1>
          <p className="text-xs sm:text-sm text-campus-muted mt-1">
            Real-world activities happening now. No RSVPs three weeks in advance. Just show up.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Host Hangout</span>
        </Button>
      </div>

      {/* Tabs & Filters */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          tabs={[
            { id: "now", label: "Happening Now", count: filteredHangouts.length },
            { id: "today", label: "Later Today", count: 2 },
            { id: "weekend", label: "This Weekend", count: 1 },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium whitespace-nowrap border transition-colors ${
                  isActive
                    ? "bg-campus-accent text-white border-campus-accent"
                    : "bg-white text-campus-body border-campus-border hover:bg-stone-50"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hangouts Grid */}
      {filteredHangouts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {filteredHangouts.map((hangout) => (
            <HangoutCard key={hangout._id} hangout={hangout} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No hangouts in this category right now"
          description="Be the first to create an impromptu meetup. Study sprints, coffee runs, or campus walks."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
            >
              Host a Spontaneous Hangout
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
