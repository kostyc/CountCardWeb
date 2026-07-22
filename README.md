# CountCard

Marine Corps Drill Instructor accountability application for tracking and managing recruits. Cross-platform monorepo: **Expo (iOS/Android — primary client)**, shared packages, Firebase Cloud Functions API.

**Version**: 2026.0.5 (Build 45)

## Technology Stack

| Layer | Stack |
|-------|--------|
| **Primary client** | Expo SDK 57 + Expo Router in `apps/expo` (EAS → iOS/Android) |
| Shared | `@countcard/core`, `@countcard/firebase`, `@countcard/encryption`, `@countcard/api-client`, `@countcard/ui` |
| API | Firebase Cloud Functions (`functions/`) |
| Legacy web | Archived Next.js in `archive/apps-web` (read-only reference) |
| Backend | Firebase Firestore, Auth, Storage (`countcard-94c5b`) |

## Getting Started

```bash
git clone <repo-url>
cd Countcard
npm install
cp .env.local.template .env.local   # fill Firebase + API keys
```

| Command | Description |
|---------|-------------|
| `npm run dev:expo` | **Primary** — Expo dev server (iOS / Android / simulator; press **w** for web) |
| `npm run dev:web` | **Web browser** — Expo web at [http://localhost:8081](http://localhost:8081) (not legacy Next.js on :3000) |
| `npm run dev:functions` | Cloud Functions emulator (API + E2E scripts) |
| `npm run build:expo` | Expo web export (`apps/expo/dist` — Firebase Hosting) |

Expo env vars use `EXPO_PUBLIC_*` prefix (see `.env.local.template`). Set `EXPO_PUBLIC_API_BASE_URL` to your Cloud Functions URL for mobile API calls.

## Project Structure

```
apps/expo/         Expo Router (primary — iOS, Android, web export)
archive/apps-web/  Archived Next.js client (read-only)
packages/          Shared TypeScript packages
functions/         Firebase Cloud Functions API
firestore.rules    Firebase config (repo root)
sprints/           Sprint documentation
```

## Deployment

- **Mobile (Expo)**: `eas build --profile preview` (see `eas.json`)
- **API**: `cd functions && npm run deploy`
- **Hosting**: `firebase deploy --only hosting` — `build:expo` predeploy; `/api/**` proxies to Cloud Functions

Clean stale build output: `npm run clean`

## Documentation

- [AGENTS.md](AGENTS.md) – Contributor rules
- [archive/apps-web/MIGRATION-CHECKLIST.md](archive/apps-web/MIGRATION-CHECKLIST.md) – Web archive checklist
- [ENV-SETUP-GUIDE.md](ENV-SETUP-GUIDE.md) – Environment setup

## License

Proprietary. Production application handling sensitive military personnel data.
