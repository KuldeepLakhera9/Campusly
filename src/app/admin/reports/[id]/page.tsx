"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserX,
  FileText,
  Clock,
  Trash2,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/formatters";

interface ReportDetail {
  id: string;
  target: string;
  targetType: "post" | "comment" | "message" | "hangout" | "user";
  reason: string;
  details?: string;
  status: string;
  priority: string;
  createdAt: string;
  reporter?: {
    _id?: string;
    email?: string;
    publicIdentity?: { username: string };
    collegeName?: string;
  };
  reviewedBy?: {
    publicIdentity?: { username: string };
    role?: string;
  };
  reviewedAt?: string;
  resolutionReason?: string;
}

export default function AdminReportDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [report, setReport] = React.useState<ReportDetail | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [targetDetails, setTargetDetails] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  // Resolution form state
  const [resolutionReason, setResolutionReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // User moderation modal/inline state
  const [showUserModal, setShowUserModal] = React.useState(false);
  const [userActionType, setUserActionType] = React.useState<"warn" | "suspend" | "ban">("warn");
  const [suspensionDuration, setSuspensionDuration] = React.useState("24h");
  const [userActionReason, setUserActionReason] = React.useState("");

  const fetchReport = React.useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/reports/${id}`);
      if (!res.ok) {
        throw new Error("Failed to load report details.");
      }
      const data = await res.json();
      setReport(data.report);
      setTargetDetails(data.targetDetails);
      if (data.report?.resolutionReason) {
        setResolutionReason(data.report.resolutionReason);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching report.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) fetchReport();
    });
    return () => {
      isMounted = false;
    };
  }, [fetchReport]);

  const handleUpdateStatus = async (newStatus: "resolved" | "dismissed" | "reviewing") => {
    if ((newStatus === "resolved" || newStatus === "dismissed") && !resolutionReason.trim()) {
      setError("Please provide a brief resolution reason before updating status.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          resolutionReason: resolutionReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update report.");
      }

      setActionSuccess(`Report successfully marked as ${newStatus}.`);
      await fetchReport();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleContentModeration = async (action: "remove" | "restore") => {
    if (!report) return;
    if (!resolutionReason.trim()) {
      setError("Please provide a moderation reason in the resolution note below.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setActionSuccess(null);

    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: report.target,
          type: report.targetType === "comment" ? "comment" : "post",
          action,
          reason: resolutionReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to moderate content.");
      }

      setActionSuccess(data.message || `Content successfully ${action}d.`);
      await fetchReport();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Content action error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleHangoutModeration = async (action: "cancel" | "remove" | "restore") => {
    if (!report) return;
    if (!resolutionReason.trim()) {
      setError("Please provide a moderation reason in the resolution note below.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setActionSuccess(null);

    try {
      const res = await fetch("/api/admin/hangouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hangoutId: report.target,
          action,
          reason: resolutionReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to moderate hangout.");
      }

      setActionSuccess(data.message || `Hangout successfully updated.`);
      await fetchReport();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Hangout action error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUserModeration = async () => {
    if (!report) return;
    const targetUserId =
      report.targetType === "user"
        ? report.target
        : targetDetails?.author || targetDetails?.sender || targetDetails?.host;

    if (!targetUserId) {
      setError("Author user ID could not be resolved for this item.");
      return;
    }

    if (!userActionReason.trim()) {
      setError("Please specify a reason for this user enforcement action.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/users/${targetUserId}/moderation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: userActionType,
          duration: userActionType === "suspend" ? suspensionDuration : undefined,
          reason: userActionReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to apply user moderation action.");
      }

      setActionSuccess(data.message);
      setShowUserModal(false);
      setUserActionReason("");
      await fetchReport();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "User moderation error.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-stone-400 text-xs flex flex-col items-center gap-2">
        <Clock className="w-6 h-6 animate-spin text-amber-500" />
        <span>Loading report details...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="py-24 text-center text-stone-500 text-sm">
        Report not found.{" "}
        <Link href="/admin/reports" className="text-amber-400 underline">
          Return to queue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link & Header */}
      <div className="pb-4 border-b border-stone-800 flex items-center justify-between">
        <Link
          href="/admin/reports"
          className="inline-flex items-center gap-2 text-xs font-medium text-stone-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Reports Queue
        </Link>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
              report.priority === "critical"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : report.priority === "high"
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            }`}
          >
            {report.priority} Priority
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase bg-stone-800 text-stone-300">
            {report.status}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Grid: Investigation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Report Details & Target Entity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Metadata Card */}
          <div className="p-5 rounded-xl bg-stone-900 border border-stone-800 space-y-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Report Dossier
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-stone-500 block">Report Reason:</span>
                <span className="text-white font-medium text-sm mt-0.5 block">
                  {report.reason}
                </span>
              </div>

              <div>
                <span className="text-stone-500 block">Submitted:</span>
                <span className="text-stone-300 mt-0.5 block">
                  {new Date(report.createdAt).toLocaleString()} (
                  {formatRelativeTime(report.createdAt)})
                </span>
              </div>

              <div>
                <span className="text-stone-500 block">Target Surface:</span>
                <span className="text-amber-300 uppercase font-semibold mt-0.5 block">
                  {report.targetType}
                </span>
              </div>

              <div>
                <span className="text-stone-500 block">Reporter (Internal Record):</span>
                <span className="text-stone-300 mt-0.5 block">
                  @{report.reporter?.publicIdentity?.username || "Student"} &bull;{" "}
                  {report.reporter?.email || "Encrypted"} &bull;{" "}
                  {report.reporter?.collegeName || "Campus Member"}
                </span>
              </div>
            </div>

            {report.details && (
              <div className="pt-3 border-t border-stone-800">
                <span className="text-stone-500 text-xs block mb-1">
                  Additional Details from Reporter:
                </span>
                <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 text-stone-300 text-xs leading-relaxed">
                  {report.details}
                </div>
              </div>
            )}
          </div>

          {/* Target Entity Preview Card */}
          <div className="p-5 rounded-xl bg-stone-900 border border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-stone-400" />
                Target Entity Content ({report.targetType})
              </h2>
              {targetDetails?.isDeleted && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                  Soft-Deleted
                </span>
              )}
            </div>

            {targetDetails ? (
              <div className="p-4 rounded-lg bg-stone-950 border border-stone-800 space-y-3 text-xs">
                {targetDetails.title && (
                  <h3 className="text-sm font-bold text-white">
                    {targetDetails.title}
                  </h3>
                )}

                <p className="text-stone-200 text-sm whitespace-pre-wrap leading-relaxed">
                  {targetDetails.content || targetDetails.description || "No text content."}
                </p>

                <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center gap-4 text-stone-500 text-[11px]">
                  <span>
                    Author:{" "}
                    <strong className="text-stone-300">
                      {targetDetails.authorPseudonym ||
                        targetDetails.hostPseudonym ||
                        targetDetails.senderPseudonym ||
                        targetDetails.publicIdentity?.username ||
                        "Unknown"}
                    </strong>
                  </span>
                  <span>
                    Created:{" "}
                    {targetDetails.createdAt
                      ? new Date(targetDetails.createdAt).toLocaleString()
                      : "—"}
                  </span>
                  {targetDetails.deletionReason && (
                    <span className="text-red-400">
                      Deletion Reason: {targetDetails.deletionReason}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-stone-950 text-stone-500 text-xs text-center">
                Target entity content is no longer accessible or was hard-purged.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Enforcement & Resolution Actions */}
        <div className="space-y-6">
          {/* Status & Resolution Card */}
          <div className="p-5 rounded-xl bg-stone-900 border border-stone-800 space-y-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Resolution Note
            </h2>

            <p className="text-xs text-stone-400">
              Document reasons for action or dismissal for compliance audit trail.
            </p>

            <textarea
              rows={4}
              placeholder="e.g. Violation of community standards: hate speech and targeted harassment. Removed content and issued suspension."
              value={resolutionReason}
              onChange={(e) => setResolutionReason(e.target.value)}
              className="w-full p-3 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => handleUpdateStatus("resolved")}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark Resolved & Close
              </button>

              <button
                onClick={() => handleUpdateStatus("dismissed")}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium border border-stone-700 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 text-stone-400" />
                Dismiss (No Action Needed)
              </button>
            </div>
          </div>

          {/* Quick Destructive Moderation Actions Card */}
          <div className="p-5 rounded-xl bg-stone-900 border border-stone-800 space-y-3">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Enforcement Actions
            </h2>

            {/* Content Actions */}
            {(report.targetType === "post" || report.targetType === "comment") && (
              <div className="space-y-2">
                <span className="text-[11px] font-medium text-stone-400 block">
                  Content Management:
                </span>
                {targetDetails?.isDeleted ? (
                  <button
                    onClick={() => handleContentModeration("restore")}
                    disabled={submitting}
                    className="w-full px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-emerald-400 text-xs font-medium border border-stone-700 transition-colors"
                  >
                    Restore Content to Public Feed
                  </button>
                ) : (
                  <button
                    onClick={() => handleContentModeration("remove")}
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 text-xs font-medium border border-red-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Soft-Remove Content
                  </button>
                )}
              </div>
            )}

            {/* Hangout Actions */}
            {report.targetType === "hangout" && (
              <div className="space-y-2">
                <span className="text-[11px] font-medium text-stone-400 block">
                  Hangout Action:
                </span>
                {targetDetails?.isDeleted ? (
                  <button
                    onClick={() => handleHangoutModeration("restore")}
                    disabled={submitting}
                    className="w-full px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-emerald-400 text-xs font-medium border border-stone-700 transition-colors"
                  >
                    Restore Hangout
                  </button>
                ) : (
                  <button
                    onClick={() => handleHangoutModeration("remove")}
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 text-xs font-medium border border-red-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Cancel & Remove Hangout
                  </button>
                )}
              </div>
            )}

            {/* User Account Action Button */}
            <div className="pt-2 border-t border-stone-800">
              <button
                onClick={() => setShowUserModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-medium border border-stone-700 transition-colors"
              >
                <UserX className="w-3.5 h-3.5" />
                Action Against Offending User
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User Moderation Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-stone-900 border border-stone-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Moderate User Account
              </h2>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-stone-400 hover:text-white text-sm"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 mb-1">Action Type</label>
                <select
                  value={userActionType}
                  onChange={(e) =>
                    setUserActionType(e.target.value as "warn" | "suspend" | "ban")
                  }
                  className="w-full p-2.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-200"
                >
                  <option value="warn">Formal Warning (Logged)</option>
                  <option value="suspend">Temporary Suspension (Time-bound)</option>
                  <option value="ban">Permanent Ban (Admin Only)</option>
                </select>
              </div>

              {userActionType === "suspend" && (
                <div>
                  <label className="block text-stone-400 mb-1">
                    Suspension Duration
                  </label>
                  <select
                    value={suspensionDuration}
                    onChange={(e) => setSuspensionDuration(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-200"
                  >
                    <option value="1h">1 Hour Cool-off</option>
                    <option value="24h">24 Hours (1 Day)</option>
                    <option value="3d">3 Days</option>
                    <option value="7d">7 Days (1 Week)</option>
                    <option value="30d">30 Days</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-stone-400 mb-1">
                  Enforcement Reason (Mandatory for Audit)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Repeated harassment in campus feed comments"
                  value={userActionReason}
                  onChange={(e) => setUserActionReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-200 placeholder-stone-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-800">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUserModeration}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold disabled:opacity-50"
              >
                Confirm Enforcement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
