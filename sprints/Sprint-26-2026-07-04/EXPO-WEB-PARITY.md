# Expo Web Parity — Next.js Retirement Checklist

Phase 7: `apps/web` archived to `archive/apps-web`.

- [x] All routes in `sprints/ROUTE-PLACEHOLDERS.md` have Expo screens (recruits/create, count-cards/new ported 2026-07-04)
- [ ] Encryption round-trip verified on iOS, Android, and Expo web (`verifyCrossPlatformCompatibility` on Profile)
- [x] Cloud Functions API deployed; `/api/*` path prefix aligned with `@countcard/api-client`
- [ ] Cloud Run public invoker OR hosting proxy working — org policy blocks `allUsers` `run.invoker` (403 on `/api/health`; see [CLOUD-RUN-API-ACCESS.md](./CLOUD-RUN-API-ACCESS.md))
- [x] **Expo workaround (2026-07-04):** Firestore client SDK + rules + `syncUserClaimsOnProfileWrite` trigger — see [CLOUD-RUN-WORKAROUND.md](./CLOUD-RUN-WORKAROUND.md). Expo flows no longer require HTTP API; web encryption/export still blocked until org policy fix.
- [x] Web app uses Cloud Functions URL (`NEXT_PUBLIC_API_BASE_URL=https://countcard-94c5b.web.app`) — env set; API still 403 until org policy resolved
- [x] Admin, profile wizard, count-card workflow, messaging UI ported to Expo
- [x] **Receiving transfer batches (2026-07-06):** Expo `/receiving/transfers` — create draft, publish, initiate via Firestore SDK; company review on `/company/incoming-recruits`. Excel roster import client-side (`npm run e2e:kilo-expo`).
- [ ] EAS production builds pass store review requirements
- [ ] Firebase App Check configured for native (App Attest / Play Integrity) — RNFB wired; REST configs verified 2026-07-04; **confirm in Console**; Android SHA-256 pending (no EAS builds yet)
- [x] EAS preview environment variables pushed (`eas env:push preview` — 8 `EXPO_PUBLIC_*` vars, 2026-07-04)

### Remaining Expo UI gaps (block web removal)

- [x] `/receiving/intake` — add recruit at Receiving (Expo 2026-07-06)
- [x] `/receiving/checklist/[id]` — intake checklist (Expo 2026-07-06)
- [x] `/receiving/import` dedicated route — redirects to `/recruits/import` with receiving gate (Phase 5)
- [x] `/di-leadership-cards` — Expo screen (Phase 5)
- [x] Full conversations org-channel UI — Messages tab create channel (Phase 5)
- [x] Encryption key management UI — `/profile/encryption` (Phase 5)
- [ ] Photo/PDF roster parse — Functions `parse-image` / `parse-document` migrated; **device E2E with OCR still pending**

### Remaining API / infra blockers

- [x] Migrate transfer-batch HTTP routes to Cloud Functions (`functions/src/routes/transferBatches.ts`; E2E defaults to emulator)
- [x] Migrate recruit transfer/progress/comments, DI leadership cards, org-channel to Cloud Functions (2026-07-06 Phase 4)
- [x] `POST /api/recruits/import` commit — **Expo-only** (`commitRecruitImportLocal`, 2026-07-06)
- [x] `parse-document` / `parse-image` / `wrap-dek` — Cloud Functions (Phase 5)
- [ ] Cloud Run public invoker / org policy (see CLOUD-RUN-API-ACCESS.md)
- [x] E2E scripts retarget to Functions emulator (`sprint27-e2e.mjs`, `kilo-receiving-e2e.mjs`, `e2e-api-base.mjs`)
- [x] E2E client scripts green — `sprint27-client-e2e` 14/14, `sprint27-client-gaps` 30/30 (Phase 5)
- [x] Root `dev:web` / `build:web` removed (Phase 6)

When complete: archive `apps/web` to `archive/apps-web`, point Firebase Hosting to `apps/expo` web export. Checklist: [`archive/apps-web/MIGRATION-CHECKLIST.md`](../../archive/apps-web/MIGRATION-CHECKLIST.md).
