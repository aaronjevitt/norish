# 02 — Mobile recipe header with the Glance Bar

**What to build:** a new header component for the phone, consumed by `recipe-page-mobile.tsx` and `shared-recipe-page-mobile.tsx`, rendering on the page background rather than inside a card: category chips, then the origin flag and title, then the author chip, then the description, then the **Glance Bar**, then the tags. The Glance Bar is total time · servings · calories — it restates facts the sections below own and holds none of its own. `ReadonlyRecipeSummary` is not touched, so `recipe-page-desktop.tsx` and `shared-recipe-page-desktop.tsx` keep rendering exactly as they do today.

Hero chrome moves onto the photo as opaque circular buttons — back top-left, favourite and `⋯` top-right — drawn as chrome surface plus border and shadow, never translucent (ADR-0020). The author chip comes off the photo. The "back to recipes" text row and the source icon glued to the title are both deleted; the source gets its own card in ticket 06.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] The mobile header renders on the page background in the order: categories, flag + title, author, description, Glance Bar, tags
- [x] Tags keep allergen-first sorting and the warning fill
- [x] The Glance Bar shows total time, servings and calories, and omits any entry the recipe does not store
- [x] Hiding Nutrition Information removes the calories entry; a recipe storing none of the three renders no bar at all
- [x] Back, favourite and `⋯` float on the photo as opaque buttons with no `backdrop-blur` or see-through fill
- [x] The author chip renders under the title, not on the photo
- [x] The "back to recipes" row and the title's external-link icon are gone
- [x] `ReadonlyRecipeSummary` is byte-for-byte unchanged and both desktop surfaces render as before
- [x] Share-mobile renders the same header, with no favourite and no actions menu

**Amended after review:** the Glance Bar is one filled bar floating on the page
background rather than an outlined box — the cards below already carry the
page's edges, and a second kind of edge around three numbers read as a form
field. Each entry is its icon and its value on one line, the way the library's
own recipe cards already state time and servings; the written label stays as
screen-reader text so nothing is lost by ear.

- [x] The Glance Bar draws no border, and each entry is icon + value on one line
- [x] Each entry keeps its written label for a screen reader

**Amended again after review:** the header is centred under a photo that fades
into the page rather than stopping at a hard edge, so the title reads as
continuing the picture instead of sitting on a lid dropped over it. Categories
leave the top of the header and join the tags on one quiet filing line below
the Glance Bar — a dozen chips under the title compete with the title, and none
of them is what the reader came for. Allergen tags are the exception and keep
their fill and their place at the front of that line. The author leaves the
header entirely for the Source card: where a recipe came from and who brought
it in are the same question asked twice.

- [x] The photo dissolves into the page background; the title sits in the tail of that fade
- [x] Title and description are centred
- [x] Categories and tags render as one line, allergens first and still marked
- [x] The header names no author

**Amended a third time:** a long imported description ran to a dozen centred
lines and pushed the ingredients off the screen. It gets four and a control to
ask for the rest; a description that already fits is drawn plain, with nothing
offered for something there is no more of.

- [x] The description clamps to four lines with a show-more control
- [x] A description that already fits draws no control
