# CountCard Web — local development setup

**Canonical repo path (use this in Cursor):** `/Users/daddymac/Projects/Countcard`

Remote: `git@github.com:kostyc/CountCardWeb.git`

## Rescue backup (2026-07-04)

Before this clone, local-only files were copied to:

`~/Desktop/CountCard-rescue-2026-07-04/` (see `MANIFEST.txt`)

## Do not use iCloud for git

Leave the old tree as archive only:

`~/Library/Mobile Documents/com~apple~CloudDocs/Projects/CountCard/CountCardWeb`

iCloud eviction can break git indexes (`AD` paths, unborn HEAD).

## Daily workflow

1. **Open the project** in Cursor: File → Open Folder → `/Users/daddymac/Projects/Countcard`
2. **Pull** before work: `git pull origin main`
3. **Environment:** `.env.local` is gitignored — keep secrets only on your machine (template: `.env.local.template`, `ENV-SETUP-GUIDE.md`)
4. **Install / run:**
   ```bash
   npm install
   npm run dev
   npm run build
   ```
5. **Commit and push** often: `git push origin main`

## Build status

`npm run build` and `npx tsc --noEmit` pass on `main`. Dashboard pages use the toast `variant` API, corrected `logError`/`logInfo` signatures, and typed organizational assignments.

## Firebase / credentials

See `FIREBASE-SETUP-CHECKLIST.md`, `.firebaserc`, and Firebase console for web app config and service account as needed for API routes.
