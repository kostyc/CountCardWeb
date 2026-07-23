---
name: validate-countcard-privacy
description: >-
  Privacy review for CountCard recruit PII, E2E encryption, logging, and
  GDPR/export/delete flows. Use for privacy audits, PII checks, or before
  store Data Safety updates.
---

# CountCard privacy validation

1. Read and follow `~/.cursor/skills/validate-privacy/SKILL.md`.
2. Extra CountCard checks:
   - Recruit PII encrypted client-side before Firestore write (`@countcard/encryption`)
   - UI masks PII by default
   - No EDIPI/name/email in logs, analytics, or crash reports
   - Export + delete account paths remain functional when touched
   - Zod validation on API inputs; no secrets in client bundles beyond `EXPO_PUBLIC_*`
3. Report findings with severity + file paths; fix only when the user asks (or when clearly in scope of the current task).
