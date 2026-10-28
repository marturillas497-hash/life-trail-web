"use client";

import { useState } from "react";
import { TagEditorDialog } from "@/components/TagEditorDialog";
import { btnPrimary, btnSecondary } from "@/components/ui";
import { useAllTags, useTagUsage } from "@/lib/hooks";
import { archiveTag, restoreTag } from "@/lib/tags";
import type { Tag } from "@/lib/types";

type Editing = { tag?: Tag } | null;

export default function TagsPage() {
  const tags = useAllTags();
  const usage = useTagUsage();
  const [editing, setEditing] = useState<Editing>(null);

  const active = tags?.filter((tag) => tag.isArchived === 0) ?? [];
  const archived = tags?.filter((tag) => tag.isArchived === 1) ?? [];

  function renderRow(tag: Tag) {
    const count = usage?.get(tag.id) ?? 0;
    return (
      <li key={tag.id} className="flex items-center gap-3 px-4 py-3">
        <span
          aria-hidden="true"
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: tag.color }}
        />
        <span className="text-2xl" aria-hidden="true">
          {tag.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{tag.name}</div>
          <div className="text-xs text-zinc-500">
            {count === 1 ? "Used in 1 entry" : `Used in ${count} entries`}
          </div>
        </div>
        <button type="button" className={btnSecondary} onClick={() => setEditing({ tag })}>
          Edit
        </button>
        {tag.isArchived === 0 ? (
          <button type="button" className={btnSecondary} onClick={() => void archiveTag(tag.id)}>
            Archive
          </button>
        ) : (
          <button type="button" className={btnSecondary} onClick={() => void restoreTag(tag.id)}>
            Restore
          </button>
        )}
      </li>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl p-4 lg:p-8">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Tags</h1>
          <button type="button" className={btnPrimary} onClick={() => setEditing({})}>
            New tag
          </button>
        </header>

        <p className="mt-2 text-sm text-zinc-500">
          Archiving a tag hides it when you write new entries. Old entries keep it, so your
          history and stats stay correct.
        </p>

        {!tags ? (
          <p className="mt-6 text-sm text-zinc-500">Loading...</p>
        ) : (
          <>
            <ul className="mt-6 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {active.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-zinc-500">
                  No active tags. Create one to start writing.
                </li>
              ) : (
                active.map(renderRow)
              )}
            </ul>

            {archived.length > 0 && (
              <details className="mt-8">
                <summary className="cursor-pointer text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Archived tags ({archived.length})
                </summary>
                <ul className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                  {archived.map(renderRow)}
                </ul>
              </details>
            )}
          </>
        )}
      </div>

      {editing && <TagEditorDialog tag={editing.tag} onClose={() => setEditing(null)} />}
    </div>
  );
}
