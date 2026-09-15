"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Users, Users2, MessageSquare, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface MobileNavProps {
  onOpenCreateHangout?: () => void;
}

export function MobileNav({ onOpenCreateHangout }: MobileNavProps) {
  const pathname = usePathname();

  const isAuthPage = pathname === "/login" || pathname === "/register";
  if (isAuthPage) return null;

  const items = [
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/people", label: "People", icon: Users },
    {
      isAction: true,
      label: "Host",
      action: onOpenCreateHangout,
    },
    { href: "/hangouts", label: "Hangouts", icon: Users2 },
    { href: "/messages", label: "Messages", icon: MessageSquare },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-campus-border px-3 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-lg shadow-black/5"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          if (item.isAction) {
            return (
              <button
                key="create-action"
                onClick={item.action}
                className="flex flex-col items-center justify-center -mt-5 focus:outline-none group"
                aria-label="Host spontaneous hangout"
              >
                <div className="w-12 h-12 rounded-full bg-campus-accent text-white flex items-center justify-center shadow-md shadow-campus-accent/25 border-2 border-white group-active:scale-95 transition-transform">
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-semibold text-campus-accent mt-0.5 tracking-tight">
                  Host
                </span>
              </button>
            );
          }

          const isActive = pathname.startsWith(item.href!);
          const Icon = item.icon!;

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors min-w-[56px]",
                isActive
                  ? "text-campus-accent"
                  : "text-campus-muted hover:text-campus-charcoal"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.2]" : "stroke-[1.8]")} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-campus-accent" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] tracking-tight mt-1",
                  isActive ? "font-bold text-campus-charcoal" : "font-medium"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
