export interface PseudonymOption {
  moniker: string;
  avatarColor: string;
  avatarIcon: string;
  circle: string;
}

export interface GeneratedIdentity {
  username: string;
  avatarId: string;
  avatarColor: string;
}

const ADJECTIVES = [
  "Midnight",
  "Quiet",
  "Blue",
  "Hidden",
  "Coffee",
  "Urban",
  "Silent",
  "Night",
  "Velvet",
  "Autumn",
  "Cedar",
  "Amber",
  "Echo",
  "North",
  "South",
  "Humble",
  "Curious",
  "Perceptive",
  "Silver",
  "Golden",
];

const NOUNS = [
  "Fox",
  "Coder",
  "Orbit",
  "Pixel",
  "Runner",
  "Ghost",
  "Wolf",
  "Owl",
  "Architect",
  "Chemist",
  "Philosopher",
  "Botanist",
  "Bard",
  "Seeker",
  "Pilot",
  "Pianist",
  "Rambler",
  "Cartographer",
  "Echo",
  "Voyager",
];

const PRESET_IDS = [
  "terracotta-prism",
  "oxford-pine",
  "slate-arch",
  "amber-ring",
  "heather-wave",
  "charcoal-monolith",
  "cobalt-orbit",
  "cedar-cube",
];

const PRESET_COLORS: Record<string, string> = {
  "terracotta-prism": "#C15438",
  "oxford-pine": "#244837",
  "slate-arch": "#2A4365",
  "amber-ring": "#744210",
  "heather-wave": "#702459",
  "charcoal-monolith": "#1C1917",
  "cobalt-orbit": "#1E3A8A",
  "cedar-cube": "#9C3D26",
};

/**
 * Generates a clean collegiate pseudonymous username string (e.g. "MidnightFox").
 */
export function generatePseudonymString(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const suffix = Math.random() > 0.7 ? String(Math.floor(Math.random() * 90) + 10) : "";
  return `${adj}${noun}${suffix}`;
}

/**
 * Generates a full pseudonymous identity with avatar preset.
 */
export function generatePseudonymIdentity(): GeneratedIdentity {
  const username = generatePseudonymString();
  const avatarId = PRESET_IDS[Math.floor(Math.random() * PRESET_IDS.length)];
  const avatarColor = PRESET_COLORS[avatarId] || "#C15438";

  return {
    username,
    avatarId,
    avatarColor,
  };
}

/**
 * Backward-compatible helper for Phase 1 components.
 */
export function generatePseudonym(seed?: string): PseudonymOption {
  const hash = (seed || Math.random().toString())
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const adj = ADJECTIVES[hash % ADJECTIVES.length];
  const noun = NOUNS[(hash * 7) % NOUNS.length];
  const avatarColor = PRESET_COLORS[PRESET_IDS[hash % PRESET_IDS.length]] || "#C15438";

  const moniker = `${adj} ${noun}`;
  const avatarIcon = `${adj[0]}${noun[0]}`;

  return {
    moniker,
    avatarColor,
    avatarIcon,
    circle: "Campus Common",
  };
}

/**
 * Validates format of user-chosen username.
 * - 3 to 24 characters
 * - Alphanumeric only (letters and digits)
 */
export function validateUsernameFormat(username: string): {
  isValid: boolean;
  message?: string;
} {
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return { isValid: false, message: "Username must be at least 3 characters long." };
  }
  if (trimmed.length > 24) {
    return { isValid: false, message: "Username cannot exceed 24 characters." };
  }
  if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
    return {
      isValid: false,
      message: "Username can only contain letters and numbers (no spaces or symbols).",
    };
  }

  return { isValid: true };
}

export function getMonikerInitials(moniker: string): string {
  if (!moniker) return "CY";
  const upperLetters = moniker.match(/[A-Z]/g);
  if (upperLetters && upperLetters.length >= 2) {
    return `${upperLetters[0]}${upperLetters[1]}`;
  }
  const parts = moniker.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return moniker.slice(0, 2).toUpperCase();
}
