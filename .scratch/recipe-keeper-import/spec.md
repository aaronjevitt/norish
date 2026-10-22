# Recipe Keeper import, and foreign archives that keep what they know

Status: ready-for-agent

Settled in a `/grill-with-docs` session on 2026-10-14. The vocabulary is CONTEXT.md's **Recipe Archive**, **Heading** (added that day), **Step Ingredient**, **Ingredient Linking**, **Ingredient**, **Ingredient Alias**, **Cookbook**, **Tag**, **Nutrition Information**, **Supplied Recipe Data**, **Automatic Recipe Enrichment** and **Other Time**. ADR-0022 was amended twice that day: name matches never cross URLs, and cookbook titles travel. Target Version: 0.25.1-beta. Tickets are in `issues/`.

Format facts were read from source, not guessed: Mealie at `mealie-next` 1eced44c, Tandoor at `develop` bb07441b (the 2.6.15 export shape). Recipe Keeper publishes no format, so its facts come from a real 488-recipe export (Italian, March 2026) and five open-source importers.

## Problem Statement

Recipe Keeper users have no way into Norish: its export is a zip of one HTML page and a folder of photos, and the importer does not recognise it.

The formats Norish does read lose what their source knows. Mealie says which ingredients each step uses, where each section starts, which food a line is and who favourited the recipe; Norish drops all of it, and rebuilds every line from the text Mealie first scraped, so a correction made in Mealie afterwards is lost. Tandoor's section headers, ingredient notes and food-less lines vanish, and templated step text arrives as raw `{{ ingredients[0] }}`. Mela's favourite is ignored. No foreign format keeps its section headings.

Two things the archive door promises it does not do. Recipes imported from an archive never get Automatic Recipe Enrichment, though the glossary says every import path does. And two different recipes with the same name in one archive overwrite each other: importing the Recipe Keeper export above would silently lose six recipes.

## Solution

Norish reads a Recipe Keeper export through the same import door as every other archive, keeping everything its HTML carries: courses, categories, collections, source, servings, times, ingredient and step Headings, notes, nutrition, every photo, rating and favourite.

Every foreign format keeps what it knows. Mealie lines are built from the structured quantity, unit, food and note, resolve to the Ingredient Mealie named, and carry Mealie's step references as Step Ingredients; sections and step titles become Headings. Tandoor keeps its header rows, notes and food-less lines, shows templated steps as a Tandoor reader sees them, and reads waiting time as Other Time. Text-line formats (Recipe Keeper, Mela, Paprika) keep their Headings.

A Cookbook comes along only where the source names one: a Recipe Keeper collection, or a cookbook in a Norish Recipe Archive, which now carries each recipe's cookbook titles. The importer gets them as cookbooks of their own.

Every newly inserted archive recipe gets Automatic Recipe Enrichment, and an archive never overwrites its own recipes by name.

## Decisions

### The shared import loop

- **Matching** (ADR-0022, amended): a name match never wins where both recipes carry a URL and the URLs differ, and a recipe the running import has already written (inserted or overwritten) is matched by URL only. Exact copies (same URL) still collapse into one. Applies to every format.
- **Enrichment**: the loop tells its caller which recipes it inserted, and the archive router announces each one as usable, as the URL import worker does. An overwritten match is not announced, the same as for every other import path. The administrator's automatic-enrichment settings decide what runs.
- **Cookbooks**: an import item may name cookbook titles. Once its recipe lands, inserted or overwritten, it is filed into the importer's own cookbook with that title (case-insensitive, trimmed), and a cookbook is made where none exists. Filing only ever adds a membership. A failure to file never fails the import, the same rule as the imported rating and favourite.

### Headings

- A text line with no amount that ends in ":" becomes a Heading (`# Per la base`, colon dropped), in the shared text-line helper that Recipe Keeper, Mela and Paprika use. The same rule applies to a short step paragraph ending in ":".
- A source's own heading markup counts too: a Recipe Keeper line in bold, a Mealie ingredient `title` or step `title`, a Tandoor `is_header` row.
- Capitals alone never make a Heading, because real ingredients are written that way ("SAVOIARDI").
- A Heading is never resolved and never linked, so Step Ingredient orders count it as a line but never point at it.

### Norish Recipe Archives carry cookbook titles

- Each `recipe.json` lists the titles of every cookbook the exporter can see that holds it, under the existing view policy. Covers, and cookbooks holding no exported recipe, stay behind.
- The field is additive within `formatVersion: 1`, so an older importer ignores it. Import reads it through the loop's cookbook filing.

### Recipe Keeper

- **Detection**: a zip whose root, after any single wrapper folder is unwrapped, holds `recipes.html` with `div.recipe-details` blocks carrying `itemprop="recipeId"`. The export is named `RecipeKeeper_YYYYMMDD_HHMMSS.zip` and arrives through the existing `.zip` door.
- **Read by `itemprop` only.** Labels are translated ("Portate", "Porzioni"), and `itemprop` values are not. The markup is not strict HTML (unclosed `<meta>`, unquoted `itemprop=photo0`), so it is read with cheerio, which is already in the workspace.
- **Field map**:

  | Recipe Keeper | Norish |
  | --- | --- |
  | `name` | name |
  | `recipeCourse`: the first one is a `<span itemprop>`, any further ones are `<meta itemprop content>` | a Tag each, plus the meal category the matcher recognises (as Paprika and Tandoor do) |
  | `recipeCategory` (`<meta>` each) | a Tag each, never a meal category |
  | `recipeCollection` (`<meta>` each; markup inferred from categories, since no real export had one) | a Cookbook title each |
  | `recipeSource` | URL, only when it is an http(s) link; plain text such as "Recipe Keeper" is dropped |
  | `recipeYield` ("4 persone", "30 PZ", "2-4 persone") | servings: the first number, the lower end of a range |
  | `prepTime` / `cookTime` (ISO 8601, `PT0S` is unset) | prep / cook; total is prep + cook, the Mealie importer's fallback |
  | `recipeIngredients` `<p>` lines | ingredient lines; bold or "…:" lines become Headings; empty lines dropped |
  | `recipeDirections` `<p>` lines | steps; a leading "1. " is stripped, empty lines dropped, "…:" paragraphs become Heading steps |
  | `recipeNotes` `<p>` lines | notes, joined by newlines |
  | `recipeNutCalories`, `TotalFat`, `TotalCarbohydrate`, `Protein` (per serving, dot decimals) | Nutrition Information. Any one supplied value is authoritative, as for every importer, so a calories-only recipe keeps calories alone |
  | other `recipeNut…` values, `recipeNutServingSize` | dropped |
  | `photo0`…`photoN` (`images/{recipeId}_{N}.jpg`) | the first is the main image, the rest go to the gallery |
  | `recipeRating` (0 = unrated) / `recipeIsFavourite` ("True") | the imported rating (1–5) and favourite |
  | `recipeId`, `recipeShareId` | ignored |

- Content is imported as written, junk included: a recipe whose steps are a scraped "Invia WhatsApp" stays that way.

### Mealie: the admin backup (`database.json`), the group export (`recipes/{slug}/{slug}.json`) and the single-recipe download

Both shapes already feed one mapper, so every change lands once.

- **Lines come from structured fields**: amount from `quantity`, unit from the unit, text from the food name followed by ", note". `original_text` is used only for a line Mealie never structured, meaning no food and no unit. Before Mealie 3.1 an unparsed line was stored as quantity 1 with its whole text in the note, so its quantity is ignored.
- **Lines resolve by Mealie's food**: a line write may name the text its food is resolved from, while the line keeps its own text. Mealie lines pass the food's name, so a known food costs no AI call and no flagged mint. Mealie's food aliases, labels and "on hand" are not imported.
- **Step references** (`recipe_ingredient_ref_link` in the backup, `ingredient_references` in the JSON) become Step Ingredients covering the whole line.
- **Sections**: an ingredient `title` rides on the first ingredient of its section, so it becomes a Heading row inserted before that line. A step `title` becomes a Heading step before that step.
- **Favourite**: favourite if any Mealie user marked it (`users_to_recipes.is_favorite`, backup only), matching how ratings are already averaged.
- **Cuisine**: `recipeCuisine` attaches by name under ADR-0022's rule: unknown names are dropped and reported in the import result.
- **Tools** become Tags. **Notes** (`notes[{title, text}]`) become the recipe's notes.
- **Times**: `*_time_seconds` when present (unreleased Mealie moves times there and blanks the text), else the text as today.
- **Single-recipe download**: the `{slug}.zip` from a recipe's Download button, with its JSON at the zip root, is recognised.
- **Not imported**: Mealie cookbooks (saved filters, not membership lists), substitutions, step `summary`, comments, assets, timeline photos, extras, settings, and nutrition beyond the four values.

### Tandoor

Step Ingredients from the nesting landed in #622. What remains:

- Header rows (`is_header`) become Headings, with their text from `note` (any stale food is ignored), and #622's line orders account for them.
- A line's text is the food name, plural when the amount is not 1 and a plural exists (as Tandoor shows it), followed by ", note". A line with no food uses its note. It resolves by the food's name, as Mealie lines do.
- `no_amount`, or an amount of 0, means no amount.
- Templated step text is shown as a Tandoor reader sees it: `{{ ingredients[i] }}` (indexed within the step, header rows included) renders as "amount unit food", and any leftover braces are stripped.
- Times: prep is working time, total is working + waiting, and cook is empty, so waiting shows as Other Time.
- Books are not in any Tandoor export, so nothing becomes a Cookbook. Nutrition stays mapped as today, since Tandoor never says whether it is per serving or per recipe.

### Mela and Paprika

- Mela's `favorite` becomes the imported favourite. `wantToCook` is dropped.
- Categories in both stay Tags, since they are as much labels as folders. They never become Cookbooks.

## Testing Decisions

- Assert behaviour at the archive seam: an archive in, insert shapes or landed recipes out. Built with in-memory zips beside the existing per-format parser tests in `packages/shared-server/__tests__/archive/`, DB and filesystem mocked as they already are.
- Recipe Keeper fixtures are small hand-written HTML snippets modelled on the real export: translated labels, extra-course `<meta>`, bold and colon Headings, numbered steps with empty paragraphs, calories-only nutrition and a second photo. The real export is never committed.
- Mealie fixtures cover both shapes plus the pre-3.1 quantity-1 row, a hex (dash-less) recipe id, step references and section titles.
- The loop's matching, enrichment hand-off and cookbook filing are pinned beside `archive-import-overwrite.test.ts`.
- The Norish round-trip test gains cookbook titles.
- No new browser E2E: the upload UI does not change and no acceptance criterion depends on browser behaviour.

## Out of Scope

- Mealie cookbooks, Tandoor books, Paprika and Mela categories as Cookbooks (see above).
- Mealie's food catalogue (aliases, labels, on hand) as Ingredient Aliases, Aisles or Pantry: household and instance state stays out of archives (ADR-0022).
- camelCase Mealie JSON (the API shape, not an export people end up with).
- Cookbook covers and empty cookbooks in Norish archives.
- Rewriting imported text: junk stays, prose is never edited beyond Tandoor's template rendering.
