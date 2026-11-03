"use client";

import { HomeView } from "@/components/home/HomeView";
import { useIsClient } from "@/lib/hooks";

export default function Home() {
  /* Today's date and the time of day only exist in the browser, so wait for it. */
  const isClient = useIsClient();
  if (!isClient) return <p className="p-6 text-sm text-sand-500">Loading...</p>;
  return <HomeView />;
}
