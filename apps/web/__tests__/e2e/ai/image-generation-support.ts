/**
 * Image Generation E2E support: the direct database seams the specs use to
 * configure the image provider block, seed a supplied photograph, and read
 * back what the sweep or a manual run actually stored.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { Client } from "pg";

import { databaseUrl } from "./database";

async function withDatabase<T>(run: (database: Client) => Promise<T>): Promise<T> {
  const database = new Client({ connectionString: databaseUrl() });

  await database.connect();

  try {
    return await run(database);
  } finally {
    await database.end();
  }
}

/**
 * Point the Image Generation block at a provider endpoint — the fake AI
 * provider in practice, through the same `generic-openai` route the AI
 * config uses. Written as a plain (non-sensitive) row: there is no key.
 */
export async function configureImageGeneration(endpoint: string | null): Promise<void> {
  await withDatabase(async (database) => {
    if (endpoint === null) {
      await database.query(`delete from server_config where key = 'image_generation_config'`);

      return;
    }

    const value = JSON.stringify({
      provider: "generic-openai",
      model: "test-image-model",
      endpoint,
    });

    await database.query(
      `insert into server_config (id, key, value, is_sensitive)
         values (gen_random_uuid()::text, 'image_generation_config', $1::jsonb, false)
       on conflict (key) do update set value = excluded.value, value_enc = null, is_sensitive = false`,
      [value]
    );
  });
}

/** The stored gallery of a recipe, ordered, with the Generated Image marking. */
export async function readStoredGalleryImages(
  recipeName: string
): Promise<Array<{ image: string; generated: boolean }>> {
  return await withDatabase(async (database) => {
    const result = await database.query(
      `select ri.image, ri.generated
         from recipe_images ri
         join recipes r on r.id = ri.recipe_id
        where r.name = $1
        order by ri."order"::numeric asc`,
      [recipeName]
    );

    return result.rows as Array<{ image: string; generated: boolean }>;
  });
}

export async function readStoredDishColor(recipeName: string): Promise<string | null> {
  return await withDatabase(async (database) => {
    const result = await database.query(`select dish_color from recipes where name = $1`, [
      recipeName,
    ]);

    return (result.rows[0]?.dish_color as string | null) ?? null;
  });
}

/**
 * Seed a supplied photograph onto a recipe the way an upload would have left
 * it: the file on disk under the stack's uploads dir, a gallery row at order
 * 0, and the Dish Colour the extractor would have stored for it.
 */
export async function seedRecipePhoto(options: {
  recipeName: string;
  uploadsDir: string;
  photoPath: string;
  dishColor: string;
}): Promise<{ url: string }> {
  return await withDatabase(async (database) => {
    const result = await database.query(`select id from recipes where name = $1`, [
      options.recipeName,
    ]);
    const recipeId = result.rows[0]?.id as string | undefined;

    if (!recipeId) throw new Error(`No recipe named ${options.recipeName} to seed a photo onto`);

    const fileName = "supplied-photo.jpg";
    const directory = path.join(options.uploadsDir, "recipes", recipeId);

    await fs.mkdir(directory, { recursive: true });
    await fs.copyFile(options.photoPath, path.join(directory, fileName));

    const url = `/recipes/${recipeId}/${fileName}`;

    await database.query(
      `insert into recipe_images (recipe_id, image, "order") values ($1, $2, '0')`,
      [recipeId, url]
    );
    await database.query(`update recipes set dish_color = $2 where id = $1`, [
      recipeId,
      options.dishColor,
    ]);

    return { url };
  });
}
