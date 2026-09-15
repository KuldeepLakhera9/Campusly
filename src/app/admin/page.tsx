"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  CheckCircle2,
  UserX,
  FileWarning,
  History,
  ArrowRight,
  RefreshCw,
  Clock,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/formatters";

interface MetricsData {
  pendingReports: number;
  resolvedReports: number;
  totalReports: number;
  criticalReports: number;
  suspendedUsers: number;
  bannedUsers: number;
  totalUsers: number;
  removedPosts: number;
  removedComments: number;
  removedHangouts: number;
  recentAuditLogsCount: number;
  priorityBreakdown: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  targetTypeBreakdown: {
    post: number;
    comment: number;
    message: number;
    user: number;
    hangout: number;
  };
}

interface QuickReport {
  id: string;
  targetType: string;
  reason: string;
  priority: string;
  createdAt: string;
  targetSummary?: {
    contentSnippet?: string;
    authorPseudonym?: string;
  };
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = React.useState<MetricsData | null>(null);
  const [quickReports, setQuickReports] = React.useState<QuickReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchOverviewData = React.useCallback(async () => {
    try {
      const [mRes, rRes] = await Promise.all([
        fetch("/api/admin/metrics"),
        fetch("/api/admin/reports?status=pending&limit=5"),
      ]);

      if (!mRes.ok || !rRes.ok) {
        throw new Error("Failed to load operational metrics.");
      }

      const mData = await mRes.json();
      const rData = await rRes.json();

      setMetrics(mData.metrics);
      setQuickReports(rData.reports || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) fetchOverviewData();
    });
    return () => {
      isMounted = false;
    };
  }, [fetchOverviewData]);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetchOverviewData();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Trust & Safety Overview
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Real-time platform health, moderation queue & enforcement telemetry.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Reports */}
        <div className="p-5 rounded-xl bg-stone-900 border border-stone-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
              Pending Reports
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">
              {metrics ? metrics.pendingReports : "—"}
            </span>
            {metrics && metrics.criticalReports > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                {metrics.criticalReports} Critical
              </span>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-stone-800/80 text-[11px] text-stone-400">
            {metrics ? `${metrics.resolvedReports} resolved all-time` : "Loading..."}
          </div>
        </div>

        {/* User Enforcement */}
        <div className="p-5 rounded-xl bg-stone-900 border border-stone-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
              Restricted Users
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">
              {metrics ? metrics.suspendedUsers + metrics.bannedUsers : "—"}
            </span>
            <div className="text-xs text-stone-400 space-x-1.5">
              <span className="text-amber-400">{metrics?.suspendedUsers ?? 0} susp</span>
              <span>•</span>
              <span className="text-red-400">{metrics?.bannedUsers ?? 0} ban</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-800/80 text-[11px] text-stone-400">
            Across {metrics ? metrics.totalUsers : "—"} verified students
          </div>
        </div>

        {/* Content Removals */}
        <div className="p-5 rounded-xl bg-stone-900 border border-stone-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
              Removed Content
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <FileWarning className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">
              {metrics
                ? metrics.removedPosts + metrics.removedComments + metrics.removedHangouts
                : "—"}
            </span>
            <span className="text-xs text-stone-400">
              {metrics?.removedPosts ?? 0} posts • {metrics?.removedComments ?? 0} cmts
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-800/80 text-[11px] text-stone-400">
            {metrics?.removedHangouts ?? 0} cancelled hangouts
          </div>
        </div>

        {/* Audit Activity */}
        <div className="p-5 rounded-xl bg-stone-900 border border-stone-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
              Staff Actions (24h)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">
              {metrics ? metrics.recentAuditLogsCount : "—"}
            </span>
            <span className="text-xs text-emerald-400 font-medium">Logged & Audited</span>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-800/80 text-[11px] text-stone-400">
            Immutable blockchain-style ledger
          </div>
        </div>
      </div>

      {/* Breakdown Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports by Priority */}
        <div className="p-5 rounded-xl bg-stone-900 border border-stone-800">
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
            Pending Reports by Severity
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Prioritized by threat level and user safety impact
          </p>

          <div className="mt-5 space-y-3">
            {[
              {
                label: "Critical (Self-harm / Violence / Immediate)",
                key: "critical",
                count: metrics?.priorityBreakdown.critical ?? 0,
                color: "bg-red-500",
                text: "text-red-400",
              },
              {
                label: "High (Harassment / Hate / Doxxing)",
                key: "high",
                count: metrics?.priorityBreakdown.high ?? 0,
                color: "bg-orange-500",
                text: "text-orange-400",
              },
              {
                label: "Medium (Inappropriate / Guideline Breaches)",
                key: "medium",
                count: metrics?.priorityBreakdown.medium ?? 0,
                color: "bg-amber-500",
                text: "text-amber-400",
              },
              {
                label: "Low (Spam / Off-topic)",
                key: "low",
                count: metrics?.priorityBreakdown.low ?? 0,
                color: "bg-stone-500",
                text: "text-stone-400",
              },
            ].map((p) => {
              const total = metrics?.pendingReports || 1;
              const pct = Math.round((p.count / total) * 100);
              return (
                <div key={p.key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-300 font-medium">{p.label}</span>
                    <span className={`font-semibold ${p.text}`}>{p.count}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-stone-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${p.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reports by Target Category */}
        <div className="p-5 rounded-xl bg-stone-900 border border-stone-800">
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
            Reports by Target Entity
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Distribution across Campusly surfaces
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              {
                type: "Campus Posts",
                count: metrics?.targetTypeBreakdown.post ?? 0,
              },
              {
                type: "Comments",
                count: metrics?.targetTypeBreakdown.comment ?? 0,
              },
              {
                type: "Private Messages",
                count: metrics?.targetTypeBreakdown.message ?? 0,
              },
              {
                type: "Hangout Events",
                count: metrics?.targetTypeBreakdown.hangout ?? 0,
              },
              {
                type: "User Profiles",
                count: metrics?.targetTypeBreakdown.user ?? 0,
              },
            ].map((t) => (
              <div
                key={t.type}
                className="p-3 rounded-lg bg-stone-950/60 border border-stone-800 flex flex-col justify-between"
              >
                <span className="text-xs text-stone-400">{t.type}</span>
                <span className="text-lg font-bold text-white mt-1">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Pending Reports Table Preview */}
      <div className="p-5 rounded-xl bg-stone-900 border border-stone-800">
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
              Urgent Reports Requiring Review
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Earliest unhandled reports submitted by campus students
            </p>
          </div>
          <Link
            href="/admin/reports"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1.5 transition-colors"
          >
            Full Queue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="mt-4">
          {quickReports.length === 0 ? (
            <div className="py-8 text-center text-stone-500 text-xs flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/60" />
              <span>Moderation queue is clean. No pending reports require review.</span>
            </div>
          ) : (
            <div className="divide-y divide-stone-800/60">
              {quickReports.map((r) => (
                <div
                  key={r.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          r.priority === "critical"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : r.priority === "high"
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {r.priority}
                      </span>
                      <span className="text-xs font-medium text-stone-300">
                        {r.reason}
                      </span>
                      <span className="text-[11px] text-stone-500 uppercase tracking-wider">
                        • {r.targetType}
                      </span>
                    </div>

                    {r.targetSummary?.contentSnippet && (
                      <p className="text-xs text-stone-400 italic line-clamp-1">
                        &ldquo;{r.targetSummary.contentSnippet}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-stone-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(r.createdAt)}
                    </span>
                    <Link
                      href={`/admin/reports/${r.id}`}
                      className="px-2.5 py-1 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
