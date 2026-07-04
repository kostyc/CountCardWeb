# Cloud Run API Access (Sprint 26)

## Problem

Direct Cloud Run URL `https://api-x5hh3t2iwq-uc.a.run.app` returns **403** for unauthenticated clients because org policy blocks `allUsers` `run.invoker`.

## Solution A — Firebase Hosting proxy (deployed; blocked by same org policy)

`firebase.json` rewrites `/api/**` → Gen2 function `api` (us-central1). Hosting is live at `https://countcard-94c5b.web.app`.

**Note:** Firebase Hosting → Cloud Run rewrites still require `allUsers` `roles/run.invoker` on the Cloud Run service (Hosting does not pass IAM credentials). Until org policy allows public invoker, both direct and hosting URLs return 403.

Set client env:

```bash
EXPO_PUBLIC_API_BASE_URL=https://countcard-94c5b.web.app
NEXT_PUBLIC_API_BASE_URL=https://countcard-94c5b.web.app
```

Deploy:

```bash
firebase deploy --only functions,hosting
```

Verify:

```bash
curl -s https://countcard-94c5b.web.app/api/health
# {"status":"ok","service":"countcard-api"}
```

## Solution B — Org policy exception (required; blocked as of 2026-07-04)

**2026-07-04:** `gcloud run services add-iam-policy-binding` with `allUsers` fails with `FAILED_PRECONDITION` (org policy). Health check still **403**.

Full org-admin runbook: [ORG-ADMIN-CLOUD-RUN.md](./ORG-ADMIN-CLOUD-RUN.md)

After org admin relaxes `iam.allowedPolicyMemberDomains` for project `countcard-94c5b`:

```bash
gcloud run services add-iam-policy-binding api \
  --region=us-central1 \
  --project=countcard-94c5b \
  --member="allUsers" \
  --role="roles/run.invoker"
```

Verify: `curl -s https://countcard-94c5b.web.app/api/health` → `{"status":"ok","service":"countcard-api"}`.

## API path prefix

Cloud Functions Express app mounts routes at `/api/*` (matches Next.js `/api/*` paths used by `@countcard/api-client`).
