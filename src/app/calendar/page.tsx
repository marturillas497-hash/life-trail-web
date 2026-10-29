"use client";

import { CalendarView } from "@/components/CalendarView";
import { useIsClient } from "@/lib/hooks";

export default function CalendarPage() {
  /* Today's date and the locale only exist in the browser, so wait for it. */
  const isClient = useIsClient();
  if (!isClient) return <p className="p-6 text-sm text-zinc-500">Loading...</p>;
  return <CalendarView />;
}
