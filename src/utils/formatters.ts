/**
 * Human-readable duration from seconds, e.g. "2m 34s" or "45s"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

/**
 * Short relative date, e.g. "Today", "Yesterday", "3 days ago"
 */
export function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Score percentage, rounded, e.g. "80%"
 */
export function formatScore(correct: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((correct / total) * 100)}%`;
}

/**
 * Truncate text to a max character count, adding ellipsis
 */
export function truncate(text: string, maxChars = 120): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars).trimEnd() + "…";
}
