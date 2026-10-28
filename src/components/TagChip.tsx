import type { Tag } from "@/lib/types";

type Props = {
  tag: Tag;
  selected?: boolean;
  /* When given, the chip becomes a toggle button. */
  onToggle?: () => void;
  size?: "sm" | "md";
};

export function TagChip({ tag, selected = false, onToggle, size = "md" }: Props) {
  const sizing = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  const base = `inline-flex items-center gap-1.5 rounded-full border ${sizing}`;
  const label = `${tag.emoji} ${tag.name}`;

  if (!onToggle) {
    return (
      <span
        className={`${base} border-zinc-200 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100`}
      >
        {label}
      </span>
    );
  }

  const state = selected
    ? "border-indigo-600 bg-indigo-600 text-white"
    : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`${base} ${state} transition-colors`}
    >
      {label}
    </button>
  );
}
