"use client";

import { useSearchParams } from "next/navigation";
import { EntryDetail } from "@/components/EntryDetail";
import { parseId } from "@/lib/paths";

/* /journal/entry/?id=5 */
export default function EntryPage() {
  const id = parseId(useSearchParams().get("id"));
  return <EntryDetail id={id} />;
}
