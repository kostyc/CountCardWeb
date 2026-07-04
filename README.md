# CountCard

Marine Corps Drill Instructor accountability application for tracking and managing recruits. Cross-platform monorepo: **Next.js web**, **Expo (iOS/Android/Web)**, shared packages, Firebase Cloud Functions API.

**Version**: 2026.0.2 (Build 18)

## Technology Stack

| Layer | Stack |
|-------|--------|
| Web | Next.js 16 (App Router) in `apps/web` |
| Mobile + Expo Web | Expo SDK 57 + Expo Router in `apps/expo` |
| Shared | `@countcard/core`, `@countcard/firebase`, `@countcard/encryption`, `@countcard/api-client`, `@countcard/ui` |
| API | Firebase Cloud Functions (`functions/`) + Next.js API routes (transition) |
| Backend | Firebase Firestore, Auth, Storage (`countcard-94c5b`) |

## Getting Started

```bash
git clone <repo-url>
cd Countcard
npm install
cp .env.local.template .env.local   # fill Firebase + API keys
ln -sf ../../.env.local apps/web/.env.local   # if env at repo root
```

| Command | Description |
|---------|-------------|
| `npm run dev:web` | Next.js at http://localhost:3000 |
| `npm run dev:expo` | Expo dev server (iOS / Android / web) |
| `npm run build:web` | Production Next.js build |
| `npm run build:expo` | Static Expo web export |

Expo env vars use `EXPO_PUBLIC_*` prefix (see `.env.local.template`). Set `EXPO_PUBLIC_API_BASE_URL` to your Cloud Functions URL for mobile API calls.

## Project Structure

```
apps/web/          Next.js web app
apps/expo/         Expo Router (iOS, Android, Web)
packages/          Shared TypeScript packages
functions/         Firebase Cloud Functions API
firestore.rules    Firebase config (repo root)
sprints/           Sprint documentation
```

## Deployment

- **Web (Next.js)**: `npm run build:web` → Firebase Hosting or Vercel
- **API**: `cd functions && npm run deploy`
- **Mobile**: `eas build --profile preview` (see `eas.json`)

## Documentation

- [AGENTS.md](AGENTS.md) – Contributor rules
- [ENV-SETUP-GUIDE.md](ENV-SETUP-GUIDE.md) – Environment setup
- [sprints/Sprint-26-2026-07-04/](sprints/Sprint-26-2026-07-04/) – Monorepo migration sprint

## License

Proprietary. Production application handling sensitive military personnel data.
