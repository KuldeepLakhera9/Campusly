export interface UserPrivacySettings {
  hideMajor: boolean;
  allowDirectMessages: boolean;
  revealNameOnMutualFollow: boolean;
  autoExpireHangouts: boolean;
  appearInFindPeople: boolean;
  showInterests: boolean;
}

export interface IPublicIdentity {
  username: string; // Pseudonymous identifier (e.g. "MidnightFox")
  avatarId: string; // Preset ID or style
  avatarColor: string; // Accent color hex
  bio: string;
  interests: string[];
  lookingFor?: string[]; // Optional intent / activity preferences (e.g. "Study Partner", "Coding Partner")
}

export interface IUser {
  _id?: string;
  // PRIVATE ACCOUNT INFO
  email: string;
  passwordHash: string;
  collegeId?: string;
  collegeName: string;
  collegeDomain: string;
  emailVerified: boolean;
  role: "student" | "moderator" | "admin";
  status: "active" | "suspended" | "pending";
  onboardingCompleted: boolean;

  // PUBLIC IDENTITY
  publicIdentity: IPublicIdentity;

  // OPTIONAL / LEGACY ALIASES
  pseudonym?: string; // mapped to publicIdentity.username
  avatarColor?: string; // mapped to publicIdentity.avatarColor
  major?: string;
  graduationYear?: number;
  bio?: string;
  interests?: string[];

  // METRICS & SETTINGS
  sparksCount: number;
  privacySettings: UserPrivacySettings;

  // MODERATION & TRUST (Phase 7)
  moderationStatus?: "active" | "warned" | "suspended" | "banned";
  suspensionExpiresAt?: Date | null;
  lastWarnedAt?: Date | null;
  bannedAt?: Date | null;
  bannedBy?: string | null;
  moderationNote?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface ISafeUser {
  id: string;
  onboardingCompleted: boolean;
  role: "student" | "moderator" | "admin";
  college: {
    name: string;
    domain: string;
    city?: string;
    state?: string;
  };
  publicIdentity: IPublicIdentity;
  sparksCount: number;
  privacySettings: UserPrivacySettings;
  moderationStatus?: "active" | "warned" | "suspended" | "banned";
  suspensionExpiresAt?: string | null;
  createdAt: string;
}
