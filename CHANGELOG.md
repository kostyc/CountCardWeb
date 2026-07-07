# Changelog

All notable changes to CountCard Web are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Version numbers follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/your-org/CountCardWeb/compare/v2026.0.5.43...HEAD)

## [2026.0.5.43] - 2026-07-07 — USMC Drill Instructor brand icons

### Changed

- App icon, splash screen, favicon, and Android adaptive icons updated to the USMC Drill Instructor (0911) brand logo; auth screens show the logo instead of the CC placeholder.

## [2026.0.5.42] - 2026-07-06 — Fix Training Day screen navigation crash

### Fixed

- Training Day banner tap no longer crashes — fixed `getUserOrganization` import in company training day permissions; added `company/_layout` stack for reliable navigation.

## [2026.0.5.41] - 2026-07-06 — MCRD grid count card and company training day

### Added

- **MCRD COUNT CARD (1513/6)** — mobile yellow grid matching the physical form: T-DAY, SERIES, DATE header; 11-column platoon grid (PLT, T/S, T/P, WPN, BR, LD, SB, DENT, GG, OTH, TOTAL); compact phone view with expandable full grid.
- **Company Training Day** — F-1 Friday anchor (must be Friday); any company member can set or advance T-DAY; count cards inherit T-DAY read-only.
- Training day matrix engine (F1–F4, T1–T59, S1–S11, M1–M11, Receiving) in `@countcard/core`.
- Firestore collections `mcrdCountCards` and `companyTrainingDays` with workflow submit/approve/reject.

## [2026.0.5.40] - 2026-07-06 — Recruit receiving IST, urinalysis, and roster UX

### Added

- Recruit profile **Receiving** section — IST scores and urinalysis result captured at intake, editable on profile and receiving checklist.
- Receiving **intake** — IST fields (first event), urinalysis, then initial PFT/CFT and physical metrics.
- Recruit **weight tracking** — append-only weigh-ins with history, trend chart, and analytics (latest, change, min/max) on each recruit profile.
- Recruit **Middle Initial** field — spreadsheet column (default visible), edit screen, and profile detail.
- Expo recruits **Spreadsheet** layout — column/row grid (Last Name, First Name, EDIPI, platoon, rank, status, and more) with customizable visible columns saved on device.
- Recruit list **mass edit** — select rows (or all editable recruits) and apply a value to platoon, rank, status, and other editable columns.
- Recruit detail **Fitness & progress** — Initial PFT/CFT from profile, progress timeline, and record Final PFT / CFT / drill events on mobile.

### Changed

- **IST** is the first progress event — event picker, summary, and profile display order IST before PFT/CFT; `initial_drill` labeled IST.
- Recruit progress **event type** picker on mobile — tappable chips replace the dropdown for faster selection on narrow screens.
- PFT/CFT/IST fitness scores show **per-event breakdown** (pull-ups, plank, run, crunches, total) on recruit detail, progress timeline, and spreadsheet columns.
- Expo recruit spreadsheet columns stay aligned with headers; Rank/Status selects constrained to cell width.
- Expo recruit spreadsheet columns auto-size to cell text (single line); **Comments** column wraps and is available in column picker.
- Unassigned recruits (missing company or platoon) sort to the **top** of the list and appear first in battalion company-column view.

### Fixed

- Recruit progress events on mobile no longer fail when optional fields (location, notes, scores, pass/fail) are omitted — client Firestore writes now strip undefined values before `addDoc`.
- **Modify recruit** screen now includes height and weight at intake fields so receiving staff can add or correct intake metrics after creation (detail page remains read-only).

## [2026.0.5.39] - 2026-07-06 — Web deprecation Phase 7 — Expo-only client

### Changed

- Archived Next.js client: `apps/web` → `archive/apps-web` (read-only reference).
- Firebase Hosting serves Expo web export (`apps/expo/dist`) with `build:expo` predeploy; `/api/**` rewrites to Cloud Functions.
- Root `npm run lint` runs Functions typecheck only; legacy web lint via `npm run lint:archive`.
- Workspace `npm install` refreshed after removing `apps/web` from active workspaces.

### Fixed

- `functions/src/routes/recruitImport.ts` — `Buffer` → `ArrayBuffer` cast (TS2322) for lint.

## [2026.0.5.38] - 2026-07-06 — Web deprecation Phase 5 — Expo UI parity

### Added

- Expo `/di-leadership-cards` — create, sign, and recommend on DI leadership cards.
- Expo `/profile/encryption` — full encryption key management UI (`EncryptionKeyManagement`).
- Expo `/receiving/import` — receiving-gated route to roster import.
- Messages tab org-channel create — platoon, company, and battalion broadcast channels.
- Cloud Functions `POST /api/encryption/wrap-dek` — E2E message key wrapping.
- Cloud Functions `POST /api/recruits/import/parse-image` and `parse-document` — photo/PDF roster OCR.
- `archive/apps-web/MIGRATION-CHECKLIST.md` — Phase 7 archive prep (Phase 6).

### Changed

- Web deprecation plan and `EXPO-WEB-PARITY.md` — Phase 5 UI/API gaps closed; E2E client scripts 14/14 and 30/30.
- Removed root `dev:web` and `build:web` scripts; legacy Next.js via `cd apps/web && npm run dev` only.

### Added (Phase 4 carry-over)

- Cloud Functions transfer-batch API (`/api/transfer-batches/*`) — create, list, publish, initiate, staged reviews, accept, reject, export.
- Expo `/receiving/checklist/[id]` screen with receiving medical checklist form.
- `npm run dev:functions` and `scripts/e2e-api-base.mjs` — E2E scripts default to Functions emulator.
- `apps/web/DEPRECATED.md` and `npm run lint:web` alias documenting Next.js client retirement.

### Changed (Phase 4 carry-over)

- Default `npm run build` targets Expo; Next.js web is deprecated.
- Removed unused Expo `transferBatchApi.ts` (receiving uses Firestore services directly).

## [2026.0.5.37] - 2026-07-06 — Kilo receiving ingestion workflow

### Added

- Receiving-mode bulk import: `custodyPhase: receiving`, Support/Receiving org lock, default intake checklist.
- Staged transfer batch review: `first_sgt_review` → `cdi_review` → `sdi_accept` (role-gated, `workflowHistory`).
- `scripts/kilo-receiving-e2e.mjs` and `npm run e2e:kilo` — 5 recruits (3 Lead/3001, 2 Follow/3003), full Receiving → publish → initiate → staged reviews → training.

### Fixed

- Bulk import API omits undefined optional fields (e.g. `weaponsSerialNumber`) so Firestore writes succeed.
- Receiving import UI gates on `canReceivingWorkflow` instead of generic recruit-create permission.
- Sprint 27 E2E Receiving platoon aligned to canonical `0000`.

## [2026.0.5.36] - 2026-07-06 — Shared design tokens

### Added

- `@countcard/ui/tokens`: canonical colors, font families, spacing, and border-radius for web and Expo.
- Font setup docs and `@font-face` hook for Colossalis in `apps/web/public/fonts/`.

### Changed

- Expo theme imports palette and semantic colors from `@countcard/ui`; spacing/radius aligned with web scale.
- Expo screens use theme tokens instead of hardcoded hex for borders, highlights, and on-primary text.
- Expo splash/adaptive icon background uses Marine Corps navy (`#001e2e`).
- Shared `@countcard/ui` Button uses Marine Corps palette.


### Fixed

- Expo recruits list: battalion column view now shows recruits without a company under **Unassigned** (imports were saved but hidden).
- Recruit search matches first name as well as last name and EDIPI.

### Changed

- Roster import on mobile: battalion staff can set a **Default company** so new imports get the correct company assignment.

## [2026.0.5.34] - 2026-07-06 — Recruit search by last name or EDIPI

### Added

- Recruits tab search on mobile (Expo) and web — filter by last name prefix or EDIPI digits.

## [2026.0.5.33] - 2026-07-06 — Recruits list Firestore indexes

### Fixed

- Recruits list failing with “query requires an index” for battalion-scoped users — added composite indexes for org scope + `lastName`/`firstName` sort and deployed to Firestore.

## [2026.0.5.32] - 2026-07-06 — Sprint 27 API E2E via ADC

### Added

- `scripts/verify-countcard-auth.sh` — scoped gcloud/Firebase/Admin SDK check without changing global gcloud project.
- `.cursor/rules/gcloud-firebase-auth.mdc` — multi-project auth workflow (reauth each session, no global `gcloud config set project`).
- Admin SDK wrappers for progress, comments, DI cards, and org messaging API routes (`apps/web/lib/lifecycle/*Admin.ts`).

### Fixed

- `sprint27-e2e.mjs` — password sign-in (no service account key), correct lifecycle payloads, optional Expo smoke when `:8081` is down; **33/33** pass with ADC.
- Transfer batch accept/create — omit `undefined` from Firestore `workflowHistory`, `notes`, and `transferHistory.fromAssignment` fields.

## [2026.0.5.31] - 2026-07-06 — Sprint 27 manual verification complete

### Added

- `scripts/sprint27-client-gaps.mjs` — reject custody, DI signatures, platoon/battalion messaging, SDI/CDI scope checks, Expo smoke (27/27).

### Fixed

- Web `/di-leadership-cards` and `/conversations` use authenticated client Firestore SDK (same pattern as incoming-recruits); fixes PERMISSION_DENIED when server APIs lacked Firestore auth context.
- API routes for DI cards and org channels import `@/lib/firebase/config` for server-side client SDK initialization.

### Changed

- Sprint 27 TEST-MATRIX fully checked off; Sprint doc marked complete.

## [2026.0.4.30] - 2026-07-06 — Sprint 27 transfer batch E2E unblocked

### Fixed

- Firestore rules deployed for `transferBatches` and `diLeadershipCards`; custody transfer client E2E passes end-to-end.
- Transfer accept: omit undefined org fields from `transferHistory` entries (Firestore rejects `undefined` in `arrayUnion`).
- Admin E2E scripts: stop defaulting to non-existent `CountCard` named database; use `(default)` unless `FIRESTORE_DATABASE_ID` is set.

### Changed

- Sprint 27 TEST-MATRIX Phases 0–4 checked off where verified by client E2E and browser recruit detail.

## [2026.0.4.29] - 2026-07-05 — Sprint 27 verification fixes

### Fixed

- `firestore.indexes.json` parse error (missing `},`) and composite index for Expo incoming batch queries (`company` + `status` + `updatedAt`).
- Receiving intake company dropdown: include **Receiving** in Support Battalion company list (was showing STC).
- Incoming recruits page loads published and in-transit batches in parallel.
- Transfer batch create API rejects recruits not in `receiving_ready` custody.

## [2026.0.4.28] - 2026-07-05 — Sprint 27 Recruit Lifecycle

### Added

- Recruit custody lifecycle: Receiving intake, transfer batches (publish/initiate/accept/reject), training progress events, append-only comments, DI leadership cards, and org messaging channels.
- Web routes: `/receiving/*`, `/company/incoming-recruits`, `/di-leadership-cards`, `/conversations`.
- Expo parity: Receiving transfers list, incoming recruit custody (accept/reject), training progress read-only on recruit detail; dashboard quick actions.
- Lifecycle API authorization for transfer batches, progress, DI cards, and org channels.
- Firestore indexes for `transferBatches`, `recruits` by `custodyPhase`, and `diLeadershipCards`.

### Changed

- Single-recruit transfer gated to `custodyPhase: training` (API, web UI, Expo, and client SDK).
- CSV roster export uses authenticated fetch download instead of bare link.

### Fixed

- Transfer batch and DI card Firestore query helpers aligned with `queryDocuments` API.
- Web production build: sodium-plus type cast and conversations pagination `pageSize`.


### Fixed

- 3rd Battalion companies corrected to India, Kilo, Lima, Mike (removed non-existent Juliet Company).

## [2026.0.3.26] - 2026-07-05 — Role-based recruits tab views

### Added

- Recruits tab layouts scoped by role: battalion staff see company columns; company/series staff see flat sorted lists; DIs see platoon only (web and Expo).
- Shared recruit list helpers: `getRecruitListViewMode`, `getRecruitListFilterLevel`, `sortRecruits`, and org-scope checks for recruit visibility.

### Changed

- Recruit list queries and `canViewRecruit` now enforce organizational scope for command staff (no global unscoped admin bypass on the recruits tab).
- Chief DI recruit view limited to series; Senior DI limited to platoon.
- Web `/recruits` hides org filters above the user’s scope and shows a scope label.

## [2026.0.3.25] - 2026-07-05 — Recruit lifecycle workflow

### Added

- Receiving Company (`Support` / `Receiving`) with custody phases: receiving → transfer pending → in transit → training.
- Receiving intake (height, weight, initial PFT/CFT), medical checklist, and transfer batch workflow (publish, Friday initiate, destination accept/reject).
- Roster CSV export for published transfer batches.
- Recruit progress events (PFT, CFT, drill, inspections, hiking) and append-only comments.
- DI leadership cards with dual signatures and append-only recommendations.
- Org messaging channels (platoon, company, battalion broadcast) and web `/conversations` UI.
- `POST /api/encryption/wrap-dek` for E2E message key wrapping.

### Changed

- Single-recruit transfer blocked when recruit is not in training custody (use transfer batches for pickup week).
- Recruit detail shows custody phase, transfer history, and progress panel when in training.

## [2026.0.2.24] - 2026-07-05

### Added

- Recruit transfer API (`POST /api/recruits/[id]/transfer`) with server-side audit logging via Admin SDK.
- Firestore security rules for `adminLogs` (authenticated create/read; immutable updates/deletes denied).
- Shared recruit sub-screen back navigation on mobile (transfer and edit return to profile reliably on web).

### Changed

- Import roster grid uses full available width on web and mobile; compact rank picker in spreadsheet cells.
- Expo and web transfer flows route through the transfer API when available, with Firestore fallback.
- Recruit profile reloads on focus after transfer or edit.

### Fixed

- Recruit transfer no longer logs a client-side `adminLogs` permission error when rules are not yet deployed.
- Header back and Cancel on mobile transfer/edit screens no longer stay on the same page.

## [2026.0.2.23] - 2026-07-05

### Added

- Import preview spreadsheet grid: columns and rows with inline cell editing, row selection, and mass column updates (apply to selected or all rows, copy platoon from row 1).
- Mobile import uses the same horizontal roster grid with mass-edit toolbar.

## [2026.0.2.22] - 2026-07-05

### Added

- Recruit import preview: rows with missing first name, last name, or platoon are kept for review with inline editing before import (web and mobile).
- Default platoon automatically fills missing platoon values in the import preview.

### Changed

- Import parsing accepts partial rows (missing platoon, single-word names, separate First/Last columns) instead of dropping them as errors.
- EDIPI remains optional during import review.

## [2026.0.2.21] - 2026-07-05

### Fixed

- Mobile recruit import no longer requires the HTTP API for Excel (.xlsx/.xls/.csv): spreadsheets parse on-device and commits write directly to Firestore.
- Clearer API errors when Cloud Run returns 403 or the device cannot reach `EXPO_PUBLIC_API_BASE_URL` (photo/PDF import still needs API access).

## [2026.0.2.20] - 2026-07-05

### Added

- Unified roster import: camera, photo library, Excel (.xlsx/.xls/.csv), and PDF from one screen on web and mobile.
- Mobile import: choose Excel or PDF from Files via document picker; parsed through new `/api/recruits/import/parse-document` endpoint.

### Changed

- Web import UI: single “Add roster” card with Take photo, Choose images, Upload Excel, and Upload PDF actions (replaces separate photo and spreadsheet sections).

## [2026.0.2.19] - 2026-07-05

### Fixed

- Recruit roster import: Excel files (`.xlsx`, `.xls`, `.csv`) now parse correctly when title rows appear above column headers; legacy `.xls`/`.csv` formats are accepted; spreadsheet files picked in the photo section are routed to document import.

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