# Changelog

All notable changes to CountCard Web are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Version numbers follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/your-org/CountCardWeb/compare/v2026.0.2.18...HEAD)

- (Nothing yet.)

## [2026.0.2.18] - 2026-07-04

### Added

- Expo profile edit: **Edit profile** in Settings and Profile & security prefills your existing data and saves updates to Firestore.

### Changed

- Repository layout: Next.js web in `apps/web`, Expo in `apps/expo`, shared code in `packages/*`, Cloud Functions in `functions/` (npm workspaces monorepo).

### Fixed

- Profile update omits undefined optional fields and keeps your current photo when you do not upload a new one.

## [2026.0.2.17] - 2026-07-04

### Fixed

- Expo iOS physical device dev builds: prebuild/Firebase CocoaPods, SDK 57 package alignment, and client-only `@countcard/encryption` (libsodium-wrappers) so Metro bundles load on device without Node `crypto` / `QuickBase64` native errors.
- Google Sign-In on iOS dev builds: uses iOS OAuth client ID (env + `GoogleService-Info.plist` fallback) and native bundle-id redirect instead of web client + custom scheme (fixes OAuth 2.0 policy error and restores the sign-in button).

### Added

- `apps/expo/plugins/withFirebaseIosConfigure.js` — injects `FirebaseApp.configure()` for Expo 57 Swift AppDelegate.
- `encryptionService.client.ts` / `encryptionService.node.ts` — split client vs Node encryption backends for Expo Metro.

## [2026.0.2.16] - 2026-07-04

### Fixed

- Expo web encryption check: client runtimes now use `libsodium-wrappers` (CJS) directly instead of sodium-plus, avoiding Metro's broken sodium-native stub.
- Expo Metro: `crypto` alias to react-native-quick-crypto applies on native only, not web (was breaking libsodium WASM init).

## [2026.0.2.15] - 2026-07-04

### Fixed

- Expo encryption check: removed stale compiled `.js` files in `@countcard/encryption` that Metro was bundling instead of updated TypeScript (restored broken `default.ready` init).
- Client runtimes (Expo web/native) now force libsodium-wrappers backend instead of broken sodium-native stubs.

## [2026.0.2.14] - 2026-07-04

### Fixed

- Expo profile create/update: Firestore `getDb()` proxy no longer breaks `doc()` calls; undefined org-assignment fields are stripped before writes.
- Expo Profile & security encryption check: sodium-plus now initializes via `SodiumPlus.auto()` with correct async crypto APIs (fixes "reading 'sodium'" error).

## [2026.0.2.13] - 2026-07-04

### Added

- Firestore rules for `recruits`, `countCards`, and admin `userProfiles` access (Expo client SDK workaround while Cloud Run API returns 403).
- Cloud Function trigger `syncUserClaimsOnProfileWrite` — syncs custom claims from profile writes without HTTP API.

### Changed

- Expo count-card workflow actions use `@countcard/firebase` directly instead of `/api/count-cards/*`.
- Expo admin screen uses Firestore `listUserProfiles` + `updateUserProfile` instead of admin API routes.

## [2026.0.2.12] - 2026-07-04

### Fixed

- Expo profile create no longer requires Cloud Functions API — saves to Firestore directly (fixes "Failed to fetch" when Cloud Run returns 403).
- Cloud Functions `set-custom-claims` route aligned with Next.js; custom-claim sync is best-effort when API is reachable.

## [2026.0.2.11] - 2026-07-04

### Added

- Expo photo picker: choose from photo library or take a photo; JPG/PNG/WebP only, 5MB max, 2048px max dimension (matches web).
- Profile create hints company logo use case; shows selected image size and dimensions.

### Changed

- Upload helpers validate format and size before Firebase Storage upload.


### Added

- Expo `recruits/create` and `count-cards/new` screens — full create flows via Firestore client SDK (validation, permissions, photo upload, draft/submit).
- Firebase Hosting `/api/**` rewrite to Cloud Functions `api`; `hosting-public/` landing page; `/api/*` path prefix on Functions Express app.
- `@react-native-firebase/app-check` wired for EAS production builds (App Attest / Play Integrity).

### Changed

- `EXPO_PUBLIC_API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL` template defaults to `https://countcard-94c5b.web.app` (Hosting proxy).

### Fixed

- Cloud Functions API routes now match Next.js `/api/*` paths used by `@countcard/api-client`.


### Fixed

- Expo web Google Sign-In `redirect_uri_mismatch` — web uses Firebase `signInWithPopup`; native keeps `expo-auth-session` with explicit `countcard://oauth` redirect URI.

## [2026.0.2.8] - 2026-07-04

### Fixed

- Expo web crash on login (`expo-router` Slot style-array error) — auth links use `TextLink` with `router.push` instead of `Link asChild` + styled `Text`.

## [2026.0.2.7] - 2026-07-04

### Fixed

- Expo web `auth/invalid-api-key` server error — Firebase now initializes client-side only; config reads `process.env.EXPO_PUBLIC_*` with `NEXT_PUBLIC_*` fallback.

## [2026.0.2.6] - 2026-07-04

### Fixed

- Expo `auth/invalid-api-key` when `EXPO_PUBLIC_FIREBASE_API_KEY` was missing — synced from `NEXT_PUBLIC_*` in `.env.local`; `app.config.ts` now falls back to web env vars.

## [2026.0.2.5] - 2026-07-04

### Added

- Cloud Functions esbuild bundle (`functions/build.mjs`) — workspace packages inlined for deploy; live API at `https://api-x5hh3t2iwq-uc.a.run.app`.
- Expo routes: privacy policy, terms, share, reset-password, recruits/create and count-cards/new placeholders; `UnderConstruction` component.
- Expo App Check scaffold (`apps/expo/lib/appCheck.ts`) — web reCAPTCHA Enterprise; native debug token support.
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` populated from Firebase Identity Toolkit.

### Fixed

- Cloud Functions deploy analysis/runtime errors (lazy Firebase client init; workspace deps removed from functions `package.json` for Cloud Build).

### Changed

- `EXPO_PUBLIC_API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL` template defaults to Cloud Run API URL.

## [2026.0.2.4] - 2026-07-04

### Added

- Expo profile wizard (`/profile/create`), count-card workflow actions/history, Messages tab with conversation threads, and native admin role assignment UI.
- Google Sign-In on iOS/Android via `expo-auth-session` (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`).
- EAS project `@warriorwaypoint/countcard`; `EXPO_PUBLIC_*` env wiring for mobile Firebase and Cloud Functions API URL.

### Fixed

- `apps/expo/constants/theme.ts` dark theme object missing closing brace (Metro/TS parse error).

### Changed

- Cloud Functions `package.json` main entry points to compiled output path for deploy tooling.

## [2026.0.2.3] - 2026-07-04

### Changed

- Modernized Expo app layout with Marine Corps design tokens, shared UI components, grouped list rows, hero auth screens, and refined tab navigation.

## [2026.0.2.2] - 2026-07-04

### Added

- npm workspaces monorepo: `apps/web` (Next.js), `apps/expo` (iOS/Android/Web), shared `packages/*`, Firebase Cloud Functions API.
- Expo app with email/Apple auth, dashboard tabs, recruits and count-cards lists, native image picker, push, and biometrics helpers.
- Shared packages `@countcard/core`, `@countcard/firebase`, `@countcard/encryption` (web/native), `@countcard/api-client`, `@countcard/ui`.
- EAS Build profiles (`eas.json`) and Sprint 26 migration documentation.

### Changed

- Next.js app moved to `apps/web`; business logic extracted into shared packages.
- Mobile clients can call Cloud Functions via `EXPO_PUBLIC_API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL`.


### Fixed

- Resolved 79 TypeScript errors across dashboard pages (`tsc --noEmit` and `npm run build` now pass).
- Toast API: `type` → `variant`; `logError`/`logInfo` call signatures corrected.
- Organizational assignment casts in admin, profile, and recruit flows.
- Added missing `conversationRealtime.ts` for messaging hooks.
- Updated `SETUP.md` canonical path to `/Users/daddymac/Projects/Countcard`.

## [0.2.0](https://github.com/your-org/CountCardWeb/compare/v0.1.0...v0.2.0) - 2026-02-28

### Added

- **Human-to-human messaging (Sprint 9)**
  - Conversation list at `/conversations` with real-time updates
  - Conversation thread view with message send/receive and real-time listeners
  - New conversation flow with org-scoped recipient picker (battalion/company)
  - Message attachments: upload to Firebase Storage, validation, display in thread
  - In-conversation message search and list filter (all / unread)
  - Firestore real-time subscriptions: `conversationRealtime.ts`, `useConversations`, `useMessages`
- **Changelog and versioning**
  - This changelog; `package.json` version set to 0.2.0

### Deferred

- Message and attachment encryption (E2E) — pending product decision on key model; see `.cursor/plans/completed/sprint_9_human_messaging.plan.md`.

## [0.1.0](https://github.com/your-org/CountCardWeb/releases/tag/v0.1.0) - Initial release

- Core app: Next.js 16, Firebase (Auth, Firestore), Tailwind CSS 4, Zod
- Recruit and count card management, platoons, emergency contacts, user profiles
- End-to-end encryption (sodium-plus) for sensitive data; GDPR-oriented export/delete
- Mobile-first UI, 44px touch targets, responsive layout
- Security: CORS, rate limiting, role-based access, secure logging (no PII)