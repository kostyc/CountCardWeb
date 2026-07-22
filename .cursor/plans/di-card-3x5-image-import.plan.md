---
name: DI card 3x5 image import
overview: Add Expo UI to import a photographed/scanned 3x5 DI leadership card into Firebase Storage and create a diLeadershipCards document with cardType three_by_five_import.
todos:
  - id: storage
    content: Add Storage rules path + uploadDILeadershipCardImage helper
    status: completed
  - id: picker
    content: Add 3x5 aspect image picker helper
    status: completed
  - id: screen
    content: Extend di-leadership-cards screen with type toggle, preview, create, list
    status: completed
  - id: qa
    content: Browser QA create 3x5 import card with image
    status: in_progress
status: active
isProject: false
---

# DI Leadership Card — 3×5 Image Import

## Current state

- Model already supports `cardType: 'three_by_five_import'` and `importImageUrl` (`packages/core`).
- Expo screen only creates `digital_form` cards (Sprint 27 follow-up gap).
- Storage helpers exist for profile/recruit photos; no DI-card path in `storage.rules`.

## Approach

1. Allow authenticated uploads under `di-leadership-cards/{userId}/…` (images ≤5MB).
2. Reuse validated image picker with **3:5** crop aspect (index-card proportions).
3. Screen: toggle Digital form vs 3×5 import; require image for 3×5; upload then `createDILeadershipCard`; show preview + recent cards list.

## Files

| File | Change |
|------|--------|
| `storage.rules` | New match for `di-leadership-cards/{userId}` |
| `apps/expo/lib/storage.ts` | `uploadDILeadershipCardImage` |
| `apps/expo/lib/imagePicker.ts` | `pickDiCardImage` (3:5 aspect) |
| `apps/expo/app/di-leadership-cards.tsx` | Type toggle, pick/preview, create, list |

## Acceptance

- User can pick/capture a 3×5 image on Expo web, create a card, see preview URL on the created card.
- Digital form create path still works without an image.
- `npm run lint` passes.
