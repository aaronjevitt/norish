# 10 — Dish Colour extraction and backfill

**What to build:** the server side of ADR-0023. Extract one **Dish Colour** from a recipe's primary image with `sharp` (already a `packages/shared-server` dependency) at the moment the image is stored, and keep it in a new column on `recipes`. Every path that can introduce or replace a primary image has to compute it — upload, URL import, archive import, and an edit that replaces the image — because a missed path leaves a recipe tinted for a photo it no longer has. Backfill existing rows.

The colour is derived from the image, not supplied with the recipe, so it is not Supplied Recipe Data and must **not** travel in a Recipe Archive: a receiving instance extracts its own from the image it received. A recipe with no image simply has none, and its page renders in theme colours — the same rendering a reader gets by choosing `theme` in ticket 15. Absence is a defined outcome with a defined look, not a case to guard against.

**Blocked by:** None — can start immediately, independently of the layout work.

**Status:** done

- [x] A migration adds the colour column to `recipes`
- [x] Extraction runs on upload, URL import, archive import, and an image-replacing edit — one test per path
- [x] A backfill populates existing recipes that have a primary image
- [x] A recipe with no image has no Dish Colour, and its page falls back to theme colours
- [x] The colour is absent from Recipe Archive output and ignored on archive import
- [x] Extraction failure never fails the write that carried the image
