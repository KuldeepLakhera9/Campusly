"use client";

import * as React from "react";
import {
  Users,
  Search,
  AlertTriangle,
  CheckCircle2,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils/formatters";

interface AdminUserItem {
  id: string;
  email: string;
  collegeName: string;
  role: "student" | "moderator" | "admin";
  moderationStatus: "active" | "warned" | "suspended" | "banned";
  suspensionExpiresAt?: string | null;
  lastWarnedAt?: string | null;
  bannedAt?: string | null;
  moderationNote?: string | null;
  publicIdentity: {
    username: string;
    avatarId: string;
    avatarColor: string;
  };
  reportsCount: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<AdminUserItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Filters
  const [search, setSearch] = React.useState("");
  const [role, setRole] = React.useState("all");
  const [moderationStatus, setModerationStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  // Action Dialog State
  const [selectedUser, setSelectedUser] = React.useState<AdminUserItem | null>(null);
  const [actionType, setActionType] = React.useState<"warn" | "suspend" | "ban" | "unban" | "change_role">("warn");
  const [duration, setDuration] = React.useState("24h");
  const [targetRole, setTargetRole] = React.useState<"student" | "moderator" | "admin">("moderator");
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const fetchUsers = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({
        role,
        moderationStatus,
        page: page.toString(),
        limit: "20",
      });
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load users list.");
      }

      const data = await res.json();
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching users.");
    } finally {
      setLoading(false);
    }
  }, [role, moderationStatus, search, page]);

  React.useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) fetchUsers();
    });
    return () => {
      isMounted = false;
    };
  }, [fetchUsers]);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetchUsers();
  };

  const handleApplyAction = async () => {
    if (!selectedUser) return;
    if (!reason.trim() && actionType !== "unban") {
      setError("Please provide a reason for the moderation action.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/moderation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          duration: actionType === "suspend" ? duration : undefined,
          targetRole: actionType === "change_role" ? targetRole : undefined,
          reason: reason.trim() || "Administrative action",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to apply user action.");
      }

      setSuccess(data.message);
      setSelectedUser(null);
      setReason("");
      await fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Action failed.");
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
            <Users className="w-6 h-6 text-amber-400" />
            User Management & Safety
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Search verified accounts, review reports, and enforce user restrictions.
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

      {/* Filters Toolbar */}
      <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
            Search Pseudonym / Email
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  fetchUsers();
                }
              }}
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-3" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
            Role Filter
          </label>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
            Moderation Status
          </label>
          <select
            value={moderationStatus}
            onChange={(e) => {
              setModerationStatus(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="warned">Warned</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
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

      {/* Users Table */}
      <div className="rounded-xl bg-stone-900 border border-stone-800 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-stone-400 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
            <span>Loading user directory...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-stone-500 text-xs">
            No users found matching query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950/80 text-stone-400 uppercase tracking-wider text-[10px] border-b border-stone-800">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">College</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reports</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-850/60 transition-colors">
                    {/* User Pseudonym + Email */}
                    <td className="py-3.5 px-4 flex items-center gap-2.5">
                      <Avatar
                        moniker={u.publicIdentity.username}
                        avatarId={u.publicIdentity.avatarId}
                        color={u.publicIdentity.avatarColor}
                        size="sm"
                      />
                      <div>
                        <span className="font-semibold text-white block">
                          @{u.publicIdentity.username}
                        </span>
                        <span className="text-[11px] text-stone-500 block truncate max-w-[160px]">
                          {u.email}
                        </span>
                      </div>
                    </td>

                    {/* College */}
                    <td className="py-3.5 px-4 text-stone-300 font-medium">
                      {u.collegeName}
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          u.role === "admin"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : u.role === "moderator"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-stone-800 text-stone-400"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {/* Moderation Status */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase inline-block ${
                            u.moderationStatus === "banned"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : u.moderationStatus === "suspended"
                              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              : u.moderationStatus === "warned"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-400"
                          }`}
                        >
                          {u.moderationStatus}
                        </span>
                        {u.suspensionExpiresAt && (
                          <span className="text-[10px] text-stone-500 block">
                            Until {new Date(u.suspensionExpiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Reports count against user */}
                    <td className="py-3.5 px-4">
                      {u.reportsCount > 0 ? (
                        <span className="text-amber-400 font-semibold">
                          {u.reportsCount} report(s)
                        </span>
                      ) : (
                        <span className="text-stone-500">0</span>
                      )}
                    </td>

                    {/* Joined date */}
                    <td className="py-3.5 px-4 text-stone-400 text-[11px]">
                      {formatRelativeTime(u.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {u.moderationStatus === "suspended" || u.moderationStatus === "banned" ? (
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setActionType("unban");
                              setReason("Lift suspension / reset status to active");
                            }}
                            className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-emerald-400 text-xs font-medium"
                          >
                            Unban
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setActionType("warn");
                                setReason("");
                              }}
                              className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-medium"
                            >
                              Warn
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setActionType("suspend");
                                setReason("");
                              }}
                              className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-orange-400 text-xs font-medium"
                            >
                              Suspend
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setActionType("ban");
                            setReason("");
                          }}
                          className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-red-400 text-xs font-medium"
                          title="Permanent Ban"
                        >
                          Ban
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setActionType("change_role");
                            setTargetRole(u.role === "student" ? "moderator" : "student");
                            setReason("Role administration update");
                          }}
                          className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white"
                          title="Change Role"
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
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

      {/* Moderation Action Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-stone-900 border border-stone-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Moderate @{selectedUser.publicIdentity.username}
              </h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-stone-400 hover:text-white text-sm"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 mb-1">Action</label>
                <select
                  value={actionType}
                  onChange={(e) =>
                    setActionType(
                      e.target.value as "warn" | "suspend" | "ban" | "unban" | "change_role"
                    )
                  }
                  className="w-full p-2.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-200"
                >
                  <option value="warn">Formal Warning</option>
                  <option value="suspend">Temporary Suspension</option>
                  <option value="ban">Permanent Ban</option>
                  <option value="unban">Lift Restrictions (Reset to Active)</option>
                  <option value="change_role">Change Account Role</option>
                </select>
              </div>

              {actionType === "suspend" && (
                <div>
                  <label className="block text-stone-400 mb-1">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-200"
                  >
                    <option value="1h">1 Hour</option>
                    <option value="24h">24 Hours (1 Day)</option>
                    <option value="3d">3 Days</option>
                    <option value="7d">7 Days</option>
                    <option value="30d">30 Days</option>
                  </select>
                </div>
              )}

              {actionType === "change_role" && (
                <div>
                  <label className="block text-stone-400 mb-1">Target Role</label>
                  <select
                    value={targetRole}
                    onChange={(e) =>
                      setTargetRole(e.target.value as "student" | "moderator" | "admin")
                    }
                    className="w-full p-2.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-200"
                  >
                    <option value="student">Student</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-stone-400 mb-1">
                  Reason for Audit Record
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hate speech violation or spam activity"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-200 placeholder-stone-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-800">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyAction}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold disabled:opacity-50"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
