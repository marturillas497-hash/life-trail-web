# Life Trail: Product Requirements Document

Version 1.0, November 2026. Owner: Arendiem. Companion file: `CLAUDE.md` (technical context and working rules). When the two disagree about what the product should do, this document wins. When they disagree about how it is built, `CLAUDE.md` wins.

## 1. Summary

Life Trail is a private journal that runs in the browser, installs like an app, works offline, and keeps everything on the owner's own device. Entries are written in Markdown, tied to how the writer feels, and can hold pictures. The same app also keeps a log of movies and TV shows watched, and turns the writing into insights such as streaks, a mood calendar and a Year in Pixels.

There is no account, no server and no tracking. The journal is read only by whoever holds the device.

## 2. Problem and opportunity

- Most journaling apps need an account, store entries on someone else's server, or lock useful features behind a subscription.
- Mood trackers ask for a number each day, which feels like homework. Writing about a day and naming the feeling is more natural.
- People who like Obsidian enjoy plain Markdown and a calm editor, but a vault of files is more than a daily diary needs.
- A person who keeps a diary often also wants to remember what they watched and what they thought of it.

Life Trail serves one person first (the owner, a student learning to program), and is built so that others could use it later without any change to how privacy works.

## 3. Users

| Who | Needs | Notes |
|---|---|---|
| Primary: the owner | A private place to write daily, look back, see patterns, remember what was watched | Windows PC, Brave browser, low disk space. Phone use comes later |
| Secondary: friends and family the owner shares the link with | Same, with their own journal on their own device | Each person pastes their own free TMDB key. Nothing is shared between devices |

Not targeted: teams, public blogging, people who need sync across devices, or anyone who needs a server side backup.

## 4. Product principles

1. **Private by construction.** Data never leaves the device unless the person downloads a file. The only outgoing requests are to TMDB, and only when searching or viewing a poster.
2. **Calm and warm.** The app should feel approachable, never clinical. Soft colors, a serif heading font, gentle motion.
3. **Write first.** The shortest path from opening the app to typing a sentence should stay short. Home puts "Write today's entry" at the top.
4. **Safe by default.** Nothing is lost by a wrong click: deletes ask first, restores save a safety copy, archived tags keep old entries correct.
5. **Honest limits.** The app says plainly what it cannot do (browser storage can be erased, folder saving needs a flag in Brave) and offers a workaround.
6. **Keyboard friendly.** Common actions have shortcuts, and nothing needs a mouse except picking things.

## 5. Scope

### In scope

Writing, tags, calendar, pictures, Markdown, search, movies and shows log, insights, backups and restore, app lock, offline use, installing as an app, light and dark themes, an in-app guide.

### Out of scope (for now)

Accounts, cloud sync, sharing entries, collaborative editing, a server, analytics, ads, payments, AI features, importing from other apps, a native mobile app (planned later, see section 11).

## 6. Feature requirements

Status key: **Done** (built and tested in a real browser by Claude), **Done, partly untested** (built, but something could not be run in the sandbox), **Planned**.

### 6.1 Home

| ID | Requirement | Status |
|---|---|---|
| H1 | The site opens on Home, not on the journal. Installed copies also start there | Done |
| H2 | Time of day greeting and today's date | Done |
| H3 | One clear primary action: open today's note (or continue it, read it, or write another entry) | Done |
| H4 | Quick action to log a movie or show. First time visitors also see a link to the guide | Done |
| H5 | Day streak, entries this month, titles watched this month | Done |
| H6 | The last 7 days as tiles showing each day's main feeling. Tapping opens that day's entry, or starts a note from the template for a past empty day | Done |
| H7 | "On this day": entries from the same date in earlier years, hidden when there are none | Done |
| H8 | Three most recent entries and three most recently watched titles, each linking to the full page | Done |
| H9 | A name for the greeting | Planned (open question) |

### 6.2 Journal and writing

| ID | Requirement | Status |
|---|---|---|
| J1 | Create, edit and delete entries, each with a date, optional title, text and at least one feeling tag | Done |
| J2 | Two pane layout on large screens, single pane on phones | Done |
| J3 | Write for a past day from the calendar or the Home strip, using the template for that day. Future days are not allowed | Done |
| J4 | Search over titles, text and tag names. Every typed word must match | Done |
| J5 | Entry text is Markdown shown as a live preview: headings, bold, italic, strikethrough, inline code, lists that continue on Enter, task checkboxes that can be ticked, quotes, rules. Tables stay as plain text | Done |
| J6 | The syntax marks hide until the cursor touches that line or word, as in Obsidian | Done |
| J7 | A Read button (and Ctrl+E) switches the editor to a reading view where nothing can change | Done |
| J8 | A toolbar for bold, italic, heading, link, list, checklist, quote and picture, plus Ctrl+B, Ctrl+I, Ctrl+K | Done |
| J9 | Links: Ctrl+Enter or Ctrl+click opens the link under the cursor in a new tab. In saved entries a normal click opens it. Only web and email links open | Done |
| J10 | Ctrl+Enter saves entries, edits, viewings and tags when the cursor is not on a link. Ctrl+S also saves entries | Done |
| J11 | Pictures: add by button, paste or drag and drop. Shrunk to a sensible size, shown inline, and opened larger on click. Pictures no entry uses can be removed from the Backup page | Done |
| J12 | Daily note: one press (Home button or Alt+T) opens today's note from an editable template, with the cursor ready and a question of the day above it. If today already has an entry, the same press continues it. Nothing is saved until the person writes and saves, so there are no empty entries | Done |
| J13 | One daily prompt (60 rotating questions) and one editable template in Settings with {{date}}, {{weekday}} and {{prompt}}. More than one template | Done for one template, more templates planned |
| J14 | Real tables in the editor | Planned (low) |

### 6.3 Tags (feelings)

| ID | Requirement | Status |
|---|---|---|
| T1 | A starter set of 16 feelings, each with an emoji and a color | Done |
| T2 | Create, rename, change emoji and color. Archive and restore instead of deleting, so old entries stay correct | Done |
| T3 | Create a tag from inside the entry form | Done |

### 6.4 Calendar

| ID | Requirement | Status |
|---|---|---|
| C1 | Month grid showing the top feelings of each day, with previous and next month | Done |
| C2 | Selecting a day lists its entries and offers to write one for it | Done |

### 6.5 Movies and shows

| ID | Requirement | Status |
|---|---|---|
| M1 | Search TMDB for movies and TV shows in one search. People are not shown. Results are marked Movie or Show | Done, partly untested (real TMDB responses not tried) |
| M2 | Log a viewing with a rating from half a star to five, a watched date (not in the future) and an optional opinion | Done |
| M3 | The same title can be logged many times. Each viewing keeps its own rating, date and opinion | Done |
| M4 | Add by hand when offline or when TMDB lacks the title, choosing Movie or Show | Done |
| M5 | The list shows equal size cards, with a filter for All, Movies or Shows, a title search and a sort (recent, rating, title) | Done |
| M6 | A watched period view: Week, Month, Year or All, with arrows. The counts and average rating follow the filters | Done |
| M7 | Pressing a poster opens it enlarged. A sharper copy loads from TMDB when online | Done |
| M8 | Posters are copied into the journal so they show offline | Done |
| M9 | The TMDB attribution notice and the official logo are shown | Done, logo file is added by the owner |
| M10 | Season level logging for shows | Planned |

### 6.6 Insights

| ID | Requirement | Status |
|---|---|---|
| I1 | Period switch: Month, Year, All time, with arrows | Done |
| I2 | Current and longest streak, entries, days written, words (Markdown symbols not counted) | Done |
| I3 | Mood calendar for a month: one square per day with its main feeling | Done |
| I4 | Year in Pixels for a year: one pixel per day colored by the feeling used most that day, ties going to the one chosen first. Tapping a day reads or writes that day | Done |
| I5 | How you felt: one bar split between feelings so the parts add up to 100%, a sentence naming the top feeling, and the change since the previous month or year | Done |
| I6 | Days of the week: the main feeling for each weekday, once there are at least 7 entries | Done |
| I7 | Year-end recap including movies and shows | Planned |

### 6.7 Backups and restore

| ID | Requirement | Status |
|---|---|---|
| B1 | A daily snapshot kept inside the browser, with a retention rule | Done |
| B2 | One press Back up now. First use asks for a folder. After that one press saves a file there | Done, partly untested (real folder picker, Brave) |
| B3 | When the browser cannot save into a folder, the same button downloads the file instead. Brave users get steps to switch folder saving on | Done |
| B4 | A reminder banner when the journal has not been saved to a file for a while | Done |
| B5 | Backup files include pictures. Daily and manual snapshots do not, to stay small | Done |
| B6 | Restore from a snapshot or a file after a preview. A copy of the current journal is saved first, so the restore can be undone | Done |
| B7 | Older backup files (versions 1 to 3) still load. Damaged files are refused with a clear message | Done |
| B8 | Export to PDF or CSV | Planned |
| B9 | Optional backup to the owner's own Google Drive with one press, using only the non-sensitive `drive.file` scope. Free to use. Needs a one time Google Cloud setup by the owner. Cannot run in the background in a site with no server | Planned (researched) |

### 6.8 Privacy and security

| ID | Requirement | Status |
|---|---|---|
| S1 | App lock with a 4 to 8 digit PIN, a recovery code shown once, auto lock choices and a growing lockout after wrong tries | Done |
| S2 | Erase everything as the fallback when both the PIN and the recovery code are lost | Done |
| S3 | The TMDB key and the lock settings are never included in backups | Done |
| S4 | Fingerprint or device unlock | Planned |
| S5 | Links never run code. Only http, https and mailto links and bare web addresses open | Done |

### 6.9 App behaviour

| ID | Requirement | Status |
|---|---|---|
| A1 | Installable as an app, with brand icons | Done |
| A2 | Works offline. A new version waits for the person to press "Reload to update", so a draft is never lost | Done |
| A3 | Light, dark or match device, chosen in Settings and remembered | Done |
| A4 | A collapsible sidebar on large screens that remembers its state | Done |
| A5 | A bottom tab bar with six items on phones | Done |
| A6 | Back and Cancel links look like buttons | Done |
| A7 | Motion is gentle. Hovering changes colors only and never moves or resizes a control. Respects "reduce motion" | Done |
| A8 | An in-app guide (How to use) from the sidebar and from Settings | Done |

## 7. Data model

All data is stored in the browser (IndexedDB).

| Entity | Main fields |
|---|---|
| Tag | id, name, emoji, color, isArchived, createdAt |
| Entry | id, date (YYYY-MM-DD), title, body (Markdown), tagIds, createdAt, updatedAt |
| Image | id, name, type, width, height, data (the picture bytes), createdAt. Referenced from an entry as `![name](image:ID)` |
| Movie (a movie or a show) | id, kind (`movie` or `tv`), tmdbId (or none), title, year, overview, posterPath, posterData, createdAt, fetchedAt |
| MovieLog (one viewing) | id, movieId, rating (0.5 to 5), opinion, watchedDate, createdAt, updatedAt |
| Snapshot | id, createdAt, day, kind (auto, manual, pre-restore, pre-upgrade), counts, hash, data |
| Setting | key, value (backup reminders, folder handle, app lock, TMDB key and so on) |

Rules: dates are local days so they never shift with time zones. A tag is archived, never deleted. A movie that loses its last viewing is removed. TMDB ids are unique only together with the kind. A journal counts as empty only when it has no entries and no viewings, and an empty journal never overwrites good backups.

## 8. Non-functional requirements

| Area | Requirement |
|---|---|
| Privacy | No accounts, no analytics, no third party scripts. The site is marked noindex |
| Offline | Everything except TMDB search and the sharper poster works without a connection |
| Data safety | Daily snapshot, file backups, restore with undo. The app warns that browser data can be erased and nudges toward file backups |
| Performance | Entries and the journal list stay fast with years of daily entries. Pictures are shrunk before storing. Large lists are not rendered with heavy components |
| Accessibility | Keyboard reachable controls, visible focus, labelled buttons, live regions for status messages, reduced motion respected, readable contrast in both themes |
| Browsers | Current Chromium based browsers first (the owner uses Brave). Firefox and Safari should work for everything except saving into a folder |
| Storage | Uses the browser's storage quota. The app asks the browser to keep the data persistent |
| Security | App lock uses PBKDF2 hashing through WebCrypto. Backups are plain JSON and are only as private as where they are saved |
| Hosting | A static site on Vercel's free plan, deployed from the `main` branch |

## 9. Technical constraints that shape the product

- **Static site, no server.** So there is no sync, no server side reminders and no shared TMDB key. Each person pastes their own free TMDB key.
- **Origin bound data.** The journal belongs to one exact web address. Changing the domain starts an empty journal there. Moving needs a backup file.
- **Browser limits.** Folder saving needs the File System Access API, which Brave turns off by default. Install, offline and the lock need https or localhost.
- **Scheduled reminders** cannot fire reliably from a closed web app. A real reminder needs a server and web push, or the later mobile version. The daily note is built without one.
- **Google accounts.** A site with no server can use Google sign in only for short lived access tokens, with no refresh token. So Google Drive backup can be a one press button but not a silent background sync.

## 10. Current status

Built and tested in a real browser by Claude: everything marked Done above, including the daily note.

Not tested yet, and the first things to check by hand:

1. A real TMDB search that returns shows (for example Loki), with the owner's key.
2. The folder picker and the one press backup in Brave after enabling the flag.
3. Everything on a phone.
4. The Vercel build and the live site after the latest push.

## 11. Roadmap

| Order | Item | Why |
|---|---|---|
| 1 | Year-end recap including movies and shows | The planned "wrapped" moment, and a reason to keep logging |
| 2 | Export to PDF or CSV | Gives the owner a copy that does not depend on this app |
| 3 | Backup to Google Drive | A second safe place that needs no cable or manual copying |
| 4 | Season level logging for shows | Lets a show be rated per season |
| 5 | Prompts and templates | Helps on days with nothing to say |
| 6 | Fingerprint unlock | Faster than a PIN on phones |
| 7 | Mobile version | Wrapping the static site with Capacitor gives an Android app and native reminders |

## 12. Success criteria

This is a personal project, so success is felt rather than measured:

- The owner writes in it on most days for three months without being nagged.
- The owner has restored from a backup at least once and trusts the process.
- Looking back at a month or a year through Home, the mood calendar or Year in Pixels is something the owner enjoys.
- No entry is ever lost.

## 13. Risks and open questions

| Risk or question | Notes |
|---|---|
| Browser data is erased (cleared site data, a new browser, a changed address) | The main risk. Mitigated by file backups and the reminder banner. A cloud synced backup folder would be best |
| Shows from real TMDB behave differently from the test data | Check with a real search before relying on it |
| The paused Flutter repository | Keep, or archive it |
| Do shows need seasons? | Decide after using the show log for a while |
| Google Drive backup needs the owner to create a Google Cloud OAuth client | A one time setup of about ten minutes. Decide whether the convenience is worth it |
| A name for the Home greeting | A small Settings field would do |
| Changing the web address later | Plan a backup and restore, or pick the final address now |

## 14. Glossary

- **Entry**: one page of the journal, tied to a day.
- **Tag or feeling**: an emoji label such as Happy or Tired.
- **Viewing**: one time a movie or show was watched.
- **Snapshot**: an automatic copy of the journal kept inside the browser.
- **Backup file**: a JSON file downloaded or saved into a folder.
- **TMDB**: The Movie Database, a free source of movie and show information and posters.
- **PWA**: a website that can be installed and used like an app.
