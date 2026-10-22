# 04: Text-line archives keep their Headings

**What to build:** "For the sauce:" in a Mela or Paprika recipe becomes a Heading instead of an ingredient line that resolves to a food called "for the sauce". The same rule makes a short step paragraph ending in ":" a Heading step. Mela's favourite mark also comes along. See `.scratch/recipe-keeper-import/spec.md`, "Headings" and "Mela and Paprika".

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] In the shared text-line helper (`buildRecipeDTO` in `parser-helpers.ts`), an ingredient line with no amount that ends in ":" is written as a Heading (`# For the sauce`, colon dropped). It gets no alias, since headings are already never resolved.
- [ ] A step paragraph that ends in ":" and is short becomes a Heading step. The length cut-off is a named constant with a `ponytail:` note: it's a naive heuristic, so a long sentence ending in ":" stays a step.
- [ ] Capitals alone never make a Heading.
- [ ] Mela's `favorite` becomes `importedFavorite`.
- [ ] Tests:
  - [ ] Mela and Paprika recipes with a colon heading in the ingredients and in the steps
  - [ ] a line like "SAVOIARDI" stays an ingredient
  - [ ] a favourited Mela recipe is favourited
