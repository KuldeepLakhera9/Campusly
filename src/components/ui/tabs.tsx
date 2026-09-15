"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 border-b border-campus-border overflow-x-auto no-scrollbar",
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 border-b-2 -mb-px whitespace-nowrap flex items-center gap-2",
              isActive
                ? "border-campus-accent text-campus-accent font-semibold"
                : "border-transparent text-campus-muted hover:text-campus-charcoal hover:border-campus-border-strong"
            )}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded",
                  isActive
                    ? "bg-campus-accent-soft text-campus-accent font-semibold"
                    : "bg-campus-muted-bg text-campus-muted"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

