"use client";

import { useSearchParams } from "next/navigation";
import { EntryForm } from "@/components/EntryForm";
import { useSetting } from "@/lib/backup/hooks";
import { DEFAULT_TEMPLATE, TEMPLATE_KEY, promptFor, renderTemplate } from "@/lib/dailyNote";
import { isValidKey, todayKey } from "@/lib/dates";
import { useIsClient } from "@/lib/hooks";

/*
/journal/new/?date=2026-10-20 writes an entry for a past day.
Add &daily=1 (or just ?daily=1 for today) to start from the daily note template.
*/
export default function NewEntryPage() {
  const searchParams = useSearchParams();
  const isClient = useIsClient();
  const template = useSetting<string>(TEMPLATE_KEY);
  if (!isClient) return <p className="p-6 text-sm text-sand-500">Loading...</p>;

  const requested = searchParams.get("date");
  const date =
    requested && isValidKey(requested) && requested <= todayKey() ? requested : undefined;
  const daily = searchParams.get("daily") === "1";

  if (daily && !template) return <p className="p-6 text-sm text-sand-500">Loading...</p>;

  const day = date ?? todayKey();
  return (
    <EntryForm
      key={`${date ?? "today"}-${daily ? "daily" : "plain"}`}
      date={date}
      initialBody={daily ? renderTemplate(template?.value ?? DEFAULT_TEMPLATE, day) : undefined}
      prompt={daily ? promptFor(day) : undefined}
    />
  );
}
