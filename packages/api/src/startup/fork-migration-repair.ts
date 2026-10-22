import { sql } from "drizzle-orm";

import { db } from "@norish/db";
import { dbLogger } from "@norish/shared-server/logger";

/**
 * The Dessert category first shipped in this fork as migration 0055, stamped
 * 2026-10-11 — newer than upstream's own 0055–0073. Drizzle only applies
 * migrations stamped after the newest one it has recorded, so a database that
 * ran that 0055 would silently skip all of upstream's.
 *
 * The migration now runs last as 0074 (`ADD VALUE IF NOT EXISTS`, so it is a
 * no-op where Dessert exists). Forgetting the old record puts the newest
 * recorded migration back at 0054, and the skipped ones apply in order.
 */
export const RETIRED_DESSERT_MIGRATION_MILLIS = 1791677812090;

export async function forgetRetiredForkMigrations(): Promise<void> {
  // A fresh database has no bookkeeping table yet, and Postgres refuses a
  // DELETE on a missing table before any WHERE runs: ask first.
  const table = await db.execute<{ exists: boolean }>(
    sql`SELECT to_regclass('drizzle.__drizzle_migrations') IS NOT NULL AS exists`
  );

  if (!table.rows[0]?.exists) return;

  const result = await db.execute<{ removed: number }>(sql`
    WITH removed AS (
      DELETE FROM drizzle.__drizzle_migrations
      WHERE created_at = ${RETIRED_DESSERT_MIGRATION_MILLIS}
      RETURNING 1
    )
    SELECT count(*)::int AS removed FROM removed
  `);
  const removed = result.rows[0]?.removed ?? 0;

  if (removed > 0) {
    dbLogger.info(
      { removed },
      "Forgot the retired Dessert migration record; skipped upstream migrations will apply"
    );
  }
}
