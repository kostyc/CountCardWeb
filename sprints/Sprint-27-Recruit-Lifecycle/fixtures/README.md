# Kilo receiving import fixture

Baseline: `~/Downloads/show me an example.xlsx` (5 generic recruits).

## File

`kilo-receiving-import-5.xlsx` — adjusted for CountCard receiving import:

| Gap in original | Fix |
|-----------------|-----|
| Masked EDIPI (`XXX-XX-4321`) | Full synthetic 10-digit EDIPIs `8870100001`–`8870100005` |
| No Platoon column | `0000` (Receiving; overridden in receiving mode) |
| Excel fraction times for IST plank/run | Human-readable `3:45`, `9:30`, etc. |
| No weapons serial | `Weapons Serial` column added |
| Kilo destination intent | Notes in Medical / Admin Flags (`Kilo Lead 3001` / `Kilo Follow 3003`) |

**Destination platoons** (3001 / 3003) are assigned when creating transfer batches on Receiving transfers, not at import.

## Regenerate

```bash
python3 scripts/build-kilo-import-fixture.py
cp sprints/Sprint-27-Recruit-Lifecycle/fixtures/kilo-receiving-import-5.xlsx ~/Downloads/
```

## Validate parser (no app)

```bash
npx tsx -e "
import { readFileSync } from 'fs';
import * as XLSX from 'xlsx';
import { parseRecruitImportSheet, isImportRowReadyForCommit } from './packages/core/src/import/recruitExcelImport.ts';
const wb = XLSX.read(readFileSync('./sprints/Sprint-27-Recruit-Lifecycle/fixtures/kilo-receiving-import-5.xlsx'));
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
const r = parseRecruitImportSheet(rows, { regiment: 'West', battalion: 'Support', company: 'Receiving', platoon: '0000' });
console.log(r.rows.length, r.rows.every(isImportRowReadyForCommit));
"
```

## Validate Expo import path (CLI, no Metro)

```bash
./scripts/verify-countcard-auth.sh
npx tsx scripts/kilo-expo-import-verify.mjs
```

Parses the fixture the same way as `apps/expo/lib/recruitImportLocal.ts`, checks receiving org/custody fields, and dry-runs existence via Admin SDK. **Live commit** must be done in the Expo app (see below).

## Manual UI test — Expo only (iOS / Android)

**Do not** start `npm run dev:functions` for this flow. Excel import is fully on-device; commit writes directly to Firestore.

### Prerequisites

1. `./scripts/verify-countcard-auth.sh`
2. Receiving DI account (Support Battalion / Receiving Company) or bootstrap admin
3. Fixture at `~/Downloads/kilo-receiving-import-5.xlsx`
4. `npm run dev:expo` → Metro on `http://localhost:8081`
5. Open app in iOS Simulator, Android emulator, or Expo Go dev build

### Import (works without web API)

1. Sign in as Receiving DI
2. **Recruits** tab → **Import** (or navigate to `/recruits/import`)
3. Confirm header **Import at Receiving** and org locked to Support / Receiving (platoon `0000`)
4. **Choose Excel or PDF** → select `kilo-receiving-import-5.xlsx`
5. Preview grid shows **5 recruits**, no missing required fields
6. **Validate (dry run)** → expect 5 would be created (or skipped if already imported)
7. **Import recruits** → success alert; redirects to `/receiving/transfers`

Each recruit should have `custodyPhase: receiving` and default `receivingChecklist` (5 items).

### Receiving checklist (Expo + Firestore)

1. Open each recruit profile from **Receiving** quick action or transfers screen
2. Complete **Receiving checklist** items → mark `receiving_ready`

### Blocked on Expo today (needs web API or Cloud Functions)

| Step | Expo status | Workaround |
|------|-------------|------------|
| Roster **photo** OCR | Requires `EXPO_PUBLIC_API_BASE_URL` → `/api/recruits/import/parse-image` | Use Excel path |
| **PDF** roster parse | Same API | Use Excel path |
| **Create / publish / initiate** transfer batches | Expo `/receiving/transfers` + detail screen (Firestore SDK) | — |
| **1stSgt / CDI / SDI** batch review | Expo `/company/incoming-recruits` (Firestore SDK) | — |

### What works client-side on Expo

- Excel `.xlsx` / `.xls` / `.csv` parse (`recruitImportLocal.ts` + `xlsx`)
- Import commit via `commitRecruitImportLocal` → Firestore `createRecruitProfile`
- Receiving mode org lock + custody fields
- List ready recruits and transfer batches (Firestore reads)

## API shortcut (web only — skips Expo upload UI)

```bash
npm run dev:functions   # required
node scripts/kilo-fixture-manual-flow.mjs --keep
```

Uses the same parsed rows as the xlsx upload via `/api/recruits/import`.
