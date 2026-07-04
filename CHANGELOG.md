# Changelog

All notable changes to CountCard Web are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Version numbers follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/your-org/CountCardWeb/compare/v0.2.0...HEAD)

- (Nothing yet.)

## [0.2.0](https://github.com/your-org/CountCardWeb/compare/v0.1.0...v0.2.0) - 2026-02-28

### Added

- **Human-to-human messaging (Sprint 9)**
  - Conversation list at `/conversations` with real-time updates
  - Conversation thread view with message send/receive and real-time listeners
  - New conversation flow with org-scoped recipient picker (battalion/company)
  - Message attachments: upload to Firebase Storage, validation, display in thread
  - In-conversation message search and list filter (all / unread)
  - Firestore real-time subscriptions: `conversationRealtime.ts`, `useConversations`, `useMessages`
- **Changelog and versioning**
  - This changelog; `package.json` version set to 0.2.0

### Deferred

- Message and attachment encryption (E2E) — pending product decision on key model; see `.cursor/plans/completed/sprint_9_human_messaging.plan.md`.

## [0.1.0](https://github.com/your-org/CountCardWeb/releases/tag/v0.1.0) - Initial release

- Core app: Next.js 16, Firebase (Auth, Firestore), Tailwind CSS 4, Zod
- Recruit and count card management, platoons, emergency contacts, user profiles
- End-to-end encryption (sodium-plus) for sensitive data; GDPR-oriented export/delete
- Mobile-first UI, 44px touch targets, responsive layout
- Security: CORS, rate limiting, role-based access, secure logging (no PII)