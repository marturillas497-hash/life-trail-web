"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { EntryForm } from "@/components/EntryForm";
import { useEntry } from "@/lib/hooks";

export default function EditEntryPage() {
  const params = useParams<{ id: string }>();
  const entry = useEntry(Number(params.id));

  if (entry === undefined) {
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

  return <EntryForm key={entry.id} initial={entry} />;
}
