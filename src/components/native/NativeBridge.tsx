"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isNative } from "@/lib/native/platform";
import { syncReminder } from "@/lib/native/reminder";
import { todayNotePath } from "@/lib/todayNote";

/*
Android only. Re-applies the daily reminder on open and sends a tap on the
reminder notification to today's note.
*/
export function NativeBridge() {
  const router = useRouter();

  useEffect(() => {
    if (!isNative()) return;

    let cancelled = false;
    let remove: (() => Promise<void>) | undefined;

    void (async () => {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const handle = await LocalNotifications.addListener("localNotificationActionPerformed", async () => {
        router.push(await todayNotePath());
      });
      if (cancelled) void handle.remove();
      else remove = () => handle.remove();
      await syncReminder().catch(() => {});
    })();

    return () => {
      cancelled = true;
      void remove?.();
    };
  }, [router]);

  return null;
}
