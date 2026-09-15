import { ReportReason } from "@/types/post";

export type AdminRole = "student" | "moderator" | "admin";
export type UserModerationStatus = "active" | "warned" | "suspended" | "banned";
export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";
export type ReportPriority = "low" | "medium" | "high" | "critical";
export type ReportTargetType = "post" | "comment" | "message" | "user" | "hangout";

export type AuditAction =
  | "REPORT_REVIEWED"
  | "REPORT_RESOLVED"
  | "REPORT_DISMISSED"
  | "POST_REMOVED"
  | "POST_RESTORED"
  | "COMMENT_REMOVED"
  | "COMMENT_RESTORED"
  | "HANGOUT_REMOVED"
  | "HANGOUT_CANCELLED"
  | "USER_WARNED"
  | "USER_SUSPENDED"
  | "USER_BANNED"
  | "USER_UNBANNED"
  | "ROLE_CHANGED";

export interface IAuditLog {
  id: string;
  actor: {
    id: string;
    username: string;
    role: AdminRole;
  };
  action: AuditAction;
  targetType: "report" | "post" | "comment" | "hangout" | "user" | "message";
  targetId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface IAdminMetrics {
  totalStudents: number;
  activeUsers: number;
  postsToday: number;
  commentsToday: number;
  hangoutsToday: number;
  pendingReports: number;
  reviewingReports: number;
  resolvedReports: number;
  dismissedReports: number;
  suspendedUsers: number;
  bannedUsers: number;
  warnedUsers: number;
}

export interface IAdminReportSummary {
  id: string;
  reporter: {
    id: string;
    username: string;
    avatarId: string;
    avatarColor: string;
  };
  targetId: string;
  targetType: ReportTargetType;
  reason: ReportReason | string;
  details?: string;
  status: ReportStatus;
  priority: ReportPriority;
  assignedTo?: {
    id: string;
    username: string;
  };
  resolutionReason?: string;
  reviewedBy?: {
    id: string;
    username: string;
  };
  reviewedAt?: string;
  createdAt: string;
  targetPreview?: {
    content?: string;
    authorPseudonym?: string;
    title?: string;
    activity?: string;
  };
}

export interface IAdminUserSummary {
  id: string;
  username: string;
  avatarId: string;
  avatarColor: string;
  email?: string; // Strictly exposed only to authorized admins
  collegeName: string;
  collegeDomain: string;
  role: AdminRole;
  moderationStatus: UserModerationStatus;
  suspensionExpiresAt?: string | null;
  lastWarnedAt?: string | null;
  bannedAt?: string | null;
  sparksCount: number;
  stats: {
    posts: number;
    comments: number;
    hangouts: number;
    reportsReceived: number;
  };
  createdAt: string;
}
