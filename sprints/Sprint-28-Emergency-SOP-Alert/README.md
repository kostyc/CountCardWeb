# Sprint 28 — Emergency Button + Medical SOP Alert

**Date**: 2026-07-22  
**Status**: Implemented (manual TEST_MATRIX pending)  
**Client**: Expo (`apps/expo`)

## Goal

Add a prominent **Emergency** control that starts a medical/injury (or other) incident, notifies the **company chain of command** in-app, and runs a claimable SOP task checklist. Only the Company Commander can escalate to battalion leadership.

## Locked decisions

| Decision | Choice |
|----------|--------|
| Scope | Medical/injury primary; other types selectable |
| Tasks | Hybrid — auto-spawn checklist; claim; SDI/CDI+ reassign |
| Medical SOP | Placeholder until command provides official checklist |
| Notify v1 | Firestore real-time + in-app banner (FCM later) |
| Initial fan-out | **Company CoC for all incident types** (type does not change recipients) |
| Battalion notify | **Company Commander only** → Bn CO / XO / SgtMaj |

### Company CoC recipients (initial)

- Platoon DI / SDI on the initiator’s platoon
- Both series’ Chief Drill Instructors in that company
- Series Commander for the initiator’s series (both if series unknown)
- Company XO, CO, and 1stSgt

### Battalion escalate (CO only)

Adds `battalion_commander`, `battalion_xo`, `battalion_sgt_maj` — does **not** fan out to the entire battalion.

Banner and list visibility are gated by `notifiedUserIds` (UX). Firestore rules remain authenticated-readable for the battalion query; tightening rules is a follow-up.

## Non-goals (v1)

- FCM / SMS / email push
- Encrypted alert message bodies
- Auto-dial 911 from the OS (deep link where allowed)
- Treating placeholder SOP as official MCRD/depot doctrine

## Success criteria

- Authenticated staff can start an alert in a few taps
- Company CoC users with the app open see the live banner
- Placeholder medical tasks can be claimed and completed
- SDI/CDI+ can reassign and resolve
- Only CO can “Notify battalion command”
- SOP swap path documented when official list arrives

## Key paths

- Types / SOP templates: `packages/core`
- Recipient rules: `packages/core/src/permissions/incidentAlerts.ts`
- Service: `packages/firebase/src/services/incidentAlerts.ts`
- UI: `apps/expo/app/emergency/*`, dashboard CTA, `ActiveIncidentBanner`
- Rules: `firestore.rules` (`incidentAlerts`)

## SOP pending

Official medical SOP text is **not** available yet. Tasks ship from `incidentSopTemplates.ts` marked `PLACEHOLDER_SOP`. When command provides the list, replace that file (or load `incidentSopConfig` in a follow-up) without redesigning the UI.
