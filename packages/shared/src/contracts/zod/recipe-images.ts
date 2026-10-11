import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { recipeImages } from "@norish/db-schema/schema";

export const RecipeImageSelectSchema = createSelectSchema(recipeImages);
export const RecipeImageInsertSchema = createInsertSchema(recipeImages).omit({
  id: true,
  createdAt: true,
});

export const RecipeImageOutputSchema = z.object({
  id: z.uuid(),
  image: z.string(),
  order: z.coerce.number().default(0),
  /** A Generated Image, drawn by AI (ADR-0025). Carried for archive export; never rendered. */
  generated: z.boolean().default(false),
  version: z.number(),
});

export const RecipeImageSchema = z.object({
  id: z.uuid().optional(),
  image: z.string(),
  order: z.coerce.number().default(0),
  /**
   * Optional without a default on purpose: an absent field carries no intent,
   * so an edit-form save or an old archive can never clear a stored marking.
   */
  generated: z.boolean().optional(),
  version: z.number().int().positive().optional(),
});

export const RecipeImageInputSchema = z.object({
  image: z.string(),
  order: z.coerce.number().default(0),
});

export const DeleteRecipeImageInputSchema = z.object({
  imageId: z.uuid(),
  version: z.number().int().positive(),
});

// Max 10 images per recipe
export const MAX_RECIPE_IMAGES = 10;

export const RecipeImagesArraySchema = z.array(RecipeImageOutputSchema).max(MAX_RECIPE_IMAGES);
export const RecipeImagesInputArraySchema = z.array(RecipeImageInputSchema).max(MAX_RECIPE_IMAGES);
