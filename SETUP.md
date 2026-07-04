# CountCard Web — local development setup

**Canonical repo path (use this in Cursor):** `/Users/daddymac/Projects/Countcard`

Remote: `git@github.com:kostyc/CountCardWeb.git` — the folder name is `Countcard`; the GitHub repo is still `CountCardWeb`.

## Daily workflow

1. **Open the project** in Cursor: File → Open Folder → `/Users/daddymac/Projects/Countcard`
2. **Environment:** Copy secrets from your backup if needed:
   - `.env.local` is gitignored and must live only on your machine.
   - Template: `.env.local.template` and `ENV-SETUP-GUIDE.md`
3. **Install deps** (after pull or clone):
   ```bash
   npm install
   ```
4. **Run dev server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)
5. **Before pushing:**
   ```bash
   npm run build
   git status   # never commit .env.local
   git push origin main
   ```

## Git

| Item | Location |
|------|----------|
| Working copy | `/Users/daddymac/Projects/Countcard` |
| Default branch | `main` |
| Version | `VERSION.txt` + `CHANGELOG.md` |

Use `~/.cursor/skills/bump-version` / project bump script when shipping user-visible changes.

## What to avoid

- **Do not use iCloud** (`Library/Mobile Documents/.../CountCard/CountCardWeb`) for daily dev — git there was corrupted. Keep it as read-only archive until you confirm everything is on GitHub.
- **Do not commit** `.env.local` or other secrets.
- **Do not force-push** `main`.

## Optional / legacy paths

| Path | Role |
|------|------|
| `~/Developer/CountCardWeb` | Prior agent clone; superseded by `Projects/Countcard` |
| `~/Desktop/CountCard-rescue-2026-07-04/` | Rescue snapshot (2026-07-04) |
| iCloud `CountCard/CountCardWeb` | Broken git + archive; not deleted |

## Firebase / deploy

See `FIREBASE-SETUP-CHECKLIST.md`, `firebase.json`, and sprint deploy docs under `sprints/`.

## Rescue notes (2026-07-04)

Local work (messaging, encryption, reports, storage rules, sprint docs) was merged from iCloud/rescue into this repo. If `npm run build` fails, fix export/import mismatches (e.g. `Spinner` named vs default export) before release builds.
