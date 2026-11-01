/* Deletes the .next folder (the dev server's cache) so the next start is fresh. */
import { rmSync } from "node:fs";

rmSync(".next", { recursive: true, force: true });
console.log("Removed .next");
