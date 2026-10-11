# 11 — Ambient page tint from the Dish Colour

**What to build:** the client side of ADR-0023. Derive theme variables from the stored Dish Colour and scope them to the recipe page container so the page background and card surfaces take the recipe's hue, while borders, text and the accent do not move.

**Hue and a clamped saturation come from the colour; lightness always comes from the reader's theme.** That is the whole safety argument: a recipe decides what colour its page is and never decides how readable it is, in light or in dark. A recipe with no Dish Colour falls back to theme colours. That is the same rendering a reader gets by choosing `theme` in ticket 15, so **both must resolve through one code path, not two branches that happen to agree** — two of them will drift, and the drift shows up as a recipe that looks subtly wrong only when it has no photo. Build the untinted rendering once; a Dish Colour and a willing reader are the two conditions that switch away from it.

The tint reaches mobile, desktop and the share page. It reaches nothing outside a recipe page.

**Blocked by:** 10

**Status:** done

- [x] A pure derivation function takes a Dish Colour and a theme and returns the scoped variables; hue is preserved, saturation is clamped, lightness comes from the theme
- [x] Contrast between text and every tinted surface is unchanged from the untinted tokens, in both themes
- [x] Page background and card surfaces shift together; borders, text and the accent do not
- [x] A recipe with no Dish Colour falls back to theme colours, with no layout shift
- [x] The no-colour rendering and ticket 15's `theme` rendering come from the same code path, and a test asserts they are identical
- [x] The tint is present before the hero image has loaded, and while Offline
- [x] The tint applies on mobile, desktop and share, and nowhere else in the app
- [x] No `backdrop-blur` or see-through fill is introduced (ADR-0020)
