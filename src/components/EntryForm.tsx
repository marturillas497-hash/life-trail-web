"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createEntry, updateEntry } from "@/lib/entries";
import { useActiveTags, useTagMap } from "@/lib/hooks";
import type { Entry, Tag } from "@/lib/types";
import { TagChip } from "./TagChip";
import { btnPrimary, inputClass } from "./ui";

/*
Used for both creating and editing.
Pass `initial` to edit, leave it out to create a new entry.
*/
export function EntryForm({ initial }: { initial?: Entry }) {
  const router = useRouter();
  const activeTags = useActiveTags();
  const tagMap = useTagMap();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [tagIds, setTagIds] = useState<number[]>(initial?.tagIds ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave =
    !saving && tagIds.length > 0 && (title.trim() !== "" || body.trim() !== "");
  const backHref = initial ? `/journal/${initial.id}` : "/journal";

  /*
  While editing, keep showing tags the entry already has even if they are
  no longer active, so saving does not silently drop them.
  */
  const visibleTags = useMemo(() => {
    if (!activeTags || !tagMap) return undefined;
    const activeIds = new Set(activeTags.map((tag) => tag.id));
    const extra = (initial?.tagIds ?? [])
      .filter((id) => !activeIds.has(id))
      .map((id) => tagMap.get(id))
      .filter((tag): tag is Tag => tag !== undefined);
    return [...activeTags, ...extra];
  }, [activeTags, tagMap, initial]);

  const save = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    const data = { title: title.trim(), body: body.trim(), tagIds };
    try {
      let id: number;
      if (initial) {
        await updateEntry(initial.id, data);
        id = initial.id;
      } else {
        id = await createEntry(data);
      }
      router.replace(`/journal/${id}`);
    } catch {
      setError("Could not save. Please try again.");
      setSaving(false);
    }
  }, [canSave, title, body, tagIds, initial, router]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  function toggleTag(id: number) {
    setTagIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <Link href={backHref} className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
          Cancel
        </Link>
        <h1 className="font-semibold">{initial ? "Edit entry" : "New entry"}</h1>
        <button
          type="button"
          className={btnPrimary}
          disabled={!canSave}
          onClick={() => void save()}
          title="Save (Ctrl+S)"
        >
          Save
        </button>
      </header>

      <div className="mx-auto max-w-2xl space-y-6 p-4 lg:p-8">
        <section>
          <h2 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            How are you feeling?
          </h2>
          {visibleTags ? (
            <div className="flex flex-wrap gap-2">
              {visibleTags.map((tag) => (
                <TagChip
                  key={tag.id}
                  tag={tag}
                  selected={tagIds.includes(tag.id)}
                  onToggle={() => toggleTag(tag.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Loading tags...</p>
          )}
        </section>

        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title (optional)"
          aria-label="Title"
          className={inputClass}
        />

        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="What happened today?"
          aria-label="Entry text"
          rows={12}
          className={`${inputClass} min-h-64 resize-y`}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
