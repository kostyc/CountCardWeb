---
name: firestore-rules-testing
description: >-
  Tests and deploys CountCard Firestore rules for countcard-94c5b. Use when
  changing firestore.rules, debugging permission-denied, or before E2E that
  needs fresh rules.
---

# CountCard Firestore rules testing

Follow `~/.cursor/skills/firestore-rules-testing/SKILL.md`, then:

## Project

| Item | Value |
|------|-------|
| Project | `countcard-94c5b` |
| Rules | `firestore.rules` (repo root) |
| Indexes | `firestore.indexes.json` |
| Auth checklist | `.cursor/rules/gcloud-firebase-auth.mdc` |

## Deploy

Ask the user to reauth if needed, then:

```bash
cd /Users/daddymac/Projects/Countcard
./scripts/verify-countcard-auth.sh   # if present
npx -y firebase-tools@latest deploy --only firestore:rules --project countcard-94c5b
# when indexes changed:
npx -y firebase-tools@latest deploy --only firestore:indexes --project countcard-94c5b
```

## Verify

- Use client auth paths (Admin SDK bypasses rules).
- Cover DI admin vs recruit roles and encrypted field access expectations from AGENTS.md.
- Run sprint E2E scripts only after rules deploy when the sprint README requires it.
