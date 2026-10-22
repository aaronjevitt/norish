# 07: Tandoor imports keep what Tandoor knows

**What to build:** A Tandoor recipe keeps everything a Tandoor reader sees:
- section headers become Headings
- notes stay on their lines, and note-only lines survive
- "no amount" means no amount
- templated steps read as text
- waiting time shows as Other Time

#622 already links each ingredient to its step. See `.scratch/recipe-keeper-import/spec.md`, "Tandoor".

**Blocked by:** 06 (for the resolve-from text on the line write)

**Status:** ready-for-agent

- [ ] An `is_header` row becomes a Heading from its `note`. Any food on it is ignored, an empty note is skipped, and it is never part of a step's links. #622's line orders count it.
- [ ] A line's text is the food name followed by ", note". The food name is plural when the amount is not 1 and `plural_name` exists. A line with no food uses its note, and is dropped only when both are empty. The line resolves from the food's name.
- [ ] `no_amount`, or an amount of 0, gives no amount and no unit.
- [ ] `{{ ingredients[i] }}`, with `i` indexed within the step and header rows included, renders as "amount unit food". `.amount`, `.unit`, `.food` and `.note` render as that field. Leftover `{` and `}` are stripped.
- [ ] Ingredients are walked in the same `order` the steps are sorted by.
- [ ] Prep is `working_time`, total is `working_time + waiting_time`, and cook is empty.
- [ ] Tests:
  - [ ] a header row carrying a stale food
  - [ ] a note-only line
  - [ ] a line with `no_amount`
  - [ ] a templated step, including a header-row index
  - [ ] a plural food
  - [ ] the time mapping
  - [ ] #622's links still point at the right lines after a Heading is inserted
