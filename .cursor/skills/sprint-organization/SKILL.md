---
name: sprint-organization
description: >-
  Keeps each CountCard sprint in sprints/Sprint-*/ with README, tasks, E2E
  scripts, and closeout. Use when creating or continuing a CountCard sprint.
---

# CountCard sprint organization

Follow the portfolio skill `~/.cursor/skills/sprint-organization/SKILL.md`, with CountCard conventions:

## Root

```
sprints/Sprint-NN-Short-Name/
  README.md
  TASKS.md
  TEST_MATRIX.md
  scripts/          # e.e. sprintNN-*-e2e.mjs
  CLOSEOUT.md
```

## Rules

- Primary client is Expo (`apps/expo`); do not revive archived Next.js web as the delivery target.
- Link Firestore rules/index deploy steps in the sprint README when rules change.
- End with Next prompt + manual testing checklist (multi-phase-handoff).
