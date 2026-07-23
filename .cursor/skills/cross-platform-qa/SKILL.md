---
name: cross-platform-qa
description: >-
  Runs CountCard Expo QA on web/iOS/Android for DI and recruit roles. Use for
  E2E, role testing, smoke, or TEST-MATRIX updates.
---

# CountCard cross-platform QA

Follow `~/.cursor/skills/cross-platform-qa/SKILL.md`.

## CountCard notes

- Monorepo: `apps/expo` primary; start per AGENTS.md / package scripts
- Prefer live Firebase `countcard-94c5b` when E2E requires it; confirm auth via `gcloud-firebase-auth` rule
- Active matrix: latest `sprints/Sprint-*/TEST_MATRIX.md` or `sprints/TEST-TRACKING.md`
- Do not paste passwords into new files — read from existing sprint QA docs
- Encryption/PII regressions → `validate-countcard-privacy`
- Rules failures → `firestore-rules-testing`
