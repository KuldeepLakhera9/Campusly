"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  Users,
  FileText,
  Calendar,
  History,
  ArrowLeft,
  Shield,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AdminNavProps {
  userRole: string;
  userPseudonym: string;
}

export function AdminNav({ userRole, userPseudonym }: AdminNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/admin",
      label: "Overview",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: "/admin/reports",
      label: "Reports Queue",
      icon: ShieldAlert,
    },
    {
      href: "/admin/users",
      label: "Users & Safety",
      icon: Users,
    },
    {
      href: "/admin/content",
      label: "Content Moderation",
      icon: FileText,
    },
    {
      href: "/admin/hangouts",
      label: "Hangouts Moderation",
      icon: Calendar,
    },
    {
      href: "/admin/audit-logs",
      label: "Audit Trail",
      icon: History,
    },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0 bg-stone-900 text-stone-200 border-b lg:border-b-0 lg:border-r border-stone-800 flex flex-col justify-between p-4 lg:min-h-screen">
      <div>
        {/* Header Branding */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-white uppercase">
                Campusly Ops
              </div>
              <div className="text-[11px] text-stone-400">Trust & Safety Portal</div>
            </div>
          </div>
          <span
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
              userRole === "admin"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
            )}
          >
            {userRole}
          </span>
        </div>

        {/* Staff Identity Pill */}
        <div className="mt-3 px-3 py-2 rounded-lg bg-stone-800/60 border border-stone-700/60 text-xs text-stone-300 flex items-center justify-between">
          <span className="truncate max-w-[140px] font-medium">@{userPseudonym}</span>
          <span className="text-[10px] text-stone-400">Active Staff</span>
        </div>

        {/* Navigation links */}
        <nav className="mt-6 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150",
                  isActive
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs font-semibold"
                    : "text-stone-400 hover:text-white hover:bg-stone-800/60"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4",
                    isActive ? "text-amber-400" : "text-stone-500"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Exit Back to App */}
      <div className="pt-4 mt-6 border-t border-stone-800 flex flex-col gap-2">
        <Link
          href="/explore"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Campus
          </span>
          <ExternalLink className="w-3 h-3 text-stone-600" />
        </Link>
      </div>
    </aside>
  );
}
