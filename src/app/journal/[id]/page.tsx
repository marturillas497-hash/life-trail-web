"use client";

import { useParams } from "next/navigation";
import { EntryDetail } from "@/components/EntryDetail";

export default function EntryPage() {
  const params = useParams<{ id: string }>();
  return <EntryDetail id={Number(params.id)} />;
}
