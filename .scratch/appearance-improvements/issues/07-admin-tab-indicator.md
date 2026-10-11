# 07 — Settings tab pill mis-measures on a direct load of ?tab=admin

Status: resolved
Type: task

**Observed 2026-08-14** while verifying the general-card layout fix, on the dev stack (admin account, desktop 1440×900, headless Chromium):

Loading `/settings?tab=admin` directly (fresh document, not by clicking a tab) renders the tab list wrong: the selected-tab pill is stretched across the area of the first three tabs (User/Household/CalDAV — their labels are hidden under it), the "Admin" label sits outside the pill at the right, and a scroll chevron appears even though all four tabs fit at this width. The DOM is correct throughout: all four `role="tab"` elements exist with the right labels and `aria-selected` on Admin. Loading `?tab=user` directly renders the list perfectly, so the trigger seems to be the selected tab being a late/rightmost entry when `Tabs.Indicator` takes its initial measurement.

Reproduced deterministically on two separate loads (screenshots at 2.5s and 4s after navigation, so not a transient). Pre-existing: reproduced with the working tree's general-card change stashed; today's diff doesn't touch the tab list.

Suspects, unverified: HeroUI/RAC `Tabs.Indicator` measuring before layout settles when `selectedKey` is a non-first tab at mount, possibly interacting with the admin panel's content pushing a layout shift during hydration.

**Done when:** a direct load of `/settings?tab=admin` paints the pill under the Admin tab with all four labels visible.

## Answer

**Dev-only. React Strict Mode double-invocation, in RAC's `SelectionIndicator`. Nothing to fix in
Norish, and it does not reach users.** Diagnosed 2026-08-14, headless Chromium 1440×900, admin
account, measuring the geometry of `[role="tab"]` against `[data-slot="tabs-indicator"]`.

### It is every non-first tab, not the Admin tab

The trigger is the selected tab's *index*, not the admin panel. Direct loads on the dev stack:

| direct load | selected tab | indicator | verdict |
| --- | --- | --- | --- |
| `?tab=user` | x=148 w=286 | x=148 w=286, no translate | correct |
| `?tab=household` | x=434 w=286 | x=148 w=381, `translate: -286px` | wrong |
| `?tab=caldav` | x=720 w=286 | x=148 w=572, `translate: -572px` | wrong |
| `?tab=admin` | x=1006 w=286 | x=148 w=1144, `translate: -858px` | wrong |

The translate is always exactly the offset back to the list's left edge, so the pill always ends up
parked at the origin of the tab strip. `?tab=user` looks fine only because for index 0 that offset
is zero — it takes the same broken path.

### The frame sequence

A rAF recorder on a direct load of `?tab=admin` shows it renders **correctly first**, then breaks:

- t+77ms — indicator x=1006 w=286, no translate. Correct, all four tabs present.
- t+559ms — width jumps to 1144px (the whole strip) and `translate` is set to 0.
- t+572ms→928ms — it *animates* to `translate: -858px` and stays there permanently.

So this is not a mis-measure before layout settles (the first measurement is right). It is a stale
inline style applied after the fact and never removed.

### Mechanism

`Tabs.Indicator` → RAC `SelectionIndicator` → `SharedElement`
(`react-aria-components/dist/private/SharedElementTransition.mjs`). Its layout effect writes the
previous instance's rect/size onto the element as inline `translate` and `width`, then schedules a
`requestAnimationFrame` to strip them back off so CSS transitions the pill into place. The cleanup
does `cancelAnimationFrame(frame)`.

Under Strict Mode the effect is invoked twice (effect → cleanup → effect). The cleanup cancels the
restore rAF, and the second pass reads the *already-overridden* inline values as the "originals" it
will later restore. The override is therefore never removed — the pill transitions **toward** the
snapshot instead of away from it, and sticks. `transitionProperty` on the indicator is
`translate, width, height`, which is exactly the set of properties observed stuck.

### Proof it is Strict Mode, and that production is clean

Two controls, same script, same measurements:

- `reactStrictMode: false` in `apps/web/next.config.js` on the dev stack — **all four tabs correct**
  (`user/household/caldav/admin` each x/w matching their tab, no translate).
- A real production build (`pnpm run build`, booted via `dist-server/index.mjs` on :3100) —
  **all four tabs correct**, indicator flush on the selected tab in every case.

Strict Mode's double-invoke is development-only, so this cannot occur in a shipped build. Both
controls were reverted; no source change was kept for this ticket.

The scroll chevron in the original report was a separate side effect of the panel skeleton's height
during load, not part of this defect — it does not appear once the panel content is mounted, and it
is absent in the production run.

### Where a fix would belong

Upstream in `react-aria-components`: the cleanup should strip the applied override (or re-read the
pre-override values) rather than just cancelling the frame, so a double-invoked effect is idempotent.
Working around it locally would mean either dropping `Tabs.Indicator`'s transition (losing the slide
animation across the whole app) or disabling Strict Mode (losing a real dev signal) — both cost more
than the dev-only artifact does. Recommend leaving it and re-checking on the next HeroUI/RAC bump.

## Comments

- 2026-08-14: Triaged and closed as dev-only after the Strict Mode and production-build controls
  above. Reported symptom reproduced exactly before diagnosis, so the report was accurate — the
  scope was just narrower than "the Admin tab".
