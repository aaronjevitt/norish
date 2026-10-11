# 08 — Cooking mode: compact header and paged steps with faded peeks

**What to build:** restyle cooking mode's mobile presentation without touching its interaction model. The header becomes recipe thumbnail, truncated title, a quiet `categories · total time` subtitle, and the close button; the Steps/Ingredients tab bar is removed, since the horizontal swipe and the new bottom-bar button both reach the ingredients.

Steps stay **paged** — one per screen — with the previous and next step peeking above and below, faded, clamped to two truncated lines each. When the current step still does not fit, the peeks collapse entirely and the step scrolls inside its own page, with the swipe still working from the top and bottom edges. Both existing gestures in `cooking-mode.tsx` are preserved unchanged: vertical pages, horizontal switches to ingredients.

Step Ingredients stay a chip row below the prose — the glossary settles it, and a fractional share has no word in the sentence to decorate — restyled to match the new chips. Timer chips stay inline, because a timer really is a phrase in the text.

**Blocked by:** None — can start alongside the page work.

**Status:** done

- [x] The header is thumbnail, title, `categories · total time`, close — with no tab bar
- [x] The ingredients view is reachable by horizontal swipe and by the bottom-bar button, which flips its icon while ingredients are showing
- [x] Neighbouring steps peek faded, clamped to two truncated lines
- [x] A long step collapses the peeks and scrolls within its page; the vertical swipe still changes step from the edges
- [x] Vertical and horizontal swipes behave exactly as they did before
- [x] Step Ingredients render as a chip row below the prose; timer chips remain inline
- [x] Cooking mode still takes the wake lock on open and releases it on close

**Amended after review:** the step a cook is on sits in the middle of the
screen. Both edges reserve a peek whether or not there is a neighbour to put in
it — an edge that collapsed for want of a neighbour shoved the first and last
steps up and down the screen while the ones between them sat still. The peeks
are the step's own type size faded almost out rather than a small grey caption,
which read as a footnote about the step rather than as the step either side of
it. The accent step-number badge is gone: the bottom bar counts the steps, and
a badge above the prose pulled the eye off the one thing the screen is for.

- [x] The step is vertically centred on every page, first and last included
- [x] Peeks render at the step's own type size, faded
- [x] No step-number badge is drawn in the step view
