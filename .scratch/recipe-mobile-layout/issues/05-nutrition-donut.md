# 05 — Nutrition donut by calorie contribution

**What to build:** give the shared `nutrition-card.tsx` a macro donut. Arcs are calorie contribution — fat ×9, carbs ×4, protein ×4, each as a share of their sum — with the recipe's **stored** calories in the ring's centre and the three macros as the legend beside it. The centre and the arcs may disagree; stored calories win, and a calorie figure computed from macros is never printed as the recipe's own. The existing portion control stays and continues to scale the legend values, not the arcs.

Because the card is shared, this reaches mobile, desktop and the share page. That is deliberate: forking it would leave two macro renderings to keep honest.

**Blocked by:** 03

**Status:** done

- [x] Arcs are calorie contribution, not gram share
- [x] The centre shows stored calories; a recipe with macros and no stored calories shows no calorie figure
- [x] A recipe with calories and no macros renders no ring
- [x] Partial macros render only the arcs that exist
- [x] The portion control still scales the legend values and leaves the arcs alone
- [x] The enrichment-in-flight skeleton and the Hidden Item behaviour are unchanged
- [x] Desktop and the share page pick the donut up with no layout regression
