#!/usr/bin/env bash
# Deploy Firebase Storage rules for CountCard (project countcard-94c5b).
# Must run from a checkout that includes di-leadership-cards rules (not bare main
# before PR merge).
set -euo pipefail
cd "$(dirname "$0")/.."

if ! grep -q 'match /di-leadership-cards/{userId}' storage.rules; then
  echo "ERROR: storage.rules is missing di-leadership-cards path."
  echo "Checkout cursor/di-card-image-import-7ff2 (or a branch that includes it), then re-run."
  exit 1
fi

echo "Deploying storage.rules (includes di-leadership-cards)…"
firebase deploy --only storage --project=countcard-94c5b
echo "Done. Re-test Expo DI Cards → 3×5 image import → Create card."
