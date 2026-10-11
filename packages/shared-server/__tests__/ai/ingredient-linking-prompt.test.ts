// @vitest-environment node
/**
 * The shipped Ingredient Linking prompt.
 *
 * Asserted against the shipped prompt file rather than a mock, because the
 * file is what a deployment actually sends to the model. Admin overrides
 * replace it wholesale and are deliberately untouched by these expectations.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { resolveExistingWorkspacePath } from "@norish/shared-server/lib/workspace-paths";

const LINKING_PROMPT = readFileSync(
  join(
    resolveExistingWorkspacePath(join("packages", "shared-server", "src", "ai", "prompts")),
    "ingredient-linking.txt"
  ),
  "utf-8"
);

describe("the shipped Ingredient Linking prompt", () => {
  it("binds aggregate phrases to every matching line", () => {
    expect(LINKING_PROMPT).toMatch(/"Add the spices" means every spice\s+line/i);
  });

  it("asks what a step brings in rather than what it has to hand", () => {
    expect(LINKING_PROMPT).toMatch(/which ingredient lines the step brings into the dish/i);
    expect(LINKING_PROMPT).toMatch(/put that ingredient to work for\s+the first time/i);
  });

  it("keeps back-references to earlier work from opening up into lines", () => {
    // The over-linking this prompt exists to prevent: a follow-up step that
    // says "the mixture" listing everything the mixture was made of.
    expect(LINKING_PROMPT).toMatch(/read the steps in order/i);
    expect(LINKING_PROMPT).toMatch(/"the mixture", "the batter", "the dough"/i);
    expect(LINKING_PROMPT).toMatch(/never open such a phrase up\s+into the lines behind it/i);
  });

  it("works both back-reference shapes through as examples", () => {
    expect(LINKING_PROMPT).toMatch(/"Blend until homogeneous".+brings in nothing at all/is);
    expect(LINKING_PROMPT).toMatch(/knead in the mince.+brings in the mince, the salt and the/is);
  });

  it("still links an ingredient a later step reaches for again", () => {
    expect(LINKING_PROMPT).toMatch(/"the\s+remaining butter", "the rest of the stock"/i);
  });

  it("teaches fractional shares with the half-the-water example", () => {
    expect(LINKING_PROMPT).toMatch(/"Half the water" is 0\.5/);
    expect(LINKING_PROMPT).toMatch(/the share is 1/i);
  });

  it("teaches stated amounts and keeps the division out of the model", () => {
    expect(LINKING_PROMPT).toMatch(/"crack 3 of the eggs"/i);
    expect(LINKING_PROMPT).toMatch(/give that number as\s+amount and set share to null/i);
    expect(LINKING_PROMPT).toMatch(/never do\s+the division yourself/i);
    expect(LINKING_PROMPT).toMatch(/never state more than the line holds/i);
  });

  it("lets steps that use nothing stay bare", () => {
    expect(LINKING_PROMPT).toMatch(/Omit steps that use nothing new/i);
    expect(LINKING_PROMPT).toMatch(/only carries on with what is already in the dish/i);
  });

  it("forbids invented numbers and heading links", () => {
    expect(LINKING_PROMPT).toMatch(/strictly by the numbers shown above/i);
    expect(LINKING_PROMPT).toMatch(/never link a section heading/i);
  });

  it("prefers unlinked over guessed", () => {
    expect(LINKING_PROMPT).toMatch(/leave that phrase unlinked rather than guessing/i);
  });

  it("keeps every template variable the loader fills", () => {
    for (const variable of ["recipeName", "ingredients", "steps"]) {
      expect(LINKING_PROMPT).toContain(`{{${variable}}}`);
    }
  });
});
