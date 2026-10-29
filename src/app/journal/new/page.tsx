"use client";

import { useSearchParams } from "next/navigation";
import { EntryForm } from "@/components/EntryForm";
import { isValidKey, todayKey } from "@/lib/dates";
import { useIsClient } from "@/lib/hooks";

/* /journal/new?date=2026-10-20 writes an entry for a past day. */
export default function NewEntryPage() {
  const searchParams = useSearchParams();
  const isClient = useIsClient();
  if (!isClient) return <p className="p-6 text-sm text-zinc-500">Loading...</p>;

  const requested = searchParams.get("date");
  const date =
    requested && isValidKey(requested) && requested <= todayKey() ? requested : undefined;

  return <EntryForm key={date ?? "today"} date={date} />;
}
