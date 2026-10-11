import {
  listRecipesMissingDishColor,
  updateRecipeDishColor,
} from "@norish/db/repositories/recipes";
import { dbLogger as log } from "@norish/shared-server/logger";
import {
  dishColorForImageUrl,
  primaryImageForDishColor,
} from "@norish/shared-server/media/dish-color";

/**
 * Backfill the Dish Colour (ADR-0023) for recipes stored before the column
 * existed. Extraction otherwise happens when an image is stored, so only
 * this one pass ever reads existing media.
 *
 * Idempotent by shape: only rows with no colour are listed, a row with no
 * usable image is simply skipped (no image means no Dish Colour — that is
 * the defined outcome, not a failure), and a row whose extraction fails
 * stays null and is offered again next startup. Per-row failures never
 * stop the pass and the pass never stops the server.
 */
export async function backfillDishColors(): Promise<void> {
  log.info("Starting Dish Colour backfill check...");

  let written = 0;
  let skippedNoImage = 0;
  let failed = 0;

  try {
    const missing = await listRecipesMissingDishColor();

    for (const recipe of missing) {
      const primaryImage = primaryImageForDishColor({
        image: recipe.image,
        images: recipe.galleryImages,
      });

      if (!primaryImage) {
        skippedNoImage++;
        continue;
      }

      try {
        const dishColor = await dishColorForImageUrl(primaryImage);

        if (!dishColor) {
          failed++;
          continue;
        }

        await updateRecipeDishColor(recipe.id, dishColor);
        written++;
      } catch (err) {
        failed++;
        log.warn({ err, recipeId: recipe.id }, "Dish Colour backfill failed for recipe");
      }
    }

    log.info(
      { written, skippedNoImage, failed, examined: missing.length },
      "Dish Colour backfill complete"
    );
  } catch (err) {
    log.error({ err }, "Dish Colour backfill could not run");
  }
}
