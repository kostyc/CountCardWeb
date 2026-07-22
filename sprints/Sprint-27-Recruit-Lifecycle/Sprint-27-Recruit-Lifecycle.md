# Sprint 27 — Recruit Lifecycle Workflow

**Date**: 2026-07-05  
**Branch**: `feature/recruit-lifecycle-workflow`  
**Status**: Complete (manual verification done 2026-07-06)

## Overview

Replace immediate recruit transfer with Receiving → custody handoff → training progress → DI leadership cards → org messaging.

## Phases

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Receiving company, custodyPhase, intake fields | Done |
| 1 | Transfer batches, publish/accept/reject, Receiving UI | Done |
| 2 | Progress events + append comments | Done |
| 3 | DI leadership cards + signatures | Done |
| 4 | Org messaging channels + web UI | Done |
| 5 | Firestore rules/indexes, Expo parity | Done |

## Phase 0 Tasks

- [x] Add `Receiving` to Support Battalion company enum
- [x] Add `custodyPhase`, height/weight, PFT/CFT, checklist, intendedAssignment to recruit model
- [x] Block org edit when custodyPhase !== training
- [x] Receiving intake defaults on create

## Phase 1 Tasks

- [x] `transferBatches` collection + service
- [x] API: create, publish, initiate, accept, reject
- [x] Roster CSV export (authenticated fetch download)
- [x] Web UI: `/receiving/*`, `/company/incoming-recruits`
- [x] Guard single-recruit transfer for training phase only (API + UI + client SDK)
- [x] Lifecycle API authorization (Receiving / destination company roles)

## Phase 2 Tasks

- [x] `recruits/{id}/progressEvents` subcollection
- [x] `recruits/{id}/comments` subcollection
- [x] Progress tab on recruit detail (web + Expo read-only)

## Phase 3 Tasks

- [x] `diLeadershipCards` collection + service
- [x] Create / recommend / dual signature API + web page

## Phase 4 Tasks

- [x] Org-scoped conversation types
- [x] Web messaging UI (`/conversations`)
- [x] `wrap-dek` API route

## Phase 5 Tasks

- [x] Firestore rules + indexes (including `diLeadershipCards`)
- [x] Fix edit-bypass for status/org (transfer button gated by custodyPhase)
- [x] Expo parity screens (receiving list, incoming recruits, progress read-only)
- [x] Manual test matrix verification — see [TEST-MATRIX.md](./TEST-MATRIX.md) (2026-07-06)

## Known follow-ups (post-sprint)

- Firestore rules: full role-scope enforcement deferred to Sprint 14
- E2E encryption not wired to `/conversations` thread UI (plaintext MVP)
- DI cards: 3×5 image import UI — implemented in Expo (`/di-leadership-cards`); deploy `storage.rules` for `di-leadership-cards/{userId}` before production use
- Expo: batch create/publish uses web app; mobile supports list + accept/reject

See [TEST-MATRIX.md](./TEST-MATRIX.md) for verification checklist.
