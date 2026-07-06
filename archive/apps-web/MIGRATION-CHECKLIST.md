# `apps/web` → `archive/apps-web` migration checklist

**Status:** Executed 2026-07-06 (Phase 7).

`apps/web` archived to `archive/apps-web`.

## Pre-flight (must be green)

- [x] Expo UI parity — `/di-leadership-cards`, `/receiving/import`, `/profile/encryption`, Messages org-channel create (Phase 5)
- [x] Cloud Functions API parity — transfer batches, recruits lifecycle, DI cards, org-channel, `wrap-dek`, `parse-image`, `parse-document`
- [x] E2E scripts default to Functions emulator (`scripts/e2e-api-base.mjs`)
- [x] E2E green: `sprint27-e2e` 36/36, `sprint27-client-e2e` 14/14, `sprint27-client-gaps` 30/30
- [x] Root `package.json` — `dev:web` / `build:web` removed (Phase 6)
- [ ] Encryption round-trip on iOS, Android, Expo web (`verifyCrossPlatformCompatibility` on Profile)
- [ ] EAS production builds pass store review
- [ ] Firebase App Check enforced on native (Console + Android SHA-256)
- [ ] Cloud Run public invoker OR hosting proxy (org policy — see `sprints/Sprint-26-2026-07-04/CLOUD-RUN-API-ACCESS.md`)
- [ ] `EXPO-WEB-PARITY.md` fully checked on physical devices

## Archive steps (Phase 7)

1. **Final grep** — no imports from `apps/web` in Expo, Functions, or packages:
   ```bash
   rg 'apps/web|countcard-web' --glob '!archive/**' --glob '!sprints/**' --glob '!*.md'
   ```
2. **Move directory**
   ```bash
   git mv apps/web archive/apps-web
   ```
3. **Workspace** — remove `apps/web` from npm workspaces if still listed; confirm `apps/*` still resolves `apps/expo` only.
4. **Lint** — replace root `npm run lint` (currently `countcard-web`) with Expo or monorepo lint target.
5. **Docs** — update `README.md`, `AGENTS.md`, `apps/web/DEPRECATED.md` → `archive/apps-web/README.md`, sprint references.
6. **CI / scripts** — remove or retarget any `dev:web` / `localhost:3000` references in `scripts/`, `sprints/`, `.cursor/`.
7. **Firebase Hosting** — point to Expo web export stub (see Phase 7 hosting plan).
8. **Deploy** — Functions only if API surface changed; no gcloud default project changes.

## Post-archive verification

- [ ] `npm run dev:expo` — all tab routes and Phase 5 screens load
- [ ] `npm run dev:functions` + `npm run e2e:sprint27` — full pass
- [ ] `npm run e2e:kilo-expo` — Excel import without web
- [ ] No broken workspace installs (`npm install` from clean clone)
- [ ] Firebase Hosting serves Expo export or redirect stub

## Rollback

If archive breaks E2E or deploy:

```bash
git mv archive/apps-web apps/web
# restore root package.json scripts if needed
```

Keep `archive/apps-web` read-only reference for one sprint before permanent deletion.
