import { getSetting, setSetting } from "@/lib/backup/store";
import { isNative } from "./platform";

const REMINDER_ID = 1001;
const CHANNEL_ID = "daily-note";

/* time is "HH:MM" in 24 hour form. Stored on this device only, never in backups. */
export type Reminder = { enabled: boolean; time: string };

export const DEFAULT_REMINDER: Reminder = { enabled: false, time: "20:00" };

export type ReminderResult = "ok" | "denied" | "unavailable";

export async function getReminder(): Promise<Reminder> {
  return (await getSetting<Reminder>("reminder")) ?? DEFAULT_REMINDER;
}

function parseTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(":").map(Number);
  return {
    hour: Number.isInteger(hour) && hour >= 0 && hour < 24 ? hour : 20,
    minute: Number.isInteger(minute) && minute >= 0 && minute < 60 ? minute : 0,
  };
}

async function plugin() {
  return (await import("@capacitor/local-notifications")).LocalNotifications;
}

async function schedule(time: string): Promise<void> {
  const notifications = await plugin();
  await notifications.createChannel({
    id: CHANNEL_ID,
    name: "Daily reminder",
    description: "A gentle nudge to write today's note",
    importance: 3,
  });
  await notifications.cancel({ notifications: [{ id: REMINDER_ID }] });
  await notifications.schedule({
    notifications: [
      {
        id: REMINDER_ID,
        title: "Life Trail",
        body: "How was your day? Take a minute to write it down.",
        channelId: CHANNEL_ID,
        schedule: { on: parseTime(time), allowWhileIdle: true },
      },
    ],
  });
}

/* Turns the reminder on or off. Turning it on asks Android for permission first. */
export async function applyReminder(next: Reminder): Promise<ReminderResult> {
  if (!isNative()) return "unavailable";
  const notifications = await plugin();

  if (!next.enabled) {
    await notifications.cancel({ notifications: [{ id: REMINDER_ID }] });
    await setSetting("reminder", next);
    return "ok";
  }

  let permission = await notifications.checkPermissions();
  if (permission.display !== "granted") permission = await notifications.requestPermissions();
  if (permission.display !== "granted") return "denied";

  await schedule(next.time);
  await setSetting("reminder", next);
  return "ok";
}

/*
Runs when the app opens. It re-applies a saved reminder, and switches the
setting off if Android permission was taken away so the toggle stays honest.
*/
export async function syncReminder(): Promise<void> {
  const saved = await getReminder();
  if (!saved.enabled) return;
  const notifications = await plugin();
  const permission = await notifications.checkPermissions();
  if (permission.display === "granted") {
    await schedule(saved.time);
  } else {
    await setSetting("reminder", { ...saved, enabled: false });
  }
}
