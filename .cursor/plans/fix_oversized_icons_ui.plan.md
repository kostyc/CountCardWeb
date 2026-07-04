---
name: Fix oversized icons UI
overview: Constrain icon and layout sizing on the landing page and dashboard so icons and graphics never dominate the screen, without changing the overall structure.
todos: []
isProject: false
---

# Fix Oversized Icons on Landing and Dashboard

## Root cause (likely)

- **SVGs** used as icons have no intrinsic size (only Tailwind `w-*` / `h-*`). If the container grows (e.g. flex/grid) or Tailwind classes don't apply, SVGs can expand to fill space.
- **Landing page**: Hero uses `flex-1` and a 2-column grid with only one column filled; the empty second column or stretching content can create odd layout and oversized visuals.
- **Dashboard**: Quick-link cards use the same people/clipboard/settings SVGs; same risk if containers grow.

## Approach

Apply **defensive sizing** everywhere icons appear: explicit SVG dimensions, constrained wrappers, and layout tweaks so nothing can grow unbounded.

---

## 1. Landing page ([app/page.tsx](app/page.tsx))

**Icon containers (Key Features)** — Add `shrink-0` and `max-w-10 max-h-10` to icon wrapper divs; add `width`/`height` to every inline SVG.

**Hero section layout** — Single-column grid (`grid-cols-1`); add `min-w-0` on content wrapper and column.

**Background** — Cap background pattern with `background-size: 60px 60px` (e.g. `bg-[length:60px_60px]`).

---

## 2. Dashboard ([app/dashboard/page.tsx](app/dashboard/page.tsx))

**QUICK_LINKS** — Add `width={32} height={32}` and `shrink-0` to each SVG; icon wrapper span: `shrink-0 max-w-14 max-h-14`.

---

## 3. Shared icon sizing pattern

- **All icon SVGs**: Use Tailwind `w-*` `h-*` and HTML `width`/`height`.
- **All icon wrappers**: Fixed size plus `flex-shrink-0` (and `max-w-*` `max-h-*` when inside a flex child that can grow).

---

## 4. Files to touch

| File | Changes |
|------|---------|
| [app/page.tsx](app/page.tsx) | Hero layout, feature icon wrappers, SVG dimensions, background size. |
| [app/dashboard/page.tsx](app/dashboard/page.tsx) | QUICK_LINKS SVG dimensions and icon wrapper shrink/max. |

---

## 5. Verification

- **Landing**: Unauthenticated; no large circles or oversized icons; layout balanced on mobile and desktop.
- **Dashboard**: Quick-link cards show small icons; resize window and confirm icons don't grow.

---

## 6. Prevention (going forward)

- **Implement the fix**: Apply the landing and dashboard changes above.
- **Update guidelines**: Add "Icons and decorative graphics" rules to `.cursor/rules/ui-ux-guidelines.mdc` so future work follows the same pattern.
- **When adding new icons or decorative graphics**: Use explicit SVG `width`/`height`, constrained wrappers (`shrink-0`, `max-w-*`/`max-h-*` where needed), and fixed `background-size` for background patterns so icons and graphics never dominate the screen.
