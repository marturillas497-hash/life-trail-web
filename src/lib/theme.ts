/* "oled" is the dark theme with true black surfaces, which switches off OLED pixels. */
export type ThemeChoice = "system" | "light" | "dark" | "oled";

export const THEME_KEY = "life-trail-theme";
const LIGHT_BAR = "#102e46";
const DARK_BAR = "#0a1c2b";
const OLED_BAR = "#000000";

export function readTheme(): ThemeChoice {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" || value === "oled" ? value : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(choice: ThemeChoice) {
  const dark =
    choice === "dark" ||
    choice === "oled" ||
    (choice === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.classList.toggle("light", !dark);
  root.classList.toggle("oled", choice === "oled");
  const bar = choice === "oled" ? OLED_BAR : dark ? DARK_BAR : LIGHT_BAR;
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", bar));
}

export function saveTheme(choice: ThemeChoice) {
  try {
    if (choice === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    /* Storage blocked: the choice still applies until the page is closed. */
  }
  applyTheme(choice);
}

/* Runs before first paint so the page never flashes the wrong theme. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");var o=t==="oled";var d=o||t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.add(d?"dark":"light");if(o)r.classList.add("oled")}catch(e){}})()`;
