---
status: completed
phase: 7
createdAt: '2026-07-06'
completedAt: '2026-07-06'
title: Deprecate Next.js web (Expo-only client)
---

# Web deprecation plan

**Goal:** Expo + EAS is the only end-user client. Retire `apps/web` after API and UI parity.

**Phase 7 complete:** `apps/web` archived to `archive/apps-web`. Archive checklist: [`archive/apps-web/MIGRATION-CHECKLIST.md`](../../archive/apps-web/MIGRATION-CHECKLIST.md).

## Daily development

| Need | Command |
|------|---------|
| iOS / Android / Expo | `npm run dev:expo` only |
| Kilo Excel import verify (no web) | `npm run e2e:kilo-expo` |
| Sprint 27 E2E API scripts | `npm run dev:functions` (default `E2E_API_BASE` = Functions emulator) |
| Legacy web UI | Archived at `archive/apps-web` (read-only) |

**Note:** Expo Excel roster import is fully client-side (`commitRecruitImportLocal`). Photo/PDF parse uses Cloud Functions (`parse-image`, `parse-document`) via `EXPO_PUBLIC_API_BASE_URL`.

## API migration matrix

35 Next.js routes in `apps/web/app/api/` vs mirror in `functions/src/routes/`.

### Migrated (or duplicated) in Cloud Functions

- [x] `GET /api/health`
- [x] Encryption: key, generate-key, rotate-key, recovery-code, recover-key, **wrap-dek** (Phase 5)
- [x] User: profile, profile/completion, accept-policies, set-custom-claims
- [x] Count cards: approve, reject, final-approve, consolidate
- [x] Admin: users
- [x] Recruits: export, transfer, progress, comments
- [x] `POST /api/recruits/import/parse-document` + `parse-image` — **Cloud Functions** `functions/src/routes/recruitImport.ts` (Phase 5)
- [x] Transfer batches: CRUD, publish, initiate, first-sgt-review, cdi-review, accept, reject, export
- [x] DI leadership cards: create, sign, recommendations
- [x] Conversations: org-channel

**Migration target:** `functions/src/routes/` + extract `apps/web/lib/lifecycle/*Admin.ts` to `packages/server` or `functions/lib/`.

## Expo UI gaps (port before web removal)

- [x] `/receiving/intake` — Expo screen `apps/expo/app/receiving/intake.tsx` (2026-07-06)
- [x] `/receiving/checklist/[id]` — Expo screen + `ReceivingChecklistForm` (2026-07-06)
- [x] `/receiving/import` — Expo route redirects to `/recruits/import` with receiving gate (Phase 5)
- [x] `/receiving/transfers` batch create/publish (Firestore services; Expo UI 2026-07-06)
- [x] `/di-leadership-cards` — Expo screen (Phase 5)
- [x] Full conversations org-channel UI — Messages tab create channel (Phase 5)
- [x] Encryption key management UI — `/profile/encryption` (Phase 5)

## E2E script retargeting

After API migration, point defaults away from `localhost:3000`:

- [x] `scripts/sprint27-e2e.mjs` — default `http://127.0.0.1:5001/.../api` via `scripts/e2e-api-base.mjs`
- [x] `scripts/kilo-receiving-e2e.mjs`
- [x] `scripts/kilo-fixture-manual-flow.mjs`
- [x] `scripts/sprint27-client-e2e.mjs` — 14/14 (Phase 5)
- [x] `scripts/sprint27-client-gaps.mjs` — 30/30 vs Functions emulator (Phase 5)

Target: Functions emulator or `https://countcard-94c5b.web.app/api`.

## Retirement checklist

- [ ] `EXPO-WEB-PARITY.md` items verified on device (encryption round-trip, App Check, EAS)
- [x] E2E green against Functions (not Next.js) — sprint27 **36/36**, client **14/14**, gaps **30/30** (Phase 5)
- [x] Remove `dev:web` / `build:web` from root `package.json` (Phase 6)
- [x] Archive `apps/web` to `archive/apps-web` (Phase 7 — 2026-07-06)
- [x] Firebase Hosting → `apps/expo/dist` with `build:expo` predeploy

## Phase 7 (completed 2026-07-06)

Archive at `archive/apps-web`; root `lint` → Functions typecheck; Hosting serves Expo web export.

## References

- [EXPO-WEB-PARITY.md](../../sprints/Sprint-26-2026-07-04/EXPO-WEB-PARITY.md)
- [Audit subagent](3dbf3cf4-07d9-47a8-bde8-67f5dcd8f17e) — 2026-07-06
