# 13 — Browser E2E for the phone layout

**What to build:** one spec in the existing `ai` project under `apps/web/__tests__/e2e/`, per the definition-of-done rule that browser-dependent acceptance needs E2E coverage. On a phone viewport: open a recipe and assert the Glance Bar's contents and the card order; scroll to the bottom and assert the cook pill is still reachable and overlaps neither the nav pill nor a running timer; open cooking mode and assert the paged steps, both swipe directions, the back chevron, and that Ready At appears there and nowhere on the recipe page. Also assert that hiding Nutrition Information removes both the card and the Glance Bar's calories entry — the bar restating a hidden fact is the bug this layout is most likely to introduce.

The tint opt-out is **not** covered here: ticket 15 owns it, and two of its three no-flash paths (offline bootstrap, and a navigation answered from the service worker's HTML cache) belong to the `offline` E2E project rather than `ai`. Do not reproduce them in this spec.

**Blocked by:** 03, 04, 05, 06, 07, 08, 09, 11

**Status:** done

- [x] The spec runs in the existing `ai` project with its fixtures, adding no new harness
- [x] Glance Bar contents and card order are asserted on a phone viewport
- [x] The cook pill is reachable at full scroll and overlaps neither the nav nor the timer dock
- [x] Paged steps, both swipes and the back chevron are exercised
- [x] Ready At is asserted present in cooking mode and absent from the recipe page
- [x] Hiding Nutrition Information removes the card and the Glance Bar's calories together
