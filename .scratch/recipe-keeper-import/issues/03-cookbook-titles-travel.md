# 03: Cookbook titles travel in archives

**What to build:** A recipe in a cookbook comes out of a Norish Recipe Archive still saying so. Export a library where "Tiramisù" sits in "Dolci" and "Kerst", import the archive on another instance, and "Tiramisù" lands in the importer's own "Dolci" and "Kerst" cookbooks. Those are the existing ones with those titles, or new ones. This also builds the loop's filing, which Recipe Keeper collections use in 05. See `.scratch/recipe-keeper-import/spec.md`, "The shared import loop" and "Norish Recipe Archives carry cookbook titles", and ADR-0022's cookbook amendment.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `RecipeImportItem` gains optional cookbook titles.
- [ ] Once the recipe lands, inserted or overwritten, the loop files it into each title:
  - [ ] the importer's own cookbook whose title matches case-insensitively and trimmed, or a new one made with the title as written
  - [ ] titles cached per run, so a 200-recipe collection costs one lookup
  - [ ] filing only adds a membership, and a membership that already exists is not an error
  - [ ] a failure to file is logged and never fails the import, like the imported rating
  - [ ] nothing is filed without an importing user
- [ ] The Norish writer adds `cookbooks: string[]` to each `recipe.json`: the titles of every cookbook the exporter can see that holds the recipe, under the same viewer context the export already uses.
- [ ] `NorishArchiveRecipeSchema` accepts `cookbooks`, defaulting to empty, with `formatVersion` unchanged. The Norish parser yields the titles.
- [ ] Tests:
  - [ ] the writer emits titles, and omits a cookbook the exporter cannot see
  - [ ] the round-trip test carries titles
  - [ ] the loop reuses a same-title cookbook regardless of case, makes a missing one, and adds no duplicate membership on re-import
