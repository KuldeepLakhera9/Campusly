export interface AvatarPreset {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  shape: "prism" | "monolith" | "orbit" | "ring" | "arch" | "pillar" | "wave" | "cube";
  initials: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "terracotta-prism",
    name: "Terracotta Prism",
    color: "#C15438",
    bgColor: "#FAF0EB",
    shape: "prism",
    initials: "TP",
  },
  {
    id: "oxford-pine",
    name: "Oxford Pine",
    color: "#244837",
    bgColor: "#EBF1EE",
    shape: "pillar",
    initials: "OP",
  },
  {
    id: "slate-arch",
    name: "Collegiate Slate",
    color: "#2A4365",
    bgColor: "#EDF1F5",
    shape: "arch",
    initials: "CS",
  },
  {
    id: "amber-ring",
    name: "Amber Ring",
    color: "#744210",
    bgColor: "#FBF3E8",
    shape: "ring",
    initials: "AR",
  },
  {
    id: "heather-wave",
    name: "Heather Wave",
    color: "#702459",
    bgColor: "#F7EFF5",
    shape: "wave",
    initials: "HW",
  },
  {
    id: "charcoal-monolith",
    name: "Warm Charcoal",
    color: "#1C1917",
    bgColor: "#F2EFEB",
    shape: "monolith",
    initials: "WC",
  },
  {
    id: "cobalt-orbit",
    name: "Cobalt Orbit",
    color: "#1E3A8A",
    bgColor: "#EEF2FF",
    shape: "orbit",
    initials: "CO",
  },
  {
    id: "cedar-cube",
    name: "Cedar Woodblock",
    color: "#9C3D26",
    bgColor: "#F6EDE8",
    shape: "cube",
    initials: "CW",
  },
];

export function getAvatarPreset(id?: string): AvatarPreset {
  if (!id) return AVATAR_PRESETS[0];
  const found = AVATAR_PRESETS.find((p) => p.id === id);
  return found || AVATAR_PRESETS[0];
}
