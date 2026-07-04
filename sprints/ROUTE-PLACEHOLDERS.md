# Route placeholders and sprint mapping

This document lists every user-facing link in the project and what needs to be added based on sprints. Use it to avoid showing errors: incomplete or missing routes show **UnderConstructionPlaceholder** with sprint ref and “What needs to be added.” If a route has no sprint mentioned in any sprint doc, it is labeled **Under construction, unknown sprint**.

## Current error fix (build/runtime)

- **Recruits page** had build error: `Spinner` was imported as named from `@/components/feedback/Spinner` (default export). Fixed by importing from `@/components/feedback` in:
  - `app/(dashboard)/recruits/page.tsx`
  - `app/(dashboard)/recruits/[id]/edit/page.tsx`
  - `app/(dashboard)/count-cards/[id]/page.tsx`

## Placeholder pages (no page → placeholder)

| Link / Route        | Sprint reference | What needs to be added |
|---------------------|------------------|------------------------|
| **/share**          | Sprint 7         | Share App UI and flow (UserMenu placeholder per Sprint 2). Define share target (link, email) and permissions. |
| **/privacy-policy** | Sprint 2         | Full privacy policy document. Version tracking and acceptance storage (Sprint 2 acceptance flow exists). |
| **/terms-of-service** | Sprint 2       | Full terms of service document. Version tracking and acceptance storage (Sprint 2 acceptance flow exists). |

## Dashboard nav (layout)

| Link          | Sprint reference | What needs to be added |
|---------------|------------------|------------------------|
| **/dashboard** | Sprint 1–6       | Dashboard content and widgets per product backlog. |
| **/recruits** | Sprint 6         | Recruit list import (Sprint 6 Task 10 – future build). Import API, UI placeholder, schema (CSV/Excel/JSON), import history. |
| **/count-cards** | Sprint 7      | Export filtered results to CSV/PDF (Sprint 7 Task 4 – deferred to Sprint 12). Audit trail and reporting (Sprint 7 Tasks 8 & 9 – deferred). |
| **/settings** | Sprint 8          | Settings export/import (Sprint 10). Phone auth UI complete (Sprint 2 deferred). |

## User menu

| Link        | Sprint reference | What needs to be added |
|-------------|------------------|------------------------|
| **/profile** | Sprint 2, 5     | Profile view/edit content if not complete. |
| **/settings** | Sprint 8       | See Dashboard nav. |
| **/share**   | Sprint 7        | See Placeholder pages. |
| **/admin**   | Sprint 2        | Role assignment and user search complete. Additional admin tools per backlog. |

## Auth and public

| Link   | Sprint reference | What needs to be added |
|--------|------------------|------------------------|
| **/**  | Sprint 1         | Home page content. |
| **/login** | Sprint 2     | Complete. |
| **/signup** | Sprint 2    | Complete. |
| **/reset-password** | Sprint 2 | Complete. |
| **/reset-password/confirm** | Sprint 2 | Complete. |

## Recruit flows

| Link                 | Sprint reference | What needs to be added |
|----------------------|------------------|------------------------|
| **/recruits**        | Sprint 6         | Import (Task 10 placeholder). |
| **/recruits/create** | Sprint 6         | Core complete. |
| **/recruits/[id]**   | Sprint 6         | Core complete. |
| **/recruits/[id]/edit** | Sprint 6     | Core complete. |

## Count card flows

| Link                  | Sprint reference | What needs to be added |
|-----------------------|------------------|------------------------|
| **/count-cards**      | Sprint 7         | Export CSV/PDF; audit trail; reporting (deferred). |
| **/count-cards/new**  | Sprint 7         | Core complete. Notifications (Sprint 19). |
| **/count-cards/[id]** | Sprint 7        | Individual recruit list in detail (data model). |

## Profile

| Link                | Sprint reference | What needs to be added |
|---------------------|------------------|------------------------|
| **/profile**        | Sprint 2, 5      | View/edit if not complete. |
| **/profile/create** | Sprint 5         | Wizard complete. Optional: block app until minimum fields. |

## Config and component

- **Config**: `lib/constants/routePlaceholders.ts` – `ROUTE_PLACEHOLDERS` and `getRoutePlaceholder(pathname)`.
- **Component**: `components/feedback/UnderConstructionPlaceholder.tsx` – renders title, sprint ref (or “unknown sprint”), and “What needs to be added” list; optional Back to Dashboard link.

To add a new route: add an entry to `ROUTE_PLACEHOLDERS` and, if the route has no page yet, add a page that renders `<UnderConstructionPlaceholder />`.
