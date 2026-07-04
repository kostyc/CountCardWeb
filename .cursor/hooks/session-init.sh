#!/usr/bin/env bash
# CountCard sessionStart hook: inject security/compliance context for every agent session.
# Receives session JSON on stdin; outputs JSON with additional_context for Cursor.
set -e
cat > /dev/null
printf '%s\n' '{
  "continue": true,
  "additional_context": "CountCard project: production app for sensitive military recruit data. CRITICAL — (1) Never log PII, user IDs, or secrets; use debugLog from @/lib/utils/debugLogger for debugging, not console.log. (2) All sensitive recruit data must be E2E encrypted client-side; GDPR applies. (3) Design mobile-first: 44px min touch targets, narrow viewports (320–390px). (4) Validate API inputs with Zod; follow @.cursor/rules and AGENTS.md."
}'
