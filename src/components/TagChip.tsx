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
        className={`${base} border-sand-200 bg-sand-100 text-sand-800 dark:border-sand-700 dark:bg-sand-800 dark:text-sand-100`}
      >
        {label}
      </span>
    );
  }

  const state = selected
    ? "border-brand-600 bg-brand-600 text-white"
    : "border-sand-300 bg-white text-sand-800 hover:bg-sand-50 dark:border-sand-700 dark:bg-sand-900 dark:text-sand-100 dark:hover:bg-sand-800";

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
