# 05: Recipe Keeper exports import

**What to build:** Drop a `RecipeKeeper_YYYYMMDD_HHMMSS.zip` into the archive import and every recipe lands with all it carries. Your courses and categories become Tags, and a course the meal-category matcher recognises also becomes that category. Collections become Cookbooks. Source, servings, times, Headings, notes, nutrition, every photo, rating and favourite come along too. The field map is in `.scratch/recipe-keeper-import/spec.md`, "Recipe Keeper".

**Blocked by:** 03, 04

**Status:** ready-for-agent

- [ ] `ArchiveFormat.RECIPE_KEEPER`, detected after unwrapping:
  - [ ] `recipes.html` at the root holding `itemprop="recipeId"`
  - [ ] the count is the number of `div.recipe-details` blocks
  - [ ] the "unknown format" messages name Recipe Keeper
- [ ] Parsed with cheerio, which moves into `@norish/shared-server`'s dependencies from the version already in the workspace, by `itemprop` only. No translated label is ever read.
- [ ] Every row of the spec's field map, including:
  - [ ] the first course from the `<span itemprop>` and further courses from `<meta>`
  - [ ] categories and collections from `<meta>`
  - [ ] only http(s) sources become the URL
  - [ ] servings from the first number in the yield
  - [ ] ISO 8601 times, with `PT0S` meaning unset
  - [ ] bold or colon ingredient lines become Headings
  - [ ] the leading "1. " is stripped from steps, and empty paragraphs are dropped
  - [ ] the first photo is the main image and the rest go to the gallery
  - [ ] the four nutrition values, per serving
  - [ ] rating 1–5 when above 0, and favourite when "True"
- [ ] Photos are read from `images/` inside the zip and stored through the existing archive media path.
- [ ] Tests use hand-written snippets modelled on the real export, which is never committed:
  - [ ] translated labels
  - [ ] a second course in a `<meta>`
  - [ ] two categories and a collection
  - [ ] a bold Heading and a colon Heading
  - [ ] numbered steps with empty paragraphs
  - [ ] calories-only nutrition
  - [ ] two photos
  - [ ] a plain-text source
  - [ ] a recipe without ingredients
- [ ] Manual check: the real 488-recipe export imports with no parse errors and with 6 more recipes than it would have before 01.
