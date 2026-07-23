---
name: store-release
description: >-
  Prepares CountCard EAS / App Store / Play listing and production submits.
  Use for TestFlight, Play Console, eas build/submit, What's New, or store copy.
---

# CountCard store release

Follow `~/.cursor/skills/store-release/SKILL.md`.

## CountCard specifics

- Expo app root: `apps/expo`
- Firebase project: `countcard-94c5b`
- Emphasize E2E encryption + GDPR/PII claims accurately (see AGENTS.md + `validate-privacy`)
- Confirm `eas.json` profiles before production submit
- Privacy: warriorwaypoint.com/privacy unless CountCard docs override

```bash
cd apps/expo
eas build --platform ios --profile production
eas build --platform android --profile production
```

Submit only when the user asks. Never commit keystores or `.env`.
