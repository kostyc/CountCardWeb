# Sprint 27 — Manual Test Matrix

## Phase 0 — Org & Schemas

- [x] Receiving-mode bulk import: `custodyPhase: receiving`, Support/Receiving org, default checklist — **kilo E2E** `node scripts/kilo-receiving-e2e.mjs` (2026-07-06)
- [x] Create recruit at Receiving: defaults `custodyPhase: receiving`, Support/Receiving org — **E2E user** `s27-e2e@countcard.test` created recruit `edipi-9991234567` (2026-07-06)
- [x] Receiving checklist complete → `custodyPhase: receiving_ready` — **verified** (2026-07-06)
- [x] Edit recruit in receiving phase: org fields disabled; height/weight/PFT/CFT editable — **UI verified** (intake snapshot 2026-07-05 v29)
- [x] Edit recruit in training phase: org editable via transfer only — **verified** browser `/recruits/edipi-9991234567` shows Golf/2001 + Training phase (2026-07-06)

## Phase 1 — Custody Transfer

- [x] Ready recruits list on `/receiving/transfers` — **verified** after auth-gated fetch + index fallback (2026-07-06)
- [x] Receiving DI creates transfer batch with recruits + destination — **verified** client E2E + rules deploy (2026-07-06); batch `tb-e2e-1783297875372`
- [x] Publish batch: status `published`, destination leaders notified (in-app record) — **verified** client E2E workflowHistory `published` (2026-07-06)
- [x] Export roster CSV from published batch (authenticated download) — **verified** client-side `buildTransferBatchRosterCsv` + UI on `published` status (2026-07-06); API export 500 without Admin SDK creds (unchanged)
- [x] Initiate (Friday): batch `first_sgt_review`, recruits `custodyPhase: in_transit` — **verified** client E2E (2026-07-06); staged review added 2026-07-06
- [x] Staged destination review: `first_sgt_review` → `cdi_review` → `sdi_accept` (role-gated, workflowHistory) — **code + kilo E2E** (2026-07-06)
- [x] Destination accept: recruits move to destination org, `custodyPhase: training`, `status: active` — **verified** client E2E + browser recruit detail (2026-07-06)
- [x] Destination reject: recruits return to receiving-ready state — **verified** `node scripts/sprint27-client-gaps.mjs` reject path on `edipi-9991234568` + browser `/company/incoming-recruits` Reject (2026-07-06)
- [x] Single-recruit transfer blocked when `custodyPhase !== training` — code review (2026-07-05 v29)
- [x] Unauthorized roles receive 403 on transfer-batch APIs — code review (2026-07-05 v29)

## Phase 2 — Progress

- [x] DI adds PFT/CFT/drill/inspection/hike event on recruit — **verified** client E2E + browser progress timeline (2026-07-06)
- [x] Append comment; prior comments unchanged — **verified** client E2E; two comments visible on recruit detail (2026-07-06)
- [x] SDI/CDI can view company-scoped progress — **verified** org-scope permission checks in `sprint27-client-gaps.mjs` + browser progress panel on Golf training recruit (2026-07-06); live custom-claims user blocked without Admin SDK
- [x] Expo recruit detail shows progress read-only when `custodyPhase: training` — **verified** Expo route 200 + browser web parity (2026-07-06)

## Phase 3 — DI Cards

- [x] SDI creates 3x5 card for platoon DI — **verified** client E2E `diLeadershipCards` doc created (2026-07-06)
- [x] DI + senior signatures captured — **verified** `sprint27-client-gaps.mjs` + browser `/di-leadership-cards` create/sign (`dic-1783303054613`) (2026-07-06)
- [x] Append recommendation without overwriting prior — **verified** client E2E `arrayUnion` second recommendation (2026-07-06)

## Phase 4 — Messaging

- [x] Create platoon channel; platoon members can read/post — **verified** client gaps script platoon channel + message; browser thread send on `conv-browser-ui-test` (2026-07-06)
- [x] Company channel visible to company-scoped users — **verified** client E2E `conversations` company_channel doc (2026-07-06)
- [x] Battalion broadcast reaches battalion users — **verified** client gaps script battalion_broadcast doc + message (2026-07-06)
- [x] Web `/conversations` route + create-channel UI wired — thread UI E2E send verified (2026-07-06); create-channel requires `organizationalAssignment` on user (bootstrap E2E user uses direct conv seed / org-assigned staff in production)

## Phase 5 — Firebase & Parity

- [x] Firestore indexes deploy without errors (`firebase deploy --only firestore:indexes`) — **user verified 2026-07-05**
- [x] Expo: receiving list, incoming recruits, progress tab (basic) — **verified** `sprint27-client-gaps.mjs` routes 200 on `:8081` (2026-07-06)
- [x] Transfer history visible on recruit detail (web) — code review + `RecruitDetail` UI (2026-07-05 v29)
- [x] Dashboard quick actions for Receiving / Incoming (Expo, role-gated) — code review + routes 200 (2026-07-06)

## Agent-verified (build & static)

- [x] `npm run build --prefix archive/apps-web` passes (2026-07-05, re-verified v2026.0.4.29 — agent session 18:34)
- [x] `firestore.indexes.json` valid JSON; 42 indexes incl. `transferBatches` (2), `recruits` (6), `diLeadershipCards` (2), `conversations` (3)
- [x] `/receiving/intake` renders Support/Receiving locked org + intake metrics (2026-07-05)
- [x] `/receiving/transfers`, `/company/incoming-recruits`, `/conversations`, `/di-leadership-cards` return 200 (2026-07-05)
- [x] Receiving company dropdown includes **Receiving** (not STC fallback) (2026-07-05)
- [x] `GET /api/transfer-batches` returns 401 without auth (2026-07-05 v29)
- [x] Transfer-batch APIs enforce role checks (403 paths in publish/initiate/accept/reject/export) — code review (2026-07-05 v29)
- [x] Single-recruit transfer API rejects non-`training` custodyPhase — code review (2026-07-05 v29)
- [x] Batch create API rejects recruits not in `receiving_ready` — code review (2026-07-05 v29)
- [x] Web `RecruitDetail`: custodyPhase badge, transfer history, `RecruitProgressPanel` when training — code review (2026-07-05 v29)
- [x] Expo dashboard: role-gated Receiving / Incoming quick actions — code review (2026-07-05 v29)
- [x] Expo recruit detail: progress read-only when `custodyPhase: training` — code review (2026-07-05 v29)
- [x] Expo Metro responds 200 on `:8081` — `/receiving/transfers`, `/company/incoming-recruits` (2026-07-06)
- [x] Web UI wired: batch detail publish/initiate/export CSV; incoming accept/reject (`/receiving/transfers/[id]`, `/company/incoming-recruits`)

## Kilo Company scenario (3rd Battalion)

- [x] **Receiving import**: 5 recruits via `receivingMode` API bulk import — 3 Lead/3001, 2 Follow/3003 destination intent — **kilo E2E** `npm run e2e:kilo` (2026-07-06)
- [x] **Checklist → ready**: all 5 `receiving_ready` — **kilo E2E** Admin SDK mark (2026-07-06); manual UI via `/receiving/intake` still open
- [x] **Two transfer batches**: Lead platoon 3001 (3 recruits), Follow platoon 3003 (2 recruits) → Kilo Company — **kilo E2E** (2026-07-06)
- [x] **Staged review per batch**: 1stSgt → CDI → SDI accept → `training` at destination platoon — **kilo E2E** 22/22 (2026-07-06); Follow batch requires series-scoped SDI
- [x] **Automation**: `npm run e2e:kilo` — 22/22 passed (2026-07-06)

```bash
./scripts/verify-countcard-auth.sh
npm run dev:functions   # separate terminal
npm run e2e:kilo
```

## E2E automation

```bash
node scripts/sprint27-client-e2e.mjs      # accept path — 12/12 (2026-07-06)
node scripts/sprint27-client-gaps.mjs     # reject, signatures, messaging, Expo — 27/27 (2026-07-06)
node scripts/sprint27-e2e.mjs             # full API path — requires valid Admin SDK creds
node scripts/kilo-receiving-e2e.mjs         # Kilo 5-recruit receiving import + staged review — 22/22 (2026-07-06)
npm run e2e:kilo                            # same as above
```

Covers Phases 0–4 API flows with synthetic test users; cleans up unless `--keep`.

## E2E blockers (remaining)

- **Admin SDK (local)**: `FIREBASE_ADMIN_CLIENT_EMAIL` / `PRIVATE_KEY` commented out in `.env.local`; gcloud ADC returns `invalid_rapt`. Refresh via Firebase Console → Service Accounts → Generate new private key → `./scripts/update-admin-sdk.sh <json>` → `node scripts/verify-admin-sdk.mjs` → `node scripts/sprint27-e2e.mjs` (with `npm run dev:functions`)
- **API export**: `GET /api/transfer-batches/[id]/export` requires server Admin SDK; client CSV export on batch detail still works
- **Production web**: Next.js Sprint 27 routes not on `countcard-94c5b.web.app` (static placeholder + Cloud Functions 403). Deploy Next.js to Vercel/App Hosting with `FIREBASE_ADMIN_*` env vars.
- **Custom domain**: `countcard.warriorwaypoint.com` DNS not resolving (2026-07-06)
- **E2E test account**: `s27-e2e@countcard.test` / `Sprint27-E2e!Test` (bootstrap admin — full access)
- **Golf scope test user (optional)**: `node scripts/set-golf-scope-claims.mjs <email> [sdi|cdi]` after Admin SDK creds are valid
- **Named DB**: project uses `(default)` only; scripts no longer default to `CountCard`

## Signed-in manual flow (email/password E2E user)

1. Sign in at `/login` with `s27-e2e@countcard.test`
2. Receiving DI: `/receiving/intake` → checklist (all items) → `/receiving/transfers` → select recruit → create → publish → export CSV → initiate
3. Destination SDI: `/company/incoming-recruits` → accept or reject custody
4. Recruit detail: `/recruits/edipi-9991234567` — `custodyPhase: training`, transfer history, add progress event
5. DI cards: `/di-leadership-cards` — create, sign, recommend
6. Messages: `/conversations` → open thread → send
7. Expo `:8081` dashboard → Receiving/Incoming quick actions; recruit detail progress read-only
