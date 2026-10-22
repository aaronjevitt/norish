# 21 — parse-ingredient 3

Status: ready-for-agent
Blocked by: None — can start immediately
Target release: 0.26.0-beta

Spec: `.scratch/dependency-upgrades/spec.md`

## What to build

Move `parse-ingredient` from 2.2.0 to **3.0.0** (packages/shared, `src/lib/helpers.ts`).

**What 3.0 changes:**

- **Removed deprecated exports:** `identifyUnit`, `fors*` and `rangeSeparator*`. Norish uses none of them.
- **Behaviour changes that can alter what Norish stores for an ingredient line:**
  - a leading `-` is now part of the description, which matters for bulleted ingredient lists;
  - quantities are never negative or `NaN`;
  - `meta.sourceIndex` now counts blank lines;
  - unit definitions are readonly.

**How:** tests first, then the bump.

1. Write regression tests against 2.2.0:
   - bulleted lines (`- 2 cups flour`, `• 1 tbsp oil`);
   - ranges (`2-3 cloves`);
   - negative-looking input;
   - input with blank lines between ingredients.
2. Bump to 3.0.0.
3. Adapt `helpers.ts` so the tests still produce the same ingredients — for example, strip a leading bullet before parsing.

**Later:** 3.0's `extractMeasurements()` could drive unit conversion inside step text.

## Acceptance criteria

- [ ] **Regression tests.** They pass, with identical outputs before and after, or with deliberate differences listed in the comments.
- [ ] **Imports.** URL imports, paste imports and grocery additions of bulleted lists produce the same ingredients as before.
- [ ] **E2E and gates.** The ingredient-related E2E tests and the repo gates pass.

## Comments

- Filed 2026-10-12 with the spec.
- Source: the parse-ingredient 2.2.0 and 3.0.0 tarballs.
