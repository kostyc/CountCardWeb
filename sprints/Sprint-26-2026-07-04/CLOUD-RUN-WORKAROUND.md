# Cloud Run API Workaround (Sprint 26)

Org policy blocks `allUsers` `roles/run.invoker` on Cloud Run `api`, so `/api/health` and all HTTP API routes return **403**. Expo and web clients cannot use `@countcard/api-client` until [ORG-ADMIN-CLOUD-RUN.md](./ORG-ADMIN-CLOUD-RUN.md) is completed.

## Workaround (deployed)

Expo native flows bypass the HTTP API:

| Flow | Mechanism |
|------|-----------|
| Profile create/update | Firestore client SDK (`saveUserProfileToFirestore`) |
| Custom claims sync | Firestore trigger `syncUserClaimsOnProfileWrite` on `userProfiles/{userId}` |
| Recruits create/list/detail | Firestore client SDK |
| Count cards create/list/read | Firestore client SDK |
| Count card workflow actions | `@countcard/firebase` services (direct Firestore writes) |
| Admin user search + role assign | `listUserProfiles` + `updateUserProfile` (trigger syncs claims) |
| Messaging | Firestore client SDK (unchanged) |

## Firestore rules

`firestore.rules` allows authenticated access to `recruits` and `countCards`, and lets `company_commander` / `battalion_commander` read/update any `userProfiles` document. Full role-scoped rules remain Sprint 14.

## Deploy

```bash
firebase deploy --only firestore:rules,functions:syncUserClaimsOnProfileWrite
```

## Still requires HTTP API (web / future Expo parity)

- Encryption key management (`/api/encryption/*`)
- Recruit GDPR export (`/api/recruits/:id/export`)
- Web-only profile photo / org members / logos routes

When org admin grants public invoker, set `EXPO_PUBLIC_API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL` and verify `curl -s https://countcard-94c5b.web.app/api/health`.

## Permissions without custom claims

`checkPermission` falls back to `user.profile.role` when JWT claims are stale. After profile write, wait ~1.5s and refresh token for claims to match.
