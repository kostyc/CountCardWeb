#!/usr/bin/env bash
# Verify gcloud + Firebase + Admin SDK for CountCard only.
# Does NOT change gcloud config default project or global ADC quota project.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ID="countcard-94c5b"
ADMIN_SA="firebase-adminsdk-fbsvc@${PROJECT_ID}.iam.gserviceaccount.com"

cd "$PROJECT_ROOT"

echo "=========================================="
echo "CountCard auth verification"
echo "Project: ${PROJECT_ID}"
echo "=========================================="
echo ""

fail=0

echo "1. gcloud account"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -1 | grep -q .; then
  echo "   FAIL — no active gcloud account. Run: gcloud auth login"
  fail=1
else
  echo "   OK — $(gcloud auth list --filter=status:ACTIVE --format='value(account)' | head -1)"
fi
echo "   (global gcloud project config is NOT checked — multi-project setup)"
echo ""

echo "2. CountCard GCP project access"
if gcloud projects describe "${PROJECT_ID}" --project="${PROJECT_ID}" --format="value(projectId)" 2>/dev/null | grep -q "${PROJECT_ID}"; then
  echo "   OK — can describe ${PROJECT_ID}"
else
  echo "   FAIL — cannot access ${PROJECT_ID}. Run: gcloud auth login"
  fail=1
fi
echo ""

echo "3. Firebase CLI + project"
if ! command -v firebase >/dev/null 2>&1; then
  echo "   FAIL — firebase CLI not found"
  fail=1
elif firebase projects:list 2>&1 | tr -d '\r' | grep -qE "${PROJECT_ID}|${PROJECT_ID} \\(current\\)"; then
  echo "   OK — firebase lists ${PROJECT_ID}"
else
  echo "   FAIL — firebase cannot see ${PROJECT_ID}. Run: firebase login --reauth"
  fail=1
fi
if [[ -f .firebaserc ]] && grep -q "\"default\": \"${PROJECT_ID}\"" .firebaserc; then
  echo "   OK — .firebaserc default is ${PROJECT_ID} (repo-local only)"
else
  echo "   WARN — .firebaserc default does not match ${PROJECT_ID}"
fi
echo ""

echo "4. Application Default Credentials (Admin SDK)"
export GOOGLE_CLOUD_QUOTA_PROJECT="${PROJECT_ID}"
if GOOGLE_CLOUD_QUOTA_PROJECT="${PROJECT_ID}" node scripts/verify-admin-sdk.mjs; then
  echo "   OK — Admin SDK authenticated for ${PROJECT_ID}"
else
  echo "   FAIL — ADC expired or wrong account. Run: gcloud auth application-default login"
  fail=1
fi
echo ""

echo "5. Service account (reference)"
echo "   Admin SA: ${ADMIN_SA}"
echo "   Key file: org policy blocks creation — use ADC only"
echo ""

if [[ "$fail" -ne 0 ]]; then
  echo "=========================================="
  echo "FAILED — reauth in your terminal:"
  echo "  gcloud auth login"
  echo "  firebase login --reauth"
  echo "  gcloud auth application-default login"
  echo "=========================================="
  exit 1
fi

echo "=========================================="
echo "All checks passed for CountCard (${PROJECT_ID})"
echo "=========================================="
