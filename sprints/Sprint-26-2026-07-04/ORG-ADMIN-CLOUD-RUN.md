# Org Admin — Cloud Run Public Invoker (Sprint 26)

**Project:** `countcard-94c5b`  
**Organization:** `766205069656`  
**Service:** Cloud Run `api` (Gen2 function), region `us-central1`  
**Account attempted:** `info@warriorwaypoint.com` (project owner; **not** org policy admin)

## Current state (2026-07-04)

| Check | Result |
|-------|--------|
| `curl -s https://countcard-94c5b.web.app/api/health` | **403 Forbidden** |
| `gcloud run services add-iam-policy-binding api ... --member=allUsers --role=roles/run.invoker` | **FAILED_PRECONDITION** — org policy blocks `allUsers` |
| Current `roles/run.invoker` on `api` | Service accounts only (compute, App Engine, firebase-adminsdk) — no public invoker |

Firebase Hosting rewrites `/api/**` → this Cloud Run service. Hosting does **not** pass IAM credentials, so **`allUsers` `run.invoker` is required** for the health check and all mobile/web API calls through `https://countcard-94c5b.web.app/api/*`.

## Step 1 — Relax org policy (org admin only)

The blocking constraint is typically **`constraints/iam.allowedPolicyMemberDomains`**, which prevents `allUsers` / `allAuthenticatedUsers` IAM members.

**Option A — Project exception (recommended, scoped to CountCard):**

In [Organization policies](https://console.cloud.google.com/iam-admin/orgpolicies?organizationId=766205069656) → **Domain restricted sharing** (`iam.allowedPolicyMemberDomains`):

1. **Manage policy** → override for project **`countcard-94c5b`**
2. Set **Policy enforcement** to allow **`allUsers`** and **`allAuthenticatedUsers`** (or “Allow All” for this project only)

**Option B — gcloud (org admin with `orgpolicy.policy.set` on the org or project):**

```bash
# Example: project-level override — adjust to match your org’s policy shape
gcloud resource-manager org-policies set-policy POLICY_FILE.json \
  --project=countcard-94c5b
```

Use the [Policy Troubleshooter](https://console.cloud.google.com/iam-admin/troubleshooter) link from a failed `add-iam-policy-binding` if the exact constraint name differs.

## Step 2 — Grant public invoker

After Step 1 succeeds:

```bash
gcloud run services add-iam-policy-binding api \
  --region=us-central1 \
  --project=countcard-94c5b \
  --member="allUsers" \
  --role="roles/run.invoker"
```

## Step 3 — Verify

```bash
curl -s https://countcard-94c5b.web.app/api/health
# Expected: {"status":"ok","service":"countcard-api"}

curl -s https://api-x5hh3t2iwq-uc.a.run.app/api/health
# Expected: same JSON (direct Cloud Run URL)
```

## Notes

- `info@warriorwaypoint.com` cannot read org-level policies (`orgpolicy.policy.get` denied on org `766205069656`).
- Enabling `orgpolicy.googleapis.com` on `countcard-94c5b` alone is insufficient; the override must be set at **org or project** level by an org admin.
- Until this is fixed, Expo screens that use Firestore directly (`recruits/create`, `count-cards/new`) still work; routes that call `@countcard/api-client` will fail.
