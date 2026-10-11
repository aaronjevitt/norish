import { z } from "zod";

/**
 * Step Ingredient links as the model returns them.
 *
 * Steps and ingredient lines are referred to strictly by the numbers the
 * prompt printed beside them, so the inferrer can map the claim back onto
 * rows without the model ever seeing an id.
 *
 * A step's links are what that step brings into the dish, not what the dish
 * contains by the time it runs: a step working on "the mixture" an earlier
 * step assembled links nothing, so the ingredient lands on the step a cook
 * actually reaches for it.
 *
 * How much of a line a step uses arrives as one of two statements: a share
 * (proportional language — "half the water") or an amount (the step's own
 * number — 3 of the 5 eggs). The stored form is always a share; the inferrer
 * does the division, so the model never computes a fraction from an amount.
 */
export const ingredientLinkingSchema = z
  .object({
    links: z
      .array(
        z
          .object({
            step: z.number().int().describe("The step's number exactly as shown in STEPS."),
            ingredients: z
              .array(
                z
                  .object({
                    line: z
                      .number()
                      .int()
                      .describe("The ingredient line's number exactly as shown in INGREDIENTS."),
                    share: z
                      .number()
                      .positive()
                      .max(1)
                      .nullable()
                      .describe(
                        "Fraction of the line this step uses. 1 is the whole line; half the water is 0.5. Null when amount is given."
                      ),
                    amount: z
                      .number()
                      .positive()
                      .nullable()
                      .describe(
                        "The quantity this step states, in the line's own unit — 3 when it cracks 3 of the 5 eggs. Null when share is given."
                      ),
                  })
                  .strict()
              )
              .describe(
                "Every ingredient line this step brings into the dish itself — never the lines already inside a mixture an earlier step made."
              ),
          })
          .strict()
      )
      .describe(
        "One entry per step that brings in ingredient lines. Steps that only carry on with what earlier steps assembled are omitted."
      ),
  })
  .strict();

export type ProposedIngredientLinks = z.infer<typeof ingredientLinkingSchema>;
