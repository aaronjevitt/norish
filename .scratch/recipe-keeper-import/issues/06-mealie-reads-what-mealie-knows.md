# 06: Mealie imports keep what Mealie knows

**What to build:** A Mealie recipe arrives as Mealie shows it, from the admin backup, the group export or a single recipe's Download zip:
- lines are built from the quantity, unit, food and note it holds now, not the text it first scraped
- each line points at the Ingredient Mealie named
- steps keep their ingredient references as Step Ingredients, and sections keep their Headings
- the favourite, cuisine, tools, notes and times come along

See `.scratch/recipe-keeper-import/spec.md`, "Mealie".

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Lines come from the structured fields:
  - [ ] amount from `quantity`, the unit as today, text "food, note"
  - [ ] `original_text` only for a line with no food and no unit, and the quantity of such a line is ignored (the pre-3.1 quantity-1 rows)
- [ ] The line write accepts an optional text to resolve the food from. `withResolvedIngredients` uses it in place of `lineFoodText`, and the line keeps its own text. Mealie passes the food's name.
- [ ] Step references become Step Ingredients covering the whole line, with orders counting inserted Heading rows:
  - [ ] in the backup, `recipe_ingredient_ref_link` (`instruction_id`, `reference_id`) joined to the ingredients' `reference_id`
  - [ ] in the JSON shapes, `ingredient_references`
- [ ] An ingredient `title` becomes a Heading row before its line. A step `title` becomes a Heading step before its step.
- [ ] Favourite when any `users_to_recipes.is_favorite` is set.
- [ ] `recipeCuisine` attaches by case-insensitive name against the vocabulary. An unknown name is dropped with an import note, reusing the Norish parser's cuisine handling.
- [ ] Tools (`tools`, `recipes_to_tools` in the backup) become Tags.
- [ ] `notes` become the recipe's notes, as "title" then "text" per note.
- [ ] `prep_time_seconds`, `perform_time_seconds` and `total_time_seconds` are used when present, falling back to the text.
- [ ] The single-recipe Download zip (`{slug}.json` and `original.webp` at the zip root) is detected and read through the group export's path.
- [ ] Tests cover both shapes:
  - [ ] a structured line whose `original_text` differs (the structured fields win)
  - [ ] a pre-3.1 quantity-1 text row
  - [ ] a section title on a referenced line, with orders correct after the inserted Heading
  - [ ] step references
  - [ ] favourite, cuisine (known and unknown), tools, notes, and seconds-based times
  - [ ] a Download zip
