# Expo Web Parity — Next.js Retirement Checklist

Do **not** remove `apps/web` until every item is verified.

- [x] All routes in `sprints/ROUTE-PLACEHOLDERS.md` have Expo screens (recruits/create, count-cards/new ported 2026-07-04)
- [ ] Encryption round-trip verified on iOS, Android, and Expo web (`verifyCrossPlatformCompatibility` on Profile)
- [x] Cloud Functions API deployed; `/api/*` path prefix aligned with `@countcard/api-client`
- [ ] Cloud Run public invoker OR hosting proxy working — org policy blocks `allUsers` `run.invoker` (403 on `/api/health`; see [CLOUD-RUN-API-ACCESS.md](./CLOUD-RUN-API-ACCESS.md))
- [x] **Expo workaround (2026-07-04):** Firestore client SDK + rules + `syncUserClaimsOnProfileWrite` trigger — see [CLOUD-RUN-WORKAROUND.md](./CLOUD-RUN-WORKAROUND.md). Expo flows no longer require HTTP API; web encryption/export still blocked until org policy fix.
- [x] Web app uses Cloud Functions URL (`NEXT_PUBLIC_API_BASE_URL=https://countcard-94c5b.web.app`) — env set; API still 403 until org policy resolved
- [x] Admin, profile wizard, count-card workflow, messaging UI ported to Expo
- [ ] EAS production builds pass store review requirements
- [ ] Firebase App Check configured for native (App Attest / Play Integrity) — RNFB wired; REST configs verified 2026-07-04; **confirm in Console**; Android SHA-256 pending (no EAS builds yet)
- [x] EAS preview environment variables pushed (`eas env:push preview` — 8 `EXPO_PUBLIC_*` vars, 2026-07-04)

When complete: archive `apps/web`, point Firebase Hosting to `apps/expo` web export.
