# 19 — The UI line: HeroUI, React Aria, Motion 14 and Scalar 0.12

Status: ready-for-agent
Blocked by: 26 (React 19.3)
Target release: 0.26.0-beta

Spec: `.scratch/dependency-upgrades/spec.md`

## What to build

Bump the web app's UI dependencies together, because their peers interlock:

- **`@heroui/react` and `@heroui/styles` 3.2.4 → 3.2.6.**
  - Their peers rise to `react-aria-components ^1.21.1` and `react-aria ^3.52.1`, plus a new `@internationalized/date ^3.12.4`.
  - So `react-aria-components` moves from 1.20.0 (pinned in `apps/web/package.json`) to the newest 1.22.x, and `@internationalized/date` moves with it.
  - RAC 1.22.1 was three days old at research time; take the newest patch.
- **`motion` 13.1.1 → 14.1.0.**
  - It removes only what 13.x had deprecated: ViewTimeline ranges and `observeTimeline`.
  - `useScroll()` without options (`apps/web/hooks/auto-hide.tsx`) is unaffected.
  - **Drag-in-layout internals changed**, so check every Reorder UI by hand: the step and ingredient inputs, the store and aisle editors, and the swipable rows.
- **`@scalar/nextjs-api-reference` 0.11.16 → 0.12.9.**
  - The static `ApiReference` call in `apps/web/app/api/docs/route.ts` is unchanged.
  - The page now loads its ESM bundle from jsDelivr, and the inline config is escaped.
  - The new `{ headers }` option lets the route send `Cache-Control: no-store`.
- **Patch bumps:** `tailwind-merge` 3.7.0, `@tanstack/react-virtual` 3.14.17, and `serwist` / `@serwist/turbopack` 9.5.13.

## Acceptance criteria

- [ ] **Single copies.** `pnpm why react-aria-components react-aria @internationalized/date` shows one version of each.
- [ ] **HeroUI surfaces.** Checked by hand on desktop and touch: date pickers, selects, modals, drawers, menus.
- [ ] **Reorder interactions.** Steps, ingredients, stores and aisles reorder correctly with mouse and touch, and swipable rows still swipe.
- [ ] **API reference.** `/api/docs` renders and sends `Cache-Control: no-store`.
- [ ] **Gates and E2E.** The repo gates pass, and `pnpm test:e2e` passes.

## Comments

- Filed 2026-10-12 with the spec.
- Sources:
  - motion, framer-motion and motion-dom 13.1.1 and 14.1.0;
  - @scalar/nextjs-api-reference 0.11.16 and 0.12.9, and @scalar/client-side-rendering (CHANGELOGs);
  - the HeroUI 3.2.6 peer ranges.
