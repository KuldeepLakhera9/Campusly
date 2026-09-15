export interface PseudonymOption {
  moniker: string;
  avatarColor: string;
  avatarIcon: string;
  circle: string;
}

const ADJECTIVES = [
  "Quiet",
  "Midnight",
  "Campus",
  "North Quad",
  "South Lawn",
  "Velvet",
  "Library",
  "Observatory",
  "Clocktower",
  "Perceptive",
  "Humble",
  "Curious",
  "Echoing",
  "Autumn",
  "Cedar",
  "Arcade",
];

const NOUNS = [
  "Architect",
  "Chemist",
  "Owl",
  "Fox",
  "Philosopher",
  "Botanist",
  "Astronomer",
  "Bard",
  "Runner",
  "Historian",
  "Debater",
  "Seeker",
  "Cartographer",
  "Pianist",
  "Rambler",
];

const AVATAR_PALETTES = [
  { bg: "#F5EFEB", fg: "#9C3D26" }, // Terracotta Warm
  { bg: "#EBF1EE", fg: "#244837" }, // Forest Pine
  { bg: "#EDF1F5", fg: "#2A4365" }, // Collegiate Slate
  { bg: "#F4EFE6", fg: "#744210" }, // Oak Bronze
  { bg: "#F5EEF3", fg: "#702459" }, // Mulberry Heather
  { bg: "#F0EFEB", fg: "#4A4A45" }, // Warm Charcoal
];

export function generatePseudonym(seed?: string): PseudonymOption {
  const hash = (seed || Math.random().toString()).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const adj = ADJECTIVES[hash % ADJECTIVES.length];
  const noun = NOUNS[(hash * 7) % NOUNS.length];
  const palette = AVATAR_PALETTES[hash % AVATAR_PALETTES.length];

  const moniker = `${adj} ${noun}`;
  const avatarIcon = `${adj[0]}${noun[0]}`;

  return {
    moniker,
    avatarColor: palette.fg,
    avatarIcon,
    circle: "Campus Common",
  };
}

export function getMonikerInitials(moniker: string): string {
  const parts = moniker.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return moniker.slice(0, 2).toUpperCase();
}
