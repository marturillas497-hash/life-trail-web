import { todayKey } from "./dates";
import { db } from "./db";
import { dailyNotePath, editEntryPath } from "./paths";

/* Where "today's note" leads: the first entry written today if there is one, otherwise a fresh note from the template. */
export async function todayNotePath(): Promise<string> {
  const todays = await db.entries.where("date").equals(todayKey()).sortBy("createdAt");
  return todays.length > 0 ? editEntryPath(todays[0].id) : dailyNotePath();
}
