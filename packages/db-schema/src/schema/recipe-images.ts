import { boolean, index, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { recipes } from "./recipes";
import { versionColumn } from "./shared";

export const recipeImages = pgTable(
  "recipe_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    image: text("image").notNull(),
    order: numeric("order").default("0"),
    /**
     * A Generated Image: drawn by AI rather than photographed or supplied.
     * Read only by archive export, so a receiving instance is told what it
     * received; no interface surface renders it (ADR-0025).
     */
    generated: boolean("generated").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    ...versionColumn,
  },
  (t) => [index("idx_recipe_images_recipe_id").on(t.recipeId)]
);
