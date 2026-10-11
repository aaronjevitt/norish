import { z } from "zod";

import { aiLogger } from "@norish/shared-server/logger";

import { AIResponseError } from "../runtime/errors";
import { generateStructured } from "../runtime/runtime";

const imageBriefSchema = z
  .object({
    brief: z
      .string()
      .describe("One short paragraph, in English, describing what the finished dish looks like."),
  })
  .strict();

/**
 * Turn a stored recipe into a short visual brief for the image model
 * (ADR-0024): an image model is prompted rather than reasoned with, so the
 * cheap text call in front of it is the difference between a picture of a
 * dish and a picture of a shopping list.
 *
 * The brief is written in English whatever language the recipe is in. It is
 * an instruction to a model — never stored, never shown.
 */
export async function writeVisualBrief(recipe: {
  title: string;
  description: string | null;
  ingredients: string[];
}): Promise<string> {
  aiLogger.info(
    { title: recipe.title, ingredientCount: recipe.ingredients.length },
    "Writing visual brief"
  );

  const output = await generateStructured({
    prompt: "image-generation-brief",
    schema: imageBriefSchema,
    sections: [
      [
        `Recipe: ${recipe.title}`,
        ...(recipe.description ? [recipe.description] : []),
        "Ingredients:",
        ...recipe.ingredients.map((ingredient) => `- ${ingredient}`),
      ].join("\n"),
    ],
  });

  const brief = output.brief.trim();

  if (brief === "") {
    // An empty brief would hand the image model nothing but the style
    // prompt; fail retryably instead of drawing a generic plate.
    throw new AIResponseError("The model returned an empty visual brief.");
  }

  aiLogger.info({ title: recipe.title, briefLength: brief.length }, "Visual brief written");

  return brief;
}
