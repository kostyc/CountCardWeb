# Sprint 11: Deploy and Seed

## Firestore deploy (done)

Indexes and rules have been deployed:

- `firebase deploy --only firestore:indexes`
- `firebase deploy --only firestore:rules`

To re-deploy later:

```bash
npx firebase deploy --only firestore:indexes
npx firebase deploy --only firestore:rules
```

## Seed initial regiments

To create West and East regiments when the org structure is empty:

**Option A – Logged-in admin**

1. Log in as a user with `manage_organizations` (e.g. company_commander or battalion_commander).
2. Call the seed endpoint with your auth token:

```bash
curl -X POST https://your-app-url/api/org/seed \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

Or from the browser console (while on the app):

```js
const token = await firebase.auth().currentUser.getIdToken();
await fetch('/api/org/seed', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
```

**Option B – Secret (no user)**

1. Add to `.env.local` (optional):

   ```
   ORG_SEED_SECRET=your-random-secret-here
   ```

2. Call the seed endpoint with the secret:

```bash
curl -X POST "https://your-app-url/api/org/seed?secret=your-random-secret-here"
# or
curl -X POST https://your-app-url/api/org/seed -H "x-seed-secret: your-random-secret-here"
```

If the `regiments` collection already has documents, the endpoint returns success without creating duplicates.

## After seed

Use **Admin → Organizational Structure** to add Battalions (under each Regiment), then Companies, Series, and Platoons via the UI.
