"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDateTime, formatFullDate } from "@/lib/dates";
import { deleteEntry } from "@/lib/entries";
import { useEntry, useTagMap } from "@/lib/hooks";
import type { Tag } from "@/lib/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { TagChip } from "./TagChip";
import { btnSecondary } from "./ui";

export function EntryDetail({ id }: { id: number }) {
  const router = useRouter();
  const entry = useEntry(id);
  const tagMap = useTagMap();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (deleting) return null;

  if (entry === undefined || !tagMap) {
    return <p className="p-6 text-sm text-zinc-500">Loading...</p>;
  }

  if (entry === null) {
    return (
      <div className="p-6 text-sm">
        <p className="text-zinc-500">This entry no longer exists.</p>
        <Link href="/journal" className="mt-2 inline-block text-indigo-600 underline">
          Back to journal
        </Link>
      </div>
    );
  }

  const tags = entry.tagIds
    .map((tagId) => tagMap.get(tagId))
    .filter((tag): tag is Tag => tag !== undefined);
  const wasEdited = entry.updatedAt > entry.createdAt;

  async function handleDelete() {
    setConfirming(false);
    setDeleting(true);
    await deleteEntry(id);
    router.replace("/journal");
  }

  return (
    <article className="mx-auto max-w-2xl p-4 lg:p-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/journal" className="text-sm text-indigo-600 lg:hidden">
          &larr; Journal
        </Link>
        <div className="ml-auto flex gap-2">
          <Link href={`/journal/${id}/edit`} className={btnSecondary}>
            Edit
          </Link>
          <button type="button" className={btnSecondary} onClick={() => setConfirming(true)}>
            Delete
          </button>
        </div>
      </div>

      <p className="text-sm font-medium text-zinc-500">{formatFullDate(entry.date)}</p>
      {entry.title && (
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{entry.title}</h1>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <TagChip key={tag.id} tag={tag} />
        ))}
      </div>

      {entry.body && (
        <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed">{entry.body}</p>
      )}

      {wasEdited && (
        <p className="mt-8 text-xs text-zinc-500">Edited {formatDateTime(entry.updatedAt)}</p>
      )}

      <ConfirmDialog
        open={confirming}
        title="Delete this entry?"
        message="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
    </article>
  );
}
