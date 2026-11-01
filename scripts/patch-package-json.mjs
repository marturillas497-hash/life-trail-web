/* Run once: node scripts/patch-package-json.mjs
   Makes `pnpm build` also write the service worker, and adds `pnpm preview` (port 4000)
   and `pnpm dev:clean` (starts the dev server with a fresh cache). */
import { readFile, writeFile } from "node:fs/promises";

const file = "package.json";
const pkg = JSON.parse(await readFile(file, "utf8"));
pkg.scripts = {
  ...pkg.scripts,
  build: "next build && node scripts/generate-sw.mjs",
  preview: "serve out -l 4000",
  "dev:clean": "node scripts/clean.mjs && next dev",
};
await writeFile(file, JSON.stringify(pkg, null, 2) + "\n");
console.log("package.json updated. Scripts now:", pkg.scripts);
