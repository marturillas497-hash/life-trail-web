"use client";

import { InsightsView } from "@/components/InsightsView";
import { useIsClient } from "@/lib/hooks";

export default function InsightsPage() {
  /* Today's date and the locale only exist in the browser, so wait for it. */
  const isClient = useIsClient();
  if (!isClient) return <p className="p-6 text-sm text-sand-500">Loading...</p>;
  return <InsightsView />;
}
