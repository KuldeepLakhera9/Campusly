"use client";

import * as React from "react";
import {
  History,
  Search,
  RefreshCw,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/formatters";

interface AuditLogItem {
  id: string;
  actor: {
    pseudonym: string;
    role: string;
    email?: string;
  };
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = React.useState<AuditLogItem[]>([]);
  const [action, setAction] = React.useState("all");
  const [targetType, setTargetType] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchLogs = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({
        action,
        targetType,
        page: page.toString(),
        limit: "25",
      });
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load audit logs.");
      }

      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error querying audit logs.");
    } finally {
      setLoading(false);
    }
  }, [action, targetType, search, page]);

  React.useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) fetchLogs();
    });
    return () => {
      isMounted = false;
    };
  }, [fetchLogs]);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <History className="w-6 h-6 text-amber-400" />
            Compliance & Enforcement Audit Trail
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Tamper-proof record of all moderation, removal, suspension, and administrative actions.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
            Action Type
          </label>
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Actions</option>
            <option value="report_resolved">Report Resolved</option>
            <option value="report_dismissed">Report Dismissed</option>
            <option value="user_warned">User Warned</option>
            <option value="user_suspended">User Suspended</option>
            <option value="user_banned">User Banned</option>
            <option value="user_unbanned">User Unbanned</option>
            <option value="role_changed">Role Changed</option>
            <option value="post_removed">Post Removed</option>
            <option value="post_restored">Post Restored</option>
            <option value="comment_removed">Comment Removed</option>
            <option value="comment_restored">Comment Restored</option>
            <option value="hangout_removed">Hangout Removed</option>
            <option value="hangout_cancelled">Hangout Cancelled</option>
            <option value="hangout_restored">Hangout Restored</option>
          </select>
        </div>

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
            <option value="report">Reports</option>
            <option value="user">Users</option>
            <option value="post">Posts</option>
            <option value="comment">Comments</option>
            <option value="hangout">Hangouts</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
            Search Reason / Staff Actor
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search audit trail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  fetchLogs();
                }
              }}
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-3" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Audit Log Table */}
      <div className="rounded-xl bg-stone-900 border border-stone-800 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-stone-400 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
            <span>Loading immutable audit ledger...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-stone-500 text-xs">
            No audit records found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950/80 text-stone-400 uppercase tracking-wider text-[10px] border-b border-stone-800">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Staff Actor</th>
                  <th className="py-3 px-4">Target Type</th>
                  <th className="py-3 px-4">Target ID</th>
                  <th className="py-3 px-4">Reason & Details</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-850/60 transition-colors">
                    {/* Action */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          log.action.includes("ban") || log.action.includes("remove")
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : log.action.includes("suspend") || log.action.includes("cancel")
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            : log.action.includes("warn")
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : log.action.includes("resolved") || log.action.includes("restore")
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-stone-800 text-stone-300"
                        }`}
                      >
                        {log.action.replace("_", " ")}
                      </span>
                    </td>

                    {/* Actor */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-white block">
                          @{log.actor?.pseudonym || "Staff"}
                        </span>
                        <span className="text-[10px] text-stone-500 uppercase">
                          {log.actor?.role}
                        </span>
                      </div>
                    </td>

                    {/* Target Type */}
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase bg-stone-950 border border-stone-800 text-stone-300">
                        {log.targetType}
                      </span>
                    </td>

                    {/* Target ID */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-stone-400">
                      {log.targetId ? log.targetId.slice(0, 10) + "..." : "—"}
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-stone-300 line-clamp-2">
                        {log.reason || "No explicit reason specified."}
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="text-[10px] text-stone-500 truncate mt-0.5">
                          {JSON.stringify(log.metadata)}
                        </div>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="text-stone-300">
                        {new Date(log.createdAt).toLocaleDateString()}{" "}
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-[10px] text-stone-500">
                        {formatRelativeTime(log.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
