"use client";

import * as React from "react";
import {
  FileText,
  Search,
  Trash2,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/formatters";

interface ContentItem {
  id: string;
  postId?: string;
  title?: string;
  content: string;
  authorPseudonym: string;
  channel?: string;
  reactionCount?: number;
  commentCount?: number;
  reportCount?: number;
  isDeleted: boolean;
  deletedAt?: string | null;
  deletionReason?: string | null;
  deletedBy?: { pseudonym: string } | null;
  createdAt: string;
}

export default function AdminContentPage() {
  const [contentType, setContentType] = React.useState<"post" | "comment">("post");
  const [status, setStatus] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [items, setItems] = React.useState<ContentItem[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Modal for action reason
  const [targetItem, setTargetItem] = React.useState<ContentItem | null>(null);
  const [actionType, setActionType] = React.useState<"remove" | "restore">("remove");
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const fetchContent = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({
        type: contentType,
        status,
        page: page.toString(),
        limit: "20",
      });
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const res = await fetch(`/api/admin/content?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load content items.");
      }

      const data = await res.json();
      setItems(data.items || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error querying content.");
    } finally {
      setLoading(false);
    }
  }, [contentType, status, search, page]);

  React.useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) fetchContent();
    });
    return () => {
      isMounted = false;
    };
  }, [fetchContent]);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetchContent();
  };

  const handleAction = async () => {
    if (!targetItem) return;
    if (!reason.trim()) {
      setError("Please specify a reason for this content action.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: targetItem.id,
          type: contentType,
          action: actionType,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Action failed.");
      }

      setSuccess(data.message);
      setTargetItem(null);
      setReason("");
      await fetchContent();
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
            <FileText className="w-6 h-6 text-amber-400" />
            Campus Feed & Comment Moderation
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Soft-remove inappropriate posts or comments without destroying audit trail.
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

      {/* Surface Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
        <button
          onClick={() => {
            setContentType("post");
            setPage(1);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            contentType === "post"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : "text-stone-400 hover:text-white hover:bg-stone-900"
          }`}
        >
          Campus Posts
        </button>
        <button
          onClick={() => {
            setContentType("comment");
            setPage(1);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            contentType === "comment"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : "text-stone-400 hover:text-white hover:bg-stone-900"
          }`}
        >
          Post Comments
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
            Content Status
          </label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Content</option>
            <option value="active">Active in Feed</option>
            <option value="deleted">Soft-Removed</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
            Search Content Text
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search words..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  fetchContent();
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

      {/* Content Items List */}
      <div className="rounded-xl bg-stone-900 border border-stone-800 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-stone-400 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
            <span>Loading {contentType} items...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-stone-500 text-xs">
            No {contentType}s found matching query.
          </div>
        ) : (
          <div className="divide-y divide-stone-800">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 hover:bg-stone-850/60 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-xs">
                      @{item.authorPseudonym}
                    </span>
                    {item.channel && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-300 uppercase">
                        #{item.channel}
                      </span>
                    )}
                    <span className="text-stone-500 text-[11px]">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                    {item.isDeleted ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 uppercase">
                        Removed
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 uppercase">
                        Active
                      </span>
                    )}
                  </div>

                  {item.title && (
                    <h2 className="text-sm font-bold text-white">{item.title}</h2>
                  )}

                  <p className="text-stone-300 text-xs leading-relaxed whitespace-pre-wrap">
                    {item.content}
                  </p>

                  {item.isDeleted && item.deletionReason && (
                    <div className="p-2 rounded bg-red-950/40 border border-red-900/50 text-[11px] text-red-300">
                      Removed by Staff: {item.deletionReason}
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {item.isDeleted ? (
                    <button
                      onClick={() => {
                        setTargetItem(item);
                        setActionType("restore");
                        setReason("Reinstated following administrative review");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-emerald-400 text-xs font-medium border border-stone-700 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setTargetItem(item);
                        setActionType("remove");
                        setReason("");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 text-xs font-medium border border-red-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Soft-Remove
                    </button>
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

      {/* Confirmation Modal */}
      {targetItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-stone-900 border border-stone-800 p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white">
              {actionType === "remove" ? "Soft-Remove Content" : "Restore Content"}
            </h2>

            <p className="text-xs text-stone-400">
              {actionType === "remove"
                ? "This hides the content from the campus feed while preserving database record for audits."
                : "This makes the item visible again in the public feed."}
            </p>

            <div className="space-y-1.5 text-xs">
              <label className="block text-stone-400">Reason (Required for Audit Log)</label>
              <input
                type="text"
                placeholder="e.g. Violation of community rule #3 (harassment)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-200 placeholder-stone-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-800">
              <button
                onClick={() => setTargetItem(null)}
                className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={submitting}
                className={`px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 ${
                  actionType === "remove"
                    ? "bg-red-600 hover:bg-red-500 text-white"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
              >
                Confirm {actionType === "remove" ? "Removal" : "Restoration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
