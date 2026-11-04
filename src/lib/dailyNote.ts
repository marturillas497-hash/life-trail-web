import { formatFullDate } from "./dates";

/* The sections a new daily note starts with. It can be changed or emptied in Settings. */
export const DEFAULT_TEMPLATE = "## Highlights\n\n\n## On my mind\n\n\n## Grateful for\n\n";

export const TEMPLATE_KEY = "dailyTemplate";

/* One question per day, picked by the date so it is the same all day and the same on every device. */
export const PROMPTS = [
  "What made you smile today?",
  "What is one thing you are grateful for right now?",
  "What did you learn today?",
  "Who made your day better, and how?",
  "What was the hardest part of today?",
  "What are you looking forward to tomorrow?",
  "What is on your mind that you have not said out loud?",
  "What did you do today that you are proud of?",
  "Describe today in three words, then say why.",
  "What would you tell yourself this morning, knowing how the day went?",
  "What small moment do you want to remember?",
  "What drained your energy today, and what gave you energy?",
  "What did you eat, hear or see today that stood out?",
  "What are you avoiding, and why?",
  "What would make tomorrow a good day?",
  "What did you do for yourself today?",
  "What surprised you today?",
  "Which conversation from today stays with you?",
  "What is something you changed your mind about recently?",
  "What is a worry you can let go of tonight?",
  "What did you finish today, big or small?",
  "What did you start today?",
  "How did your body feel today?",
  "What song, show or movie fit your mood today?",
  "What is something kind you did, or someone did for you?",
  "What do you need more of in your days?",
  "What do you need less of?",
  "What did you notice outside today?",
  "What is a goal you moved closer to?",
  "What would you do tomorrow if you were not afraid?",
  "What is one thing you wish you had said or done differently?",
  "What is something you are curious about lately?",
  "Who do you miss, and what would you tell them?",
  "What did you spend your time on, and was it worth it?",
  "What made you laugh?",
  "What is a habit you are building or breaking?",
  "What place would you like to be right now?",
  "What did you do today that future you will thank you for?",
  "What was the best part of the day?",
  "What is something ordinary you are thankful for?",
  "What are you learning about yourself this week?",
  "What would a perfect ordinary day look like?",
  "What is a memory that came back to you today?",
  "What is one thing you can forgive yourself for?",
  "What do you want to remember about this season of life?",
  "What was the most peaceful moment today?",
  "What is something you are proud of that nobody knows?",
  "If today had a title, what would it be?",
  "What did you do for someone else today?",
  "What is weighing on you, and what is one small step?",
  "What are you excited about?",
  "What did you read or watch that made you think?",
  "What is a boundary you kept or want to set?",
  "How are you different from this time last year?",
  "What gave you hope today?",
  "What is one thing you want to do more slowly?",
  "What are three things that went well today?",
  "What kind of day was it: busy, slow, heavy or light? Why?",
  "What do you like most about where you are in life right now?",
  "What do you want tomorrow's you to know?",
];

export function promptFor(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
  return PROMPTS[((dayNumber % PROMPTS.length) + PROMPTS.length) % PROMPTS.length];
}

/* Fills in {{date}}, {{weekday}} and {{prompt}}. Anything else in double braces is left alone. */
export function renderTemplate(template: string, dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const weekday = new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: "long" });
  return template.replace(/\{\{\s*(date|weekday|prompt)\s*\}\}/gi, (_all, name: string) => {
    switch (name.toLowerCase()) {
      case "date":
        return formatFullDate(dateKey);
      case "weekday":
        return weekday;
      default:
        return promptFor(dateKey);
    }
  });
}
