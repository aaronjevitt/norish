# 12 — Share page mobile parity

**What to build:** bring `shared-recipe-page-mobile.tsx` onto the new layout: the shared header and Glance Bar (ticket 02) and the card body Ingredients → Steps → Notes → Cooking Time → Nutrition → Source. A signed-out reader has no favourites, ratings, provenance, actions menu or cooking mode, so none of those appear — and there are no Hidden Items, so everything the recipe stores is shown.

`shared-recipe-page-desktop.tsx` is not touched.

**Blocked by:** 02, 03, 04, 05, 06

**Status:** done

- [x] Share-mobile renders the new header, Glance Bar and card body
- [x] No favourite, rating, provenance, actions menu or cook button appears
- [x] The language selector keeps its place on the photo
- [x] `shared-recipe-page-desktop.tsx` is unchanged
