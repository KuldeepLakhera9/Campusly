"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Compass,
  Users2,
  MessageSquare,
  Bell,
  Plus,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export interface NavbarProps {
  onOpenCreateHangout?: () => void;
}

export function Navbar({ onOpenCreateHangout }: NavbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isAuthPage =
    pathname === "/login" || pathname === "/register" || pathname === "/onboarding";
  if (isAuthPage) return null;

  const primaryLinks = [
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/hangouts", label: "Hangouts", icon: Users2 },
    { href: "/messages", label: "Messages", icon: MessageSquare },
  ];

  const collegeName = user?.college?.name || "Campus Community";
  const moniker = user?.publicIdentity?.username || "Guest";
  const avatarId = user?.publicIdentity?.avatarId;
  const avatarColor = user?.publicIdentity?.avatarColor || "#C15438";

  return (
    <header className="sticky top-0 z-40 w-full bg-campus-bg/90 backdrop-blur-md border-b border-campus-border transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Campus Badge */}
        <div className="flex items-center gap-3">
          <Link href={user ? "/explore" : "/"} className="group flex items-baseline gap-2">
            <span className="font-serif text-2xl font-semibold tracking-tight text-campus-charcoal group-hover:text-campus-accent transition-colors">
              CAMPUSLY
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-campus-muted-bg text-campus-muted border border-campus-border text-[11px] font-medium tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="truncate max-w-[140px]">{collegeName}</span>
          </div>
        </div>

        {/* Desktop Primary Navigation */}
        <nav className="hidden md:flex items-center space-x-1" aria-label="Primary">
          {primaryLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 text-sm rounded-md transition-colors duration-150 font-medium",
                  isActive
                    ? "bg-white text-campus-charcoal border border-campus-border shadow-2xs font-semibold"
                    : "text-campus-body hover:text-campus-charcoal hover:bg-campus-muted-bg"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4",
                    isActive ? "text-campus-accent" : "text-campus-muted"
                  )}
                />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Secondary Navigation / Actions */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              {/* Quick Create Hangout Button */}
              <Button
                size="sm"
                variant="primary"
                onClick={onOpenCreateHangout}
                className="hidden sm:inline-flex"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Host Hangout</span>
              </Button>

              {/* Notifications */}
              <Link
                href="/notifications"
                className={cn(
                  "relative p-2 rounded-lg text-campus-body hover:text-campus-charcoal hover:bg-campus-muted-bg border border-transparent transition-colors",
                  pathname === "/notifications" &&
                    "bg-white border-campus-border text-campus-charcoal shadow-2xs"
                )}
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-campus-accent ring-2 ring-campus-bg" />
              </Link>

              {/* User Profile Pill */}
              <Link
                href="/profile"
                className={cn(
                  "flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg border transition-colors",
                  pathname === "/profile"
                    ? "bg-white border-campus-border shadow-2xs"
                    : "border-transparent hover:bg-campus-muted-bg"
                )}
              >
                <Avatar
                  moniker={moniker}
                  avatarId={avatarId}
                  color={avatarColor}
                  size="sm"
                />
                <div className="hidden lg:block text-left">
                  <span className="block text-xs font-semibold text-campus-charcoal leading-none truncate max-w-[120px]">
                    {moniker}
                  </span>
                  <span className="block text-[10px] text-campus-muted leading-tight mt-0.5">
                    Verified Student
                  </span>
                </div>
              </Link>

              {/* Quick Logout Button */}
              <button
                onClick={logout}
                className="p-2 text-campus-muted hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Join Campus
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
