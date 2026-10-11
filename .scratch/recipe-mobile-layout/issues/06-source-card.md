# 06 — Source card

**What to build:** a card showing where a recipe came from — its URL's host, as a link out — on mobile and share-mobile. It replaces the external-link icon that used to sit beside the title (removed in ticket 02). A recipe with no URL renders no card.

**Blocked by:** 02, 03

**Status:** done

- [x] The card shows the source host and opens the original in a new tab with `rel="noopener noreferrer"`
- [x] A recipe with no URL renders no card
- [x] The title carries no source icon
- [x] The card renders on share-mobile
- [x] New strings are added across every supported locale and `pnpm i18n:check` passes

**Amended after review:** the card also names who imported the recipe. It used
to sit under the title on the phone, where it competed with the dish for the
top of the page; where the recipe came from and who brought it in are the same
question, so they answer it together. The card renders for either on its own.

- [x] The Source card names the importer beside the source URL
- [x] A recipe with an importer but no URL still renders the card

**Amended after review:** the importer is a row in the same shape as the source
link above it, not a bordered chip. The card is already the object here, and a
chip inside it is a second edge saying nothing the row does not.

**Amended again:** the two facts are one divided list rather than two floating
lines — a leading mark, the name, and, where the row goes somewhere, a hint
that it does. Left free-floating they read as two unrelated scraps in a mostly
empty card. Same divided-row treatment the Nutrition legend uses.

- [x] Source and importer render as one list with aligned leading marks
- [x] The source row carries an external-link hint at its end
