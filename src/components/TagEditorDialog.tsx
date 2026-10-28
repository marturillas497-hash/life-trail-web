"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createTag, MAX_TAG_NAME_LENGTH, updateTag } from "@/lib/tags";
import { TAG_COLORS } from "@/lib/tagColors";
import type { Tag } from "@/lib/types";
import { btnPrimary, btnSecondary, inputClass } from "./ui";

const EmojiPickerPanel = dynamic(() => import("./EmojiPickerPanel"), {
  ssr: false,
  loading: () => <p className="p-4 text-sm text-zinc-500">Loading emojis...</p>,
});

type Props = {
  /* Pass a tag to edit it, leave out to create a new one. */
  tag?: Tag;
  onClose: () => void;
  onSaved?: (id: number) => void;
};

/* Render this only while it should be open, so its fields start fresh each time. */
export function TagEditorDialog({ tag, onClose, onSaved }: Props) {
  const [name, setName] = useState(tag?.name ?? "");
  const [emoji, setEmoji] = useState(tag?.emoji ?? "");
  const [color, setColor] = useState(tag?.color ?? TAG_COLORS[0]);
  const [pickerOpen, setPickerOpen] = useState(!tag);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const input = { name, emoji, color };
      let id: number;
      if (tag) {
        await updateTag(tag.id, input);
        id = tag.id;
      } else {
        id = await createTag(input);
      }
      onSaved?.(id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the tag.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tag-dialog-title"
        className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="tag-dialog-title" className="text-lg font-semibold">
          {tag ? "Edit tag" : "New tag"}
        </h2>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPickerOpen((open) => !open)}
            aria-label="Choose emoji"
            aria-expanded={pickerOpen}
            className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-2xl hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            {emoji || "🙂"}
          </button>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={MAX_TAG_NAME_LENGTH}
            placeholder="Tag name"
            aria-label="Tag name"
            autoFocus={!!tag}
            className={inputClass}
          />
        </div>

        {pickerOpen && (
          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
            <EmojiPickerPanel
              onPick={(picked) => {
                setEmoji(picked);
                setPickerOpen(false);
              }}
            />
          </div>
        )}

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Color (used later for Year in Pixels)
          </p>
          <div className="flex flex-wrap gap-2">
            {TAG_COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => setColor(swatch)}
                aria-label={`Color ${swatch}`}
                aria-pressed={color === swatch}
                style={{ backgroundColor: swatch }}
                className={`size-8 rounded-full ${
                  color === swatch
                    ? "ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-zinc-900"
                    : ""
                }`}
              />
            ))}
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={btnPrimary}
            disabled={saving}
            onClick={() => void save()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
