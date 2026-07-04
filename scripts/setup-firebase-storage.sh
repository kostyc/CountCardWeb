#!/usr/bin/env bash
# Enable Firebase Storage and create default bucket via gcloud/CLI.
# Prereq: gcloud auth login (and optionally: gcloud config set project countcard-94c5b)
# Usage: ./scripts/setup-firebase-storage.sh

set -e
PROJECT_ID="${PROJECT_ID:-countcard-94c5b}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Using project: $PROJECT_ID"

# 1. Enable Firebase Storage API
echo "Enabling firebasestorage.googleapis.com..."
gcloud services enable firebasestorage.googleapis.com --project="$PROJECT_ID"

# 2. Create default Firebase Storage bucket (REST API)
#    Requires Blaze plan. Bucket name will be {PROJECT_ID}.firebasestorage.app
echo "Creating default Storage bucket..."
TOKEN="$(gcloud auth print-access-token)"
LOCATION="${STORAGE_LOCATION:-us-central1}"
RESPONSE="$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://firebasestorage.googleapis.com/v1alpha/projects/${PROJECT_ID}/defaultBucket" \
  -d "{\"location\": \"${LOCATION}\"}")"
HTTP_CODE="$(echo "$RESPONSE" | tail -1)"
HTTP_BODY="$(echo "$RESPONSE" | sed '$d')"

if [[ "$HTTP_CODE" == "200" ]] || [[ "$HTTP_CODE" == "201" ]]; then
  echo "Default bucket created/linked."
elif [[ "$HTTP_CODE" == "409" ]]; then
  echo "Default bucket already exists (re-linked)."
else
  echo "Unexpected response (HTTP $HTTP_CODE): $HTTP_BODY"
  exit 1
fi

# 3. Deploy Storage rules (firebase.json already has storage.rules)
echo "Deploying Storage rules..."
cd "$REPO_ROOT"
firebase deploy --only storage --project="$PROJECT_ID"

# 4. Set CORS on the bucket (bucket name for new buckets is PROJECT_ID.firebasestorage.app)
BUCKET="${PROJECT_ID}.firebasestorage.app"
echo "Setting CORS on gs://${BUCKET}..."
if command -v gsutil &>/dev/null; then
  gsutil cors set "$REPO_ROOT/storage.cors.json" "gs://${BUCKET}"
  echo "CORS updated."
else
  echo "gsutil not found. Set CORS manually: gsutil cors set storage.cors.json gs://${BUCKET}"
fi

echo "Done. Profile picture upload from the app should work after a refresh."
