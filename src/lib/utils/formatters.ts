export function formatRelativeTime(dateInput: Date | string | number): string {
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatEventTime(dateInput: Date | string | number): string {
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "…";
}

export function getDaysRemaining(dateInput: Date | string, isCreatedAt = false): number {
  const baseTime = new Date(dateInput).getTime();
  const expiryTime = isCreatedAt ? baseTime + 14 * 24 * 60 * 60 * 1000 : baseTime;
  const now = new Date().getTime();
  const diffMs = expiryTime - now;
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}
