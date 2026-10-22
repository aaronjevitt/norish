# 02: Archive recipes get Automatic Recipe Enrichment

**What to build:** A recipe that arrives in an archive is enrolled for Automatic Recipe Enrichment like one from any other import path, as CONTEXT.md already promises. Import a Recipe Keeper or Mealie archive with automatic enrichment on, and its new recipes get tags, categories, provenance, Step Ingredients through Ingredient Linking, and a Generated Image where they have no photo, as the administrator's settings allow. A recipe that overwrote a match is not enrolled again. See `.scratch/recipe-keeper-import/spec.md`, "The shared import loop".

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The loop reports which recipes it inserted, as distinct from the ones it overwrote. Today neither `onProgress` nor `ImportResult` tells them apart.
- [ ] The archive router (`packages/trpc/src/routers/archive/archive.ts`) calls `announceUsableRecipe` for each inserted recipe, with the same context the URL import worker passes. `shared-server` cannot import `@norish/queue`, so the announcement lives in the router.
- [ ] A failed announcement never fails the import. `announceUsableRecipe` already guarantees this.
- [ ] Test: inserted recipes are announced, and overwritten ones are not.
