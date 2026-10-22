# 08: Docs, release notes and copy

**What to build:** People can find out that Recipe Keeper imports, and what came along from each format. Follow `docs/agents/feature-docs.md`, and keep docs pages to what it does and how to use it.

**Blocked by:** 01, 02, 03, 04, 05, 06, 07

**Status:** ready-for-agent

- [ ] `apps/docs/docs/recipes/recipe-archive.md`:
  - [ ] Recipe Keeper is named among the formats, with where its export lives (`RecipeKeeper_….zip`)
  - [ ] one line saying collections and Norish cookbooks arrive as Cookbooks
  - [ ] a screenshot only if the page already has one for the import door
- [ ] `apps/docs/docs/release-notes/0.25.1-beta.md`:
  - [ ] the Summary no longer calls the release "small"
  - [ ] a `### Recipe Keeper import` feature
  - [ ] Fixes bullets for archives keeping Headings, Mealie and Tandoor detail, Mela favourites, enrichment for archive imports, and same-named recipes no longer overwriting each other
- [ ] The "Expected …" format strings in the archive router and parser, and any UI copy listing formats, name Recipe Keeper. All locales pass `pnpm i18n:check`.
