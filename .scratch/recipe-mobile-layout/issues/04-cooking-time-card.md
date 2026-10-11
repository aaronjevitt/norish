# 04 — Cooking Time card with the Other Time remainder

**What to build:** a mobile-and-share card that draws a recipe's time as a segmented bar. Reconciliation, as a pure function tested on its own: the headline is the stored `totalMinutes`, with `prepMinutes` and `cookMinutes` drawn to scale inside it; any shortfall becomes a third neutral **Other Time** segment rather than the total being quietly redrawn to fit. When prep + cook exceed the total, the split wins and the headline becomes their sum — a specific split beats a rounded total. With a total and no split, the bar is one filled segment. With no times at all, the card does not render.

The three columns are independent in the schema and nothing derives or validates them, so all of these cases are real data, not hypotheticals. **No Ready At on this card** — that claim belongs to a Cooking Session and lives in cooking mode only (ticket 09).

**Blocked by:** 03

**Status:** done

- [x] A pure reconciliation function covers: agreeing split, short split (Other Time appears), overflowing split (headline flips to the sum), total-only, split-only, and no times at all
- [x] Other Time is labelled for what it is not, and never named as resting or proving
- [x] The card renders on mobile and on share-mobile, and does not render on desktop
- [x] The card is absent when the recipe stores no times
- [x] Nothing on this card projects a finish time
- [x] New strings are added across every supported locale and `pnpm i18n:check` passes

**Amended after review:** preparation and cooking take two hues rather than the
accent at two opacities — one bar in two strengths of the same colour reads as
more and less of one thing, not as two different jobs. They are their own theme
tokens (`--cooking-prep`, `--cooking-cook`) rather than borrowed nutrition ones,
so the two charts can move independently. Other Time stays neutral, because
nothing knows which of the two it is.

- [x] Prep and cook draw in separate hues, in both themes
- [x] Other Time is still neutral
- [x] The colours are their own tokens, not the accent and not the nutrition palette
