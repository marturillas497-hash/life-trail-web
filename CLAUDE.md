# CLAUDE.md

Context file for continuing this project in a new chat. Read it fully before doing anything, and read `PRD.md` next to it (the product requirements). The project is in the uploaded `life-trail-web.zip`. The old `PLAN.md` belongs to the abandoned Flutter version and is out of date.

Last refreshed: November 2026, at the end of the chat that added Markdown, pictures, the warm design, shows and the Home page.

## Project

Life Trail (final name, brand kit with logo, navy, gold and green): a personal journal that runs in the browser, installs as an app (PWA) and keeps all data on the device.

- GitHub: https://github.com/marturillas497-hash/life-trail-web (private, branch `main`).
- Hosted on Vercel (free Hobby plan) at https://life-trail-web.vercel.app, auto-deploys on every push to `main`.
- Local-first. Everything works offline except TMDB search of movies and shows, and the sharper poster in the poster viewer.
- Emotion tags only, no separate mood score. Users can create their own tags and pick an emoji for each.
- The earlier Flutter/Android version (repo `life-trail`) is paused. The person chose to build the web version first and make a mobile version later.

### What exists

- **Home** (`/`): greeting, today's prompt and quick actions, streak and month counts, the last 7 days with each day's feeling (tap to read or backfill), On this day (same date in earlier years), recent entries, recently watched. The site opens here, not on the journal.
- **Journal**: entry list and detail side by side on PC, single pane on phone. Create, edit, delete. Feelings first, then text. Write for a past day from the calendar or the Home strip. Search box over titles, text and tag names.
- **Markdown entries** (Obsidian style live preview with CodeMirror 6): headings, bold, italic, strikethrough, inline code, bullet and numbered lists with auto continue, task checkboxes, quotes, rules, links, pictures. Read/Edit toggle, toolbar, Ctrl+B/I/K/E. Ctrl+Enter opens the link under the cursor, otherwise saves.
- **Pictures** in entries: upload button, paste, drag and drop, shrunk to 1600 px WebP, stored in IndexedDB, included in backup files.
- **Tags**: create, edit, archive and restore, emoji picker, color (used by Year in Pixels, mood calendar and charts).
- **Calendar**: month grid with top emojis per day, day panel, Sunday first.
- **Movies/Shows** (`/movies/`): TMDB search over movies and TV shows, manual entry with a Movie or Show choice, rating in half stars, date watched, opinion, rewatches, list with All/Movies/Shows filter, search, sort, Week/Month/Year/All watched period with arrows, equal size cards, poster viewer (press the poster), posters copied into the journal.
- **Insights**: streaks, writing stats, mood calendar (month), Year in Pixels (year), How you felt (shares that add up to 100% with change against the previous period), Days of the week. Month, Year, All time with arrows.
- **Backups**: one press Back up now (sidebar and Backup page), daily snapshots, optional automatic folder backups (Chromium File System Access API), reminder banner, download and share, restore from snapshot or file with preview and undo, Pictures card with Remove unused.
- **App lock**: PIN, recovery code, auto-lock options, lockout, erase fallback.
- **PWA**: manifest (starts at `/`), icons from the brand kit, install card, offline service worker, update bar.
- **Design**: warm palette, serif headings, light/dark/match device toggle, collapsible desktop sidebar, motion rules (see Design system).
- **Guide** (`/guide/`): the in-app How to use page, linked from the sidebar bottom and Settings. `/help/` is the separate backup explainer.
- **Settings**: How to use, Tags link, Appearance, Install, App lock, TMDB key, link to backups.

### Not built yet

- Daily note auto-created each day, and the daily reminder (postponed on purpose, see Next steps).
- Year-end recap (Spotify Wrapped style) including movies and shows.
- Export to PDF or CSV (backups are JSON only).
- Fingerprint or device unlock for the app lock (PIN only).
- Prompts and templates.
- Season level logging for shows (a show is logged as one title with its own viewings).
- Tables render as plain text in the editor, not as real tables.
- The official TMDB logo file (the person is adding `public/tmdb-logo.svg` themselves, see Gotchas).
- Mobile app version.

## About the user

- Beginner programmer. This is a learning project, so explain what each file and command does, briefly.
- Windows PC, VS Code, PowerShell (not cmd). Project folder: `C:\Users\twili\Documents\life-trail-web`. Zips are saved in `Desktop\life-trail-web-plan`.
- Uses only Brave as a browser. Important consequences, see Gotchas.
- Low disk space (under 5 GB free) and 4 GB RAM. Avoid big installs and emulators.
- Wants to see the full feature first and test later. Often says "continue", which means do the next planned item. Phone testing was explicitly set aside for now.
- Cares about how the app feels: wanted it warmer and more approachable ("black and bland" was the complaint), smooth animations, hover effects that only change colors and never make buttons rise, back buttons that look like buttons, a homepage, and an Obsidian like writing experience.
- Has not tested most parts by hand. Real browser tests are done by Claude in its sandbox (see Testing).

## Working style

- Never use em dashes.
- Keep code comments minimal and straight to the point. Use a block comment when more than one line is needed, not many inline comments.
- When code is needed, deliver a zip laid out in the project's file paths (extract into the project root), named `life-trail-web-partN.zip` (parts 1 to 8 exist so far, part 8 bundles everything done since part 7, the next is part 9), plus the PowerShell commands:
  ```powershell
  Expand-Archive -Path "$HOME\Desktop\life-trail-web-plan\life-trail-web-partN.zip" -DestinationPath . -Force
  ```
  and the `git add -A`, `git commit -m "..."`, `git push` commands. Tell the person to stop the dev server first and to run `pnpm dev:clean` afterwards. When the zip needs new packages, give the exact `pnpm add` line, and remind that `pnpm-lock.yaml` must be committed.
- A zip cannot delete files. When a part removes or moves files, give the explicit delete command. In PowerShell, paths with brackets need `-LiteralPath`.
- Give a numbered list of things to test with each part.
- Ask at most one question at a time. Ask for pasted errors instead of guessing.
- Check current package docs and versions with web search when they matter. Packages here are very new (see Versions).
- Be honest about what was and was not tested. Never claim something works that could not be run.
- Before delivering code: run `tsc --noEmit`, `eslint src`, a real `build`, and the relevant tests, then fix what they show.
- Keep `CLAUDE.md` and `PRD.md` current. Refresh both at the end of any chat that changes features.

## Versions in use (November 2026)

Next.js 16.4.3 (Turbopack, App Router), React 19.3.0, TypeScript 5.9, Tailwind CSS 4.3.3 through `@tailwindcss/turbopack`, Dexie 4.4.7, dexie-react-hooks 4.4.0, emoji-picker-react 5.1.4, serve 14.2.6 (dev dependency, for `pnpm preview`), pnpm 12.15.0 (`packageManager` in package.json), Node 24.x (`engines`; local 24.13.1).

Things that bit us:
- `cacheComponents` and `partialPrefetching` cannot be used with `output: "export"` ("PPR cannot be enabled in export mode"). They were removed.
- pnpm 12 fails an install when dependencies have unreviewed build scripts. `pnpm-workspace.yaml` (`allowBuilds: sharp: false, unrs-resolver: false`) handles it. Do not add dev tools with install scripts (such as `tsx`) to `package.json`.
- The lint rule `react-hooks/set-state-in-effect` rejects calling `setState` synchronously inside `useEffect`. Set state inside async callbacks, or derive values instead.
- `AGENTS.md` in the repo (from create-next-app) tells agents to read `node_modules/next/dist/docs/` before writing Next.js code. Do that after `pnpm install` when unsure about a Next 16 API.
- The root `.gitignore` already ignores `/out/` and `/.next/`.
- Added in this period: CodeMirror 6 (`@codemirror/state`, `view`, `commands`, `language`, `lang-markdown`, installed by the person with `pnpm add`). Vercel installs with `--frozen-lockfile`, so the updated `pnpm-lock.yaml` must be committed. Import only these direct packages. `@lezer/common` is not exposed by pnpm.

## Architecture decisions

**Static site.** `next.config.ts` has `output: "export"` and `trailingSlash: true`. Every page is static HTML. There is no server and no API route. Entry pages use query strings instead of path segments (a dynamic `[id]` route cannot be exported): `/journal/entry/?id=5`. Helpers are in `src/lib/paths.ts` (`entryPath`, `editEntryPath`, `newEntryPath`, `movieLogPath`, `addMoviePath`, `parseId`, `normalizePath`). Always link with trailing slashes. The home page redirects on the client. `useSearchParams` and `usePathname` need a Suspense boundary, provided once around the whole app in `src/app/layout.tsx`.

**Hydration safety.** Pages are prerendered at build time, so anything that depends on today's date, locale, `window` or `navigator` must wait for the browser. Use the `useIsClient()` hook in `src/lib/hooks.ts` or compute inside state initializers that only run on the client.

**Data lives in IndexedDB through Dexie.** Two separate databases, so a problem in one cannot damage the other:
- `life-trail` (Dexie version 4): `tags` (`++id, name, isArchived`), `entries` (`++id, date, *tagIds, createdAt`), `movies` (`++id, &[kind+tmdbId], title`), `movieLogs` (`++id, movieId, watchedDate, createdAt`), `images` (`++id, createdAt`).
  - Version 2 added movies. Its upgrade hook keeps a copy of the old data in memory so the backup runner can save a "before an update" snapshot (`takePendingUpgrade`).
  - Version 3 added `images` (no data change).
  - Version 4 added TV shows: every old movie gets `kind: "movie"`, and the unique index moved from `tmdbId` to `[kind+tmdbId]`, because TMDB numbers films and shows separately and one id can be both. Versions 3 and 4 have no pre-upgrade snapshot, because they change nothing that can be lost.
- `life-trail-backups`: `snapshots` (`++id, createdAt, day, kind`) and `settings` (`key`).
- Settings keys: `lastFileBackupAt`, `lastFileBackupHash`, `remindAfter`, `folderHandle`, `folderError`, `storagePersisted`, `appLock`, `tmdbKey`.
- Types are in `src/lib/types.ts`. Entry and viewing dates are local-day strings `YYYY-MM-DD` (so they never shift with time zones). Timestamps are epoch milliseconds (UTC). Tags are archived, never deleted. `Movie.kind` is `"movie"` or `"tv"`. Tag `isArchived` is 0 or 1 because IndexedDB cannot index booleans.
- Pictures are `ArrayBuffer` rows (not Blob, so they clone cleanly everywhere). Entry text refers to them as `![name](image:ID)`. Nothing deletes a picture automatically. The Backup page has Remove unused.
- Dexie gotcha: define the db with `new Dexie(...) as Dexie & {...}` (not a class with typed fields).
- When the schema changes: add a new `db.version(n)`.
- Small browser settings that must be known before first paint live in localStorage, not Dexie: `life-trail-theme` (light/dark, absent means match device) and `life-trail-sidebar` (`collapsed`). The head script in `layout.tsx` applies them (two IIFEs joined with `;`, without the `;` the second one never ran).

**Backups (src/lib/backup/).**
- File format: `{ app: "life-trail", version: 4, exportedAt, tags, entries, movies, movieLogs, images }`. Versions 1 to 3 still load (no movies, no pictures, no kinds). Validation is hand written in `format.ts` and strict: bad dates, unknown references, duplicate ids, bad ratings, bad picture data, unknown kind, duplicate `kind+tmdbId`. Every new data type must be added to the format, the hash, snapshots, restore, erase and the validator.
- `BackupData.images` is optional. Missing means "leave the pictures alone" on restore, present means replace. Daily and manual snapshots leave pictures out to stay small. The "before a restore" snapshot includes them so a restore can be undone completely. Backup files and folder backups include them as base64.
- `hashData` uses a fixed field order. Pictures and shows only add fields when they exist, so older journals keep their fingerprint.
- Snapshot kinds and retention (`retention.ts`): `auto` (one per day, refreshed in place; keep newest 7 plus the newest of each of the last 4 weeks), `manual` (10), `pre-restore` (5), `pre-upgrade` (3).
- A journal is empty only when it has no entries and no movie logs (`hasContent`). Empty journals never produce snapshots or files.
- Restore replaces everything and never merges, and always saves a "before a restore" snapshot first.
- One press backup (`quickBackup` in `files.ts`): saved folder with permission handling, picker on first use, plain download when the browser has no folder access (Brave until the flag is on).
- Folder backups write `life-trail-backup-YYYY-MM-DD.json` (newest 30 kept). The permission must be re-granted by a click in new sessions.
- The TMDB key and the app lock settings are deliberately not in backups.
- `BackupRunner` (mounted in `AppShell`) runs the automatic steps on open and when the tab is hidden.

**App lock (src/lib/lock/).** PIN of 4 to 8 digits hashed with PBKDF2 (SHA-256, 200,000 rounds, random salt) through WebCrypto. A recovery code (16 characters, shown once) is hashed the same way. After every 5 wrong tries the lockout is 30 seconds, doubling up to 10 minutes. Auto-lock options: immediately when leaving, 1, 5 or 15 minutes (default 1), or only on open. The app always starts locked after a reload. The lock screen is an overlay and the app underneath gets `inert`, so unsaved drafts survive. Last resort "erase everything" requires typing ERASE. It is a privacy screen, not encryption: data in IndexedDB is not encrypted, and the Settings page says so. WebCrypto needs https or localhost.

**PWA and offline.**
- `scripts/generate-sw.mjs` runs after `next build` (the `build` script is `next build && node scripts/generate-sw.mjs`). It lists every file in `out/` and writes `out/sw.js` with a content-based version. The service worker precaches everything, answers cache-first ignoring query strings, and falls back to the cached `/journal/` for navigations.
- A new version waits until the person presses "Reload to update" (`ServiceWorkerRegister`). It never reloads on its own, so drafts are safe.
- The service worker only registers in production builds. `pnpm preview` serves `out/` on port 4000, a different origin from the dev server on 3000, so the service worker never interferes with development. Do not preview on port 3000.
- Cross-origin requests (TMDB) are not cached by the service worker.

**Movies, shows and TMDB.** The site has no server, so each user pastes their own free TMDB key in Settings (stored in `life-trail-backups` settings). A v3 API key (32 hex characters, sent as `api_key`) or a v4 Read Access Token (starts with `eyJ`, sent as a bearer header) both work. Search uses `/3/search/multi` (films and TV shows, people are skipped) with no slash before the `?`, because TMDB rejects cross origin calls to that form. A result is `{ kind, tmdbId, title, year, overview, posterPath }` where a show's title comes from `name` and its year from `first_air_date`. Posters are copied as data URLs so they work offline. The poster viewer loads a sharper `w780` copy from TMDB when online. Real TMDB responses are untested (the sandbox cannot reach TMDB), the browser tests use request interception.

**Markdown editor (src/components/markdown/).** CodeMirror 6 with `markdown({ base: markdownLanguage })`. The default base is plain CommonMark and has no tasks, strikethrough or bare links. `livePreview.ts` walks the syntax tree and hides markers except on the line or element the cursor touches (replace decorations are also provided as `atomicRanges` so arrow keys skip them). Widgets: bullets, checkboxes (click toggles `[ ]`/`[x]`), pictures, rules. The facet `readingMode` switches the same editor between writing and reading (Read/Edit button, Ctrl+E). `MarkdownView` is the same thing locked to reading and is used on the entry page. Keys: Ctrl+Enter opens the link under the cursor and returns false off a link, so `useSaveShortcut` saves. The default Mod-Enter blank line binding is filtered out on purpose. Only http, https, mailto and bare domains open (`safeUrl`). Previews and word counts use `plainText()` from `src/lib/markdown.ts`.

**Design system.**
- Tokens in `globals.css` `@theme`: `sand` (cream to the logo navy, replaced zinc), `brand` (forest green, the main accent, replaced indigo), `gold` (the sun, used for the active nav item and highlights), `--font-display` (a system serif stack for headings, no web fonts).
- Dark mode is class based: `@custom-variant dark (&:where(.dark, .dark *))`, with `html.dark` and `html.light` set before paint. Settings has Match device, Light, Dark.
- Collapsible sidebar through `@custom-variant collapsed` on `html[data-sidebar="collapsed"]`.
- Motion rules: all interactive elements ease colors only (`@layer base` transition on a, button, inputs). Buttons never rise, scale or move on hover. Allowed animations: page fade (`template.tsx`), dialog fade and pop, bars growing, sidebar width. `prefers-reduced-motion` turns everything off.
- Shared pieces: `ui.ts` class strings (`btnPrimary`, `btnSecondary`, `btnBack`, `cardClass`, `inputClass`), `BackLink` (back and cancel look like buttons), `Segmented`, `Lightbox`.

**Navigation.** The `NAV` array in `AppShell.tsx` (Home, Journal, Calendar, Movies/Shows, Insights, Tags, Backup, Settings). `mobile: false` hides an item from the phone tab bar (Tags and Backup, both reachable from Settings). Sidebar bottom: Back up now, How to use, Collapse. The logo links home. The manifest `start_url` is `/` (its `id` stays `/journal/` so installed copies are not treated as a new app).

**Keyboard shortcuts.** Ctrl+Enter saves entry, edit, viewing and tag (opens a link when on one in the editor), Ctrl+S saves an entry, Ctrl+B/I/K and Ctrl+E in the editor, Alt+N new entry, Esc closes dialogs and the poster viewer. Ctrl+N cannot be used because browsers reserve it.

**Deployment (Vercel).** `vercel.json` sets `"framework": null` (plain static site), `outputDirectory: "out"`, `trailingSlash: true`, install and build commands pinned to `npx --yes pnpm@12.15.0 ...` (Vercel only documents pnpm up to 10), a no-cache header for `/sw.js`, immutable caching for `/_next/static/`, and basic security headers. Setting the framework to Next.js together with `outputDirectory: "out"` fails with NEXT_NO_ROUTES_MANIFEST, which is why the framework is null. Keep Vercel "Deployment Protection" off for production, or the manifest and service worker get a login redirect and install breaks. `robots.txt` and a meta tag keep the site out of search engines.

**Origin-bound data.** The journal belongs to one exact web address. localhost:3000, localhost:4000 and the Vercel address each have their own journal. Renaming the project, changing the domain or adding a custom domain starts an empty journal there. Move data with a backup file (download there, restore here), then re-enter the TMDB key and set the app lock again.

## Project structure

```
src/
  app/
    layout.tsx, template.tsx, manifest.ts, globals.css, favicon.ico, apple-icon.png
    page.tsx                    Home
    journal/ (layout, page, new/, entry/, entry/edit/)
    calendar/  tags/  insights/  backup/  help/  guide/  settings/
    movies/page.tsx            list, filters, period view
    movies/add/page.tsx        search or manual, rate (?movieId= logs another viewing)
    movies/log/page.tsx        one viewing (?id=)
  components/
    AppShell, BackLink, ConfirmDialog, Lightbox, Segmented, ThemeCard, ui.ts
    EntryList, EntryDetail, EntryForm, CalendarView, TagChip, TagEditorDialog, EmojiPickerPanel
    InsightsView, YearInPixels, insights/ (FeelingsCard, MoodCalendar, WeekCard)
    home/HomeView
    markdown/ (MarkdownEditor, MarkdownView, livePreview)
    backup/   BackupRunner, BackupBanner, StatusCard, QuickBackupCard, useQuickBackup, ManualBackupCard,
              FolderBackupCard, SnapshotsCard, RestoreFileCard, ImagesCard
    lock/     LockOverlay, AppLockCard, PinField, RecoveryCodeBox
    movies/   Poster, EnlargeablePoster, KindBadge, StarRating, MovieLogForm, MovieCard, TmdbKeyCard, TmdbAttribution
    pwa/      ServiceWorkerRegister, InstallCard
  lib/
    db, types, defaultTags, dates, paths, hooks, entries, tags, tagColors, calendar, movies, tmdb, install
    markdown, images, insights, watchPeriod, theme, sidebar, useSaveShortcut
    backup/   format, retention, store, snapshots, files, runner, hooks
    lock/     crypto, store, actions, context, erase
scripts/    generate-sw.mjs, clean.mjs, patch-package-json.mjs (already applied)
public/     icons/, logo-mark.png, robots.txt, tmdb-logo.svg (added by the person)
```

## Commands

```powershell
pnpm dev          # dev server, http://localhost:3000, no service worker
pnpm dev:clean    # delete .next, then dev (use after extracting a zip)
pnpm build        # static export to out/ plus out/sw.js
pnpm preview      # serve out/ at http://localhost:4000 (run pnpm build first)
pnpm lint
```

The `start` script (`next start`) does not work with a static export and can be ignored.

## Gotchas and known issues

- **Stale CSS in dev.** The calendar once rendered without its grid styles because the dev server kept CSS generated before the file existed. It could not be reproduced in the sandbox. Fix: stop the server, `pnpm dev:clean`, hard refresh (Ctrl+Shift+R).
- **Brave.** The File System Access API is off by default in Brave, so automatic folder backups show "not supported" until the person enables `brave://flags/#file-system-access-api` and restarts. Download backup, Share and the reminder banner work without it. The install icon may not show in Brave's address bar, so use the menu. If Brave is set to clear site data on exit, the journal would be wiped each time.
- **Insecure addresses.** Install, offline and the app lock need https or localhost. They will not work on a PC's network address such as http://192.168.x.x.
- **Offline console noise.** While offline, `HEAD` requests for link prefetching fail in the console. Harmless.
- **Cruft in the zip.** The uploaded zip contains `out/` (build output, ignore it) and default `README.md`. The unused starter SVGs are in `public/`.
- **Untested by Claude** (could not run in the sandbox): real TMDB responses and the real key flow, the Vercel build and its routing (the person's build log showed install and build working, and they reported the deployment working after the output directory fix), the real folder picker, real devices, Brave itself.
- **TMDB logo.** TMDB requires its approved logo. It could not be fetched from the sandbox. The person saves the official file as `public/tmdb-logo.svg` (from themoviedb.org/about/logos-attribution) and the notice component shows it next to the text. Do not use third party copies.
- **Mobile bar.** The phone tab bar has six items (Home, Journal, Calendar, Movies/Shows, Insights, Settings). Adding a seventh needs a different layout.
- **Scratch tests and the build.** Keep the `scratch/` test folder out of the project while running `next build`, it breaks the type check.
- **Untested by Claude** (could not run in the sandbox): real TMDB responses (movies and shows), the real folder picker, Brave itself, real phones, the Vercel build and routing after the latest changes.

## Testing (how Claude verified things)

The sandbox resets between chats, so recreate what is needed. `life-trail-tests.zip` holds the scripts below (updated this chat).

- **Install and build.** Unzip the project, `npm install` works in the sandbox (npm registry is reachable), `npm run build` produces `out/`, then `node scripts/generate-sw.mjs`. Exact pnpm behaviour can be checked with `npm i -g pnpm@12.15.0` and `pnpm install --frozen-lockfile`.
- **Real browser.** In this chat a Chrome was already installed at `/opt/google/chrome/chrome`. Use `npm i puppeteer-core` and launch with `executablePath: "/opt/google/chrome/chrome"`, `headless: "new"`, `args: ["--no-sandbox", "--disable-gpu"]`. If it is missing, the older recipe was `@sparticuz/chromium`. Serve `out/` with `python3 -m http.server 3300` started with `setsid nohup`, from inside `out/`.
- **Servers in the sandbox.** Start them in the same command as the test or with `setsid nohup`. Never use `pkill -f "next dev"` inside a command containing that text, use `fuser -k PORT/tcp`.
- **Unit tests.** `fake-indexeddb/auto` plus `tsx`, importing the app's modules from a `scratch/` folder: `formattest`, `movietest`, `upgradetest`, `locktest`, `imagetest`, `showtest`. Install `tsx`, `fake-indexeddb`, `jsdom` only in the sandbox and restore `package.json` afterwards (do not deliver them).
- **Browser suites** (`browser/`): `editor.mjs` (Markdown, links, Ctrl+Enter, pictures, reader, sidebar), `features.mjs` (reading view, Ctrl+Enter save, poster viewer, insights, guide), `shows.mjs` (shows, Home, phone bar). They seed IndexedDB directly and intercept TMDB.
- **TMDB.** The sandbox cannot reach TMDB. Tests intercept `api.themoviedb.org` and `image.tmdb.org` with puppeteer request interception.
- **Helper gotchas.** Triple-click does not select text in password inputs, so focus then call `el.select()`. Typing an empty string does not clear a field, press Backspace. Simulate leaving the tab by overriding `document.visibilityState`. When a test clicks a card with an offset, mind the card width.
- **What a browser test caught that tsc and lint did not:** two start-up scripts joined without a `;` (the sidebar state never loaded); the Markdown parser lacking GitHub features; the same TMDB id existing for a film and a show.

## Next steps

1. Ask what the person wants next. Candidates:
   - Year-end recap including movies and shows.
   - Daily note and reminder. Reality check already given: browsers cannot reliably fire scheduled notifications when the app is closed. A real reminder needs Web Push plus a server that sends it on a schedule. The recommendation is to build the daily note now and do the reminder in the mobile version.
   - Export to PDF or CSV.
   - Season level logging for shows.
   - Prompts and templates, a name for the greeting on Home, fingerprint unlock through WebAuthn.
2. Later: a mobile version. The static export is compatible with wrapping the site in Capacitor (Android app, native notifications). Not started.
3. Remind the person to commit and push after each part, and to test the Vercel deployment at its address.

## Open questions

- What to do about the paused Flutter repo (keep as is, archive).
- Whether shows need seasons.
- Whether to add a name setting for the Home greeting.
