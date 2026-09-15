"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/formatters";

interface ReportItem {
  id: string;
  targetId: string;
  targetType: string;
  reason: string;
  details?: string;
  status: string;
  priority: string;
  createdAt: string;
  reporter?: {
    pseudonym?: string;
    collegeName?: string;
  } | null;
  reviewedBy?: {
    pseudonym?: string;
  } | null;
  reviewedAt?: string | null;
  resolutionReason?: string | null;
  targetSummary?: {
    title?: string;
    contentSnippet?: string;
    authorPseudonym?: string;
    isDeleted?: boolean;
  };
}

export default function AdminReportsPage() {
  const [reports, setReports] = React.useState<ReportItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filter states
  const [status, setStatus] = React.useState("pending");
  const [priority, setPriority] = React.useState("all");
  const [targetType, setTargetType] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  const fetchReports = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({
        status,
        priority,
        targetType,
        page: page.toString(),
        limit: "20",
      });
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load reports.");
      }

      const data = await res.json();
      setReports(data.reports || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error querying reports.");
    } finally {
      setLoading(false);
    }
  }, [status, priority, targetType, search, page]);

  React.useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) fetchReports();
    });
    return () => {
      isMounted = false;
    };
  }, [fetchReports]);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetchReports();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            Safety & Moderation Queue
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Review user-flagged content, investigate guideline infractions, and enforce policy.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Status */}
        <div>
          <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
            Report Status
          </label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          >
            <option value="pending">Pending Review</option>
            <option value="reviewing">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
            <option value="all">All Statuses</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
            Priority / Severity
          </label>
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Target Type */}
        <div>
          <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
            Target Surface
          </label>
          <select
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Targets</option>
            <option value="post">Posts</option>
            <option value="comment">Comments</option>
            <option value="message">Private Messages</option>
            <option value="hangout">Hangouts</option>
            <option value="user">User Profiles</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
            Search Reason / Details
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  fetchReports();
                }
              }}
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-3" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Reports List */}
      <div className="rounded-xl bg-stone-900 border border-stone-800 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-stone-400 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
            <span>Loading moderation items...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-stone-500 text-xs flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/60" />
            <span>No reports found matching criteria.</span>
          </div>
        ) : (
          <div className="divide-y divide-stone-800/80">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 sm:p-5 hover:bg-stone-850/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Priority badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        report.priority === "critical"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : report.priority === "high"
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : report.priority === "medium"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-stone-800 text-stone-400 border border-stone-700"
                      }`}
                    >
                      {report.priority}
                    </span>

                    {/* Target Type */}
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase bg-stone-800 text-stone-300 border border-stone-700">
                      {report.targetType}
                    </span>

                    {/* Status badge */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                        report.status === "pending"
                          ? "bg-amber-500/10 text-amber-300"
                          : report.status === "resolved"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : report.status === "dismissed"
                          ? "bg-stone-800 text-stone-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      {report.status}
                    </span>

                    <span className="text-xs text-stone-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(report.createdAt)}
                    </span>
                  </div>

                  {/* Reason & Content snippet */}
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      {report.reason}
                    </h2>
                    {report.details && (
                      <p className="text-xs text-stone-400 mt-1">
                        &ldquo;{report.details}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Target Preview */}
                  {report.targetSummary && (
                    <div className="mt-2 p-2.5 rounded-lg bg-stone-950/70 border border-stone-800 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                        <span>
                          Target:{" "}
                          <strong className="text-stone-300">
                            {report.targetSummary.authorPseudonym || "Unknown Author"}
                          </strong>
                        </span>
                        {report.targetSummary.isDeleted && (
                          <span className="text-red-400 font-medium">Already Removed</span>
                        )}
                      </div>
                      {report.targetSummary.title && (
                        <div className="font-medium text-stone-200 mb-0.5">
                          {report.targetSummary.title}
                        </div>
                      )}
                      {report.targetSummary.contentSnippet && (
                        <p className="text-stone-400 line-clamp-2">
                          {report.targetSummary.contentSnippet}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Reporter context */}
                  <div className="text-[11px] text-stone-500">
                    Reported by:{" "}
                    <span className="text-stone-400 font-medium">
                      @{report.reporter?.pseudonym || "Anonymous Reporter"}
                    </span>{" "}
                    ({report.reporter?.collegeName || "Campus Member"})
                  </div>
                </div>

                {/* Action CTA */}
                <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-800">
                  <Link
                    href={`/admin/reports/${report.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold transition-colors shadow-xs"
                  >
                    <span>Investigate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
