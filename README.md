# CountCard Web

Marine Corps Drill Instructor accountability application for tracking and managing recruits. Built with Next.js, Firebase (Firestore), and end-to-end encryption with GDPR compliance.

**Version**: 2026.0.2 (Build 1)

## Technology Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Database**: Firebase Firestore (project: `countcard-94c5b`)
- **Authentication**: Firebase Authentication (multi-provider)
- **Encryption**: sodium-plus (XChaCha20-Poly1305) for end-to-end encryption
- **Styling**: Tailwind CSS 4+
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd CountCardWeb
   npm install
   ```

2. **Environment variables**  
   Copy the template and fill in values. See [ENV-SETUP-GUIDE.md](ENV-SETUP-GUIDE.md) for step-by-step instructions.
   ```bash
   cp .env.local.template .env.local
   ```
   Required: Firebase Client and Admin SDK config, `ALLOWED_ORIGINS`, `ENCRYPTION_MASTER_KEY`. Optional: App Check (reCAPTCHA) keys.

3. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Project Structure

- `app/` – Routes and API endpoints (Next.js App Router)
- `components/` – React components
- `lib/` – Utilities, services, Firebase config, validation
- `types/` – TypeScript type definitions
- `hooks/` – Custom React hooks
- `context/` – React contexts
- `sprints/` – Sprint docs and test tracking

## Development Workflow

- **Plans**: Active plans in `.cursor/plans/`; completed in `.cursor/plans/completed/`.
- **Sprints**: Each sprint has its own folder under `sprints/`; naming: `Sprint-<Number>-<Date>.md`.
- **Tests**: Manual testing required; see [sprints/TEST-TRACKING.md](sprints/TEST-TRACKING.md).
- **Lint**: `npm run lint`

## Deployment

- Build: `npm run build`
- Deploy to Firebase Hosting (or your target): use Firebase CLI and project config in `.firebaserc`.
- Ensure production env has correct `ALLOWED_ORIGINS`, Firebase config, and no debug/development keys.

## Security & Compliance

- **PII**: Never log PII, user IDs, or secrets; use `debugLog` (client) or `logError`/`logWarning` from `@/lib/utils/logger` (server).
- **Encryption**: Sensitive recruit data is encrypted client-side before storage.
- **API**: All API routes use Zod validation, auth verification, rate limiting, and CORS (see `lib/middleware`).

## Documentation

- [AGENTS.md](AGENTS.md) – Project rules and conventions for contributors
- [CHANGELOG.md](CHANGELOG.md) – Release history and notable changes
- [ENV-SETUP-GUIDE.md](ENV-SETUP-GUIDE.md) – Environment variable setup
- [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) – UI/UX and design tokens
- [docs/DEBUG-LOGGING-GUIDE.md](docs/DEBUG-LOGGING-GUIDE.md) – Debug logging
- [sprints/TEST-TRACKING.md](sprints/TEST-TRACKING.md) – Test tracking

## License

Proprietary. Production application handling sensitive military personnel data.
