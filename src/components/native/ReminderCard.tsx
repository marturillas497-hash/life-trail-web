"use client";

import { useEffect, useState } from "react";
import { isNative } from "@/lib/native/platform";
import { applyReminder, getReminder, type Reminder } from "@/lib/native/reminder";
import { cardClass, inputClass } from "../ui";

/* Android app only. The website cannot fire a reminder while it is closed. */
export function ReminderCard() {
  const [native] = useState(() => isNative());
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!native) return;
    void getReminder().then(setReminder);
  }, [native]);

  if (!native) return null;

  async function change(next: Reminder) {
    setBusy(true);
    setMessage(null);
    try {
      const result = await applyReminder(next);
      if (result === "denied") {
        setMessage("Notifications are blocked. Allow them in Android Settings, under Apps, Life Trail, Notifications.");
      } else {
        setReminder(next);
        setMessage(next.enabled ? `Reminder set for ${next.time} every day.` : "Reminder turned off.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={cardClass}>
      <h2 className="font-semibold">Daily reminder</h2>
      <p className="mt-1 text-sm text-sand-500">
        A notification at a time you choose. Tapping it opens today&apos;s note. This setting stays on this phone.
      </p>

      {reminder && (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="size-4 accent-brand-600"
              checked={reminder.enabled}
              disabled={busy}
              onChange={(event) => void change({ ...reminder, enabled: event.target.checked })}
            />
            Remind me every day
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-sand-600 dark:text-sand-400">at</span>
            <input
              type="time"
              className={`${inputClass} w-auto`}
              value={reminder.time}
              disabled={busy}
              onChange={(event) => {
                if (!event.target.value) return;
                const next = { ...reminder, time: event.target.value };
                if (reminder.enabled) void change(next);
                else setReminder(next);
              }}
            />
          </label>
        </div>
      )}

      {message && (
        <p role="status" className="mt-3 text-sm text-sand-600 dark:text-sand-300">
          {message}
        </p>
      )}
    </section>
  );
}
