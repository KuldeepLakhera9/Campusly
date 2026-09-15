"use client";

import * as React from "react";
import {
  Calendar,
  Search,
  Trash2,
  XCircle,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface HangoutItem {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  scheduledFor: string;
  status: "open" | "filled" | "cancelled" | "completed";
  maxParticipants: number;
  participantCount: number;
  hostPseudonym: string;
  isDeleted: boolean;
  deletedAt?: string | null;
  deletionReason?: string | null;
  createdAt: string;
}

export default function AdminHangoutsPage() {
  const [hangouts, setHangouts] = React.useState<HangoutItem[]>([]);
  const [status, setStatus] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Action modal
  const [targetHangout, setTargetHangout] = React.useState<HangoutItem | null>(null);
  const [actionType, setActionType] = React.useState<"cancel" | "remove" | "restore">("cancel");
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const fetchHangouts = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({
        status,
        page: page.toString(),
        limit: "20",
      });
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const res = await fetch(`/api/admin/hangouts?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load hangouts.");
      }

      const data = await res.json();
      setHangouts(data.hangouts || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error querying hangouts.");
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  React.useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) fetchHangouts();
    });
    return () => {
      isMounted = false;
    };
  }, [fetchHangouts]);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetchHangouts();
  };

  const handleAction = async () => {
    if (!targetHangout) return;
    if (!reason.trim()) {
      setError("Please provide a reason for the hangout moderation action.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/hangouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hangoutId: targetHangout.id,
          action: actionType,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Action failed.");
      }

      setSuccess(data.message);
      setTargetHangout(null);
      setReason("");
      await fetchHangouts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to execute action.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-amber-400" />
            Campus Hangouts Moderation
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Cancel high-risk gatherings or remove policy-violating meetups.
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
      <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
            Status Filter
          </label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Hangouts</option>
            <option value="active">Active (Open)</option>
            <option value="cancelled">Cancelled</option>
            <option value="deleted">Soft-Removed</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
            Search Title / Location
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search hangouts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  fetchHangouts();
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

      {success && (
        <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Hangouts List */}
      <div className="rounded-xl bg-stone-900 border border-stone-800 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-stone-400 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
            <span>Loading hangouts...</span>
          </div>
        ) : hangouts.length === 0 ? (
          <div className="py-16 text-center text-stone-500 text-xs">
            No hangouts found matching query.
          </div>
        ) : (
          <div className="divide-y divide-stone-800">
            {hangouts.map((h) => (
              <div
                key={h.id}
                className="p-4 sm:p-5 hover:bg-stone-850/60 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white text-sm">
                      {h.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-300 uppercase">
                      {h.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        h.isDeleted
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : h.status === "cancelled"
                          ? "bg-stone-800 text-stone-400"
                          : "bg-emerald-500/15 text-emerald-400"
                      }`}
                    >
                      {h.isDeleted ? "Removed" : h.status}
                    </span>
                  </div>

                  <p className="text-stone-300 text-xs leading-relaxed line-clamp-2">
                    {h.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-stone-500 text-[11px] pt-1">
                    <span>Host: <strong className="text-stone-300">@{h.hostPseudonym}</strong></span>
                    <span>Location: <strong className="text-stone-300">{h.location}</strong></span>
                    <span>
                      Participants: {h.participantCount} / {h.maxParticipants}
                    </span>
                    <span>
                      Scheduled: {new Date(h.scheduledFor).toLocaleString()}
                    </span>
                  </div>

                  {h.isDeleted && h.deletionReason && (
                    <div className="p-2 rounded bg-red-950/40 border border-red-900/50 text-[11px] text-red-300 mt-1">
                      Reason: {h.deletionReason}
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {h.isDeleted ? (
                    <button
                      onClick={() => {
                        setTargetHangout(h);
                        setActionType("restore");
                        setReason("Reinstated by staff");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-emerald-400 text-xs font-medium border border-stone-700 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore
                    </button>
                  ) : (
                    <>
                      {h.status !== "cancelled" && (
                        <button
                          onClick={() => {
                            setTargetHangout(h);
                            setActionType("cancel");
                            setReason("");
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium border border-stone-700 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setTargetHangout(h);
                          setActionType("remove");
                          setReason("");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 text-xs font-medium border border-red-800 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </>
                  )}
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

      {/* Confirmation Dialog */}
      {targetHangout && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-stone-900 border border-stone-800 p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white capitalize">
              {actionType} Hangout
            </h2>

            <div className="space-y-1.5 text-xs">
              <label className="block text-stone-400">Reason for Audit Log</label>
              <input
                type="text"
                placeholder="e.g. Safety concern / unauthorized off-campus solicitation"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-200 placeholder-stone-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-800">
              <button
                onClick={() => setTargetHangout(null)}
                className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold disabled:opacity-50"
              >
                Confirm {actionType}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
