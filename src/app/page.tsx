"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/* A static site cannot redirect on the server, so the home page sends you on. */
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/journal/");
  }, [router]);
  return <p className="p-6 text-sm text-zinc-500">Loading...</p>;
}
