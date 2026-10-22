# 01: An archive never overwrites a different recipe by name

**What to build:** Two different recipes that share a name both land. Import an archive holding "Pollo al curry" from site A and "Pollo al curry" with no URL: both are in the library afterwards. An exact copy (same URL twice) still collapses into one. See `.scratch/recipe-keeper-import/spec.md`, "The shared import loop", and ADR-0022's 2026-10-14 matching amendment.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `findExistingRecipe` says how it matched, by URL or by name. Its only caller is the archive loop.
- [ ] A name match is refused when both recipes carry a URL and the URLs differ. This holds against existing recipes too.
- [ ] The loop remembers the recipes this run wrote (inserted or overwritten), and matches one of them by URL only.
- [ ] Tests beside `archive-import-overwrite.test.ts`:
  - [ ] same name, different URLs: two recipes
  - [ ] same name, one or both without a URL, written earlier in the same run: two recipes
  - [ ] same URL twice in one run: one recipe, overwritten
  - [ ] a same-named existing recipe with no URL is still overwritten, as before
