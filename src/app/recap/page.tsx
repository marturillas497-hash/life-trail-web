"use client";

import { useSearchParams } from "next/navigation";
import { RecapView } from "@/components/recap/RecapView";
import { useIsClient } from "@/lib/hooks";

/* /recap/?year=2026 shows that year. Without a year it picks the current one, or the latest with data. */
export default function RecapPage() {
  const searchParams = useSearchParams();
  const isClient = useIsClient();
  if (!isClient) return <p className="p-6 text-sm text-sand-500">Loading...</p>;

  const raw = Number(searchParams.get("year"));
  const requested = Number.isInteger(raw) && raw >= 1900 && raw <= 2200 ? raw : null;
  return <RecapView key={requested ?? "auto"} requestedYear={requested} />;
}
