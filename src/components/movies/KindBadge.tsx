import type { MediaKind } from "@/lib/types";

export const kindLabel = (kind: MediaKind) => (kind === "tv" ? "Show" : "Movie");

/* A small pill that says whether a title is a movie or a TV show. */
export function KindBadge({ kind, className = "" }: { kind: MediaKind; className?: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
        kind === "tv"
          ? "bg-gold-100 text-gold-900 dark:bg-gold-400/20 dark:text-gold-200"
          : "bg-brand-100 text-brand-900 dark:bg-brand-500/25 dark:text-brand-200"
      } ${className}`}
    >
      {kind === "tv" ? "📺 " : "🎬 "}
      {kindLabel(kind)}
    </span>
  );
}
