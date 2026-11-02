/* Plain helpers for entry text written in Markdown. No browser APIs, so they are easy to test. */

/* Matches ![alt](image:12) and captures the id. */
const LOCAL_IMAGE = /!\[[^\]\n]*\]\(image:(\d+)\)/g;

export function referencedImageIds(bodies: string[]): Set<number> {
  const ids = new Set<number>();
  for (const body of bodies) {
    for (const match of body.matchAll(LOCAL_IMAGE)) ids.add(Number(match[1]));
  }
  return ids;
}

export function parseImageId(src: string): number | null {
  const match = /^image:(\d+)$/.exec(src.trim());
  return match ? Number(match[1]) : null;
}

/* The Markdown for a picture. Brackets in the name would break the syntax, so they are dropped. */
export function imageMarkdown(id: number, name: string): string {
  const alt = name.replace(/\.[a-z0-9]+$/i, "").replace(/[[\]()\n\r]/g, " ").replace(/\s+/g, " ").trim();
  return `![${alt}](image:${id})`;
}

/*
The address to open for a link, or null if it is not safe to open.
Only web and email links are allowed. Bare addresses like example.com get https.
*/
export function safeUrl(raw: string): string | null {
  const url = raw.trim().replace(/^<|>$/g, "");
  if (/^(https?:\/\/|mailto:)\S+$/i.test(url)) return url;
  if (/^www\.\S+$/i.test(url)) return `https://${url}`;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(url)) return `https://${url}`;
  return null;
}

/* Entry text with the Markdown symbols removed, for list previews and word counts. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/```[^\n]*\n?/g, "")
    .replace(/!\[([^\]\n]*)\]\([^)\n]*\)/g, (_all, alt: string) => (alt.trim() ? `[${alt.trim()}]` : "[image]"))
    .replace(/\[([^\]\n]+)\]\([^)\n]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*>+\s?/gm, "")
    .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/gm, "")
    .replace(/^\s*([-*+]|\d+[.)])\s+/gm, "")
    .replace(/^\s*([-*_]\s*){3,}$/gm, "")
    .replace(/(\*\*|__|~~)(?=\S)(.+?)(?<=\S)\1/g, "$2")
    .replace(/(?<![\w*])\*(?=\S)([^*\n]+?)(?<=\S)\*(?![\w*])/g, "$1")
    .replace(/(?<![\w_])_(?=\S)([^_\n]+?)(?<=\S)_(?![\w_])/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}
