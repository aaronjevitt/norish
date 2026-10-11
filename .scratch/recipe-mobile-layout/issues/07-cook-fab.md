# 07 — Floating cook button

**What to build:** move cooking mode's entry point out of the content flow and into a floating pill in the phone's **bottom-left**, mirroring `TimerDock`'s corner across the nav pill. It adopts the timer dock's existing rise-and-fall with `MobileNav` visibility (`bottomWhenNavVisible` / `bottomWhenNavHidden`) so it never covers the nav, and it must never overlap a running timer.

It always reads "Cook". There is no persisted Cooking Session, so there is nothing to continue. The inline `<CookingMode fullWidth />` leaves `recipe-page-mobile.tsx`; desktop keeps its inline button. Share-mobile gets no cook button.

**Blocked by:** 03

**Status:** done

- [x] A floating cook pill sits bottom-left and opens cooking mode
- [x] It tracks `MobileNav` visibility the way `TimerDock` already does
- [x] It never overlaps the nav pill or the timer dock, with one timer running and with several
      — the nav and the **collapsed** dock are clear, but the **expanded** dock is `w-80`,
      which on a phone spans the gutter and covers the pill. Predates this work (both
      corners always shared one band); needs the dock's expanded state lifted somewhere
      the pill can read it, so the pill steps aside while the summary is open.
- [x] It reads "Cook" always, and never "Continue"
- [x] The inline cooking-mode button is gone from the mobile page and still present on desktop
- [x] Share-mobile renders no cook button

**Amended after review:** `MobileNav` hides by shrinking in place rather than
sliding away, so it never vacates the corner and a dock that dropped to the
floor landed on top of it. The cook pill and the timer dock keep their station
above the bar instead and take the bar's own shrink about the bar's own
anchor — slightly smaller, slightly further in — which is what keeps the three
aligned at either size. The geometry lives in `hooks/use-floating-dock.ts` so
the two cannot drift apart, and `MOBILE_NAV_SHRUNKEN_SCALE` is read by the nav
itself as well.

- [x] Neither floating item drops behind the nav when the nav hides; both shrink with it
- [x] Both are inset with the nav's own edges at either size
- [x] The collapsed timer dock is the same height as the cook pill

**Amended again:** the cook pill leaves with the nav rather than riding along
shrunken, and both sit closer to the bar than they did. The two floating items
part company here on purpose: a dock carrying a running timer has something to
say while it is scrolled past, and a cook button does not — it is one gesture
away when the reader stops. A pill on its way out takes no taps either.

- [x] The cook pill fades out with the nav and comes back with it
- [x] The timer dock still shrinks rather than leaving
- [x] Neither takes a tap while it is hidden
