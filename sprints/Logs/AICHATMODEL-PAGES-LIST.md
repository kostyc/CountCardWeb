# AIChatModel Pages List

This document lists all pages found in the AIChatModel project structure.

## Generated: January 18, 2026

---

## Public Pages

### Root Pages
- **`/` (Home)** - `src/app/page.tsx`
  - Main chat interface
  - User authentication check
  - Terms acceptance modal
  - Onboarding redirect
  - Chat interface with conversation management

### Authentication Pages
- **`/login`** - `src/app/(auth)/login/page.tsx`
  - User login page

### Legal Pages
- **`/privacy`** - `src/app/privacy/page.tsx`
  - Privacy policy page
- **`/terms`** - `src/app/terms/page.tsx`
  - Terms of service page

---

## User Pages

### Profile Pages
- **`/profile`** - `src/app/profile/page.tsx`
  - User profile page
- **`/profile/extended`** - `src/app/profile/extended/page.tsx`
  - Extended profile information
- **`/profile/privacy`** - `src/app/profile/privacy/page.tsx`
  - Profile privacy settings

### Conversation Pages
- **`/conversations`** - `src/app/conversations/page.tsx`
  - Conversation history/list page

### Onboarding
- **`/onboarding`** - `src/app/onboarding/page.tsx`
  - User onboarding flow

### Subscription
- **`/subscribe`** - `src/app/subscribe/page.tsx`
  - Subscription management page

---

## Admin Pages

### Admin Dashboard
- **`/admin`** - `src/app/admin/page.tsx`
  - Admin dashboard/home

### Admin Management Pages
- **`/admin/users`** - `src/app/admin/users/page.tsx`
  - User management
- **`/admin/persona`** - `src/app/admin/persona/page.tsx`
  - Persona management
- **`/admin/guardrails`** - `src/app/admin/guardrails/page.tsx`
  - Guardrails management
- **`/admin/theme`** - `src/app/admin/theme/page.tsx`
  - Theme configuration
- **`/admin/inference`** - `src/app/admin/inference/page.tsx`
  - AI inference management
- **`/admin/api-keys`** - `src/app/admin/api-keys/page.tsx`
  - API keys management
- **`/admin/analytics`** - `src/app/admin/analytics/page.tsx`
  - Analytics dashboard

---

## API Routes

### Admin API Routes
- **`/api/admin/check`** - `src/app/api/admin/check/route.ts`
- **`/api/admin/list`** - `src/app/api/admin/list/route.ts`
- **`/api/admin/set-claims`** - `src/app/api/admin/set-claims/route.ts`
- **`/api/admin/sync`** - `src/app/api/admin/sync/route.ts`
- **`/api/admin/user-chat-limits`** - `src/app/api/admin/user-chat-limits/route.ts`

### Admin - Analytics
- **`/api/admin/analytics`** - `src/app/api/admin/analytics/route.ts`

### Admin - API Keys
- **`/api/admin/api-keys`** - `src/app/api/admin/api-keys/route.ts`

### Admin - Coaching Keywords
- **`/api/admin/coaching-keywords`** - `src/app/api/admin/coaching-keywords/route.ts`

### Admin - Conversations
- **`/api/admin/conversation/[conversationId]`** - `src/app/api/admin/conversation/[conversationId]/route.ts`
- **`/api/admin/conversation/[conversationId]/message/[messageId]/feedback`** - `src/app/api/admin/conversation/[conversationId]/message/[messageId]/feedback/route.ts`
- **`/api/admin/conversation/check-duplicates`** - `src/app/api/admin/conversation/check-duplicates/route.ts`

### Admin - Documents
- **`/api/admin/documents`** - `src/app/api/admin/documents/route.ts`
- **`/api/admin/documents/extract-file`** - `src/app/api/admin/documents/extract-file/route.ts`
- **`/api/admin/documents/extract-url`** - `src/app/api/admin/documents/extract-url/route.ts`
- **`/api/admin/documents/rollback`** - `src/app/api/admin/documents/rollback/route.ts`
- **`/api/admin/documents/sync`** - `src/app/api/admin/documents/sync/route.ts`
- **`/api/admin/documents/versions`** - `src/app/api/admin/documents/versions/route.ts`

### Admin - Guardrails
- **`/api/admin/guardrails`** - `src/app/api/admin/guardrails/route.ts`
- **`/api/admin/guardrails/[id]`** - `src/app/api/admin/guardrails/[id]/route.ts`
- **`/api/admin/guardrails/stats`** - `src/app/api/admin/guardrails/stats/route.ts`

### Admin - Inference
- **`/api/admin/inference`** - `src/app/api/admin/inference/route.ts`
- **`/api/admin/inference/list`** - `src/app/api/admin/inference/list/route.ts`
- **`/api/admin/inference/[conversationId]`** - `src/app/api/admin/inference/[conversationId]/route.ts`
- **`/api/admin/inference/[conversationId]/review`** - `src/app/api/admin/inference/[conversationId]/review/route.ts`
- **`/api/admin/inference/message/[messageId]`** - `src/app/api/admin/inference/message/[messageId]/route.ts`
- **`/api/admin/inference/process-feedback`** - `src/app/api/admin/inference/process-feedback/route.ts`

### Admin - Persona
- **`/api/admin/persona`** - `src/app/api/admin/persona/route.ts`
- **`/api/admin/persona/commit`** - `src/app/api/admin/persona/commit/route.ts`
- **`/api/admin/persona/history`** - `src/app/api/admin/persona/history/route.ts`
- **`/api/admin/persona/rollback`** - `src/app/api/admin/persona/rollback/route.ts`
- **`/api/admin/persona/test`** - `src/app/api/admin/persona/test/route.ts`

### Admin - Theme
- **`/api/admin/theme`** - `src/app/api/admin/theme/route.ts`
- **`/api/admin/theme/[configId]`** - `src/app/api/admin/theme/[configId]/route.ts`
- **`/api/admin/theme/[configId]/activate`** - `src/app/api/admin/theme/[configId]/activate/route.ts`

### User API Routes
- **`/api/chat`** - `src/app/api/chat/route.ts`
- **`/api/profile`** - `src/app/api/profile/route.ts`
- **`/api/profile/progress`** - `src/app/api/profile/progress/route.ts`
- **`/api/subscription`** - `src/app/api/subscription/route.ts`
- **`/api/theme/active`** - `src/app/api/theme/active/route.ts`
- **`/api/user/delete`** - `src/app/api/user/delete/route.ts`
- **`/api/user/export`** - `src/app/api/user/export/route.ts`

### Other API Routes
- **`/api/errors/report`** - `src/app/api/errors/report/route.ts`
- **`/api/notifications/send`** - `src/app/api/notifications/send/route.ts`
- **`/api/security/keys`** - `src/app/api/security/keys/route.ts`

---

## Summary

### Total Pages: 18
- Public Pages: 4
- User Pages: 6
- Admin Pages: 7
- API Routes: 30+

### Page Categories
1. **Authentication & Onboarding** (2 pages)
2. **User Interface** (4 pages)
3. **Profile Management** (3 pages)
4. **Admin Interface** (7 pages)
5. **API Endpoints** (30+ routes)

---

## Notes

- All pages use Next.js App Router structure
- Pages are organized by feature/functionality
- Admin pages require authentication and admin role
- API routes handle backend logic and data operations
- The home page (`/`) is the main entry point for authenticated users
