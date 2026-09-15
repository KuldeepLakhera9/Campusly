"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Bell,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: "hangout_join" | "reply" | "spark" | "system";
  title: string;
  description: string;
  time: string;
  unread: boolean;
  actorMoniker?: string;
  actorAvatarColor?: string;
  linkHref?: string;
}

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "hangout_join",
    title: "Cedar Fox joined your hangout",
    description: "Deep Work Sprint (Pomodoro 50/10) at East Asian Library.",
    time: "10m ago",
    unread: true,
    actorMoniker: "Cedar Fox",
    actorAvatarColor: "#C15438",
    linkHref: "/hangouts",
  },
  {
    id: "notif-2",
    type: "reply",
    title: "New reply on your thought in Academics",
    description: "Velvet Architect: 'Doe Library 2nd floor hits different at 11 PM.'",
    time: "45m ago",
    unread: true,
    actorMoniker: "Velvet Architect",
    actorAvatarColor: "#244837",
    linkHref: "/explore",
  },
  {
    id: "notif-3",
    type: "spark",
    title: "+5 Campus Sparks awarded",
    description: "A student found your course review note for Econ 100B helpful.",
    time: "3h ago",
    unread: false,
    actorMoniker: "Campusly",
    actorAvatarColor: "#C15438",
    linkHref: "/profile",
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] =
    React.useState<NotificationItem[]>(NOTIFICATIONS);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-campus-border/70">
        <div>
          <h1 className="font-serif text-2xl font-medium text-campus-charcoal flex items-center gap-2">
            <Bell className="w-5 h-5 text-campus-accent" />
            <span>Campus Activity</span>
          </h1>
          <p className="text-xs text-campus-muted mt-0.5">
            Real-time updates on your hangouts, replies, and spark points.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((notif) => (
          <Card
            key={notif.id}
            className={`p-4 transition-all ${
              notif.unread
                ? "bg-white border-l-3 border-l-campus-accent shadow-2xs"
                : "bg-white/80 opacity-80"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {notif.actorMoniker ? (
                  <Avatar
                    moniker={notif.actorMoniker}
                    color={notif.actorAvatarColor}
                    size="sm"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center text-stone-600">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div>
                  <div className="text-xs font-bold text-campus-charcoal">
                    {notif.title}
                  </div>
                  <p className="text-xs text-campus-muted mt-0.5 leading-relaxed">
                    {notif.description}
                  </p>
                  <span className="text-[10px] text-campus-subtle mt-1.5 block">
                    {notif.time}
                  </span>
                </div>
              </div>

              {notif.linkHref && (
                <Link href={notif.linkHref}>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
