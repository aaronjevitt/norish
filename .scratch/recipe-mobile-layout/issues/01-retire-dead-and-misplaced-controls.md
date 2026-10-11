# 01 — Retire the orphaned calendar button and move two controls into the actions menu

**What to build:** the preparatory tidy the new Ingredients card depends on. `apps/web/app/(app)/recipes/[id]/components/add-to-calendar-button.tsx` has no importers anywhere in the repo — delete it. Then move `SystemConvertMenu` and `AmountDisplayToggle` out of the mobile Ingredients heading row and into the recipe `⋯` actions menu: convert-measurements is a permission-gated action that starts an AI conversion (and is already a Hidden Item via `showConversion`), so it belongs with the other per-recipe actions; fractions-versus-decimals is an app-wide display preference with no per-recipe meaning. Desktop keeps both controls where they are — its Ingredients card has the room.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] `add-to-calendar-button.tsx` is deleted and nothing references it
- [x] `SystemConvertMenu` appears in the recipe actions menu, retaining its permission gate and its `showConversion` Hidden Item behaviour
- [x] `AmountDisplayToggle` appears in the recipe actions menu and still drives the app-wide amount display preference
- [x] Neither control renders in the mobile Ingredients heading row any more
- [x] `recipe-page-desktop.tsx` is unchanged
- [x] New menu strings are added across every supported locale and `pnpm i18n:check` passes

**Amended after review:** the two controls did not stay in the `⋯` menu. They
act on the ingredient list, so they are reached from it — a reader looking at
"1½ cups" and wanting "1.5" looks at the list, not at the page. Both fold into
one options menu on the Ingredients card header, and the page menu keeps only
the actions that act on the recipe.

- [x] The Ingredients card header carries an options menu with the amount display and the conversions
- [x] Neither control remains in the `⋯` menu
- [x] Conversion keeps its Hidden Item gate and its AI marking wherever it is drawn
