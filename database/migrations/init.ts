import { db } from "../sqlite";
import { create_initial_tables } from "./001_create_initial_tables";
import { add_materials_table } from "./002_add_materials_table";

export type Migration = {
  id: number;
  name: string;
  up: () => Promise<void>;
};

const migrations: Migration[] = [create_initial_tables, add_materials_table].sort(
  (a, b) => a.id - b.id,
);

async function recordMigration(migration: Migration) {
  await db.runAsync("INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?)", [
    migration.id,
    migration.name,
    new Date().toISOString(),
  ]);
}

async function runMigration(migration: Migration) {
  try {
    await db.withExclusiveTransactionAsync(async () => {
      await migration.up();
      await recordMigration(migration);
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("withExclusiveTransactionAsync is not supported on web")
    ) {
      await db.withTransactionAsync(async () => {
        await migration.up();
        await recordMigration(migration);
      });
      return;
    }

    throw error;
  }
}

export async function initializeDatabase() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const appliedMigrations = await db.getAllAsync<{ id: number }>(
    "SELECT id FROM schema_migrations ORDER BY id ASC",
  );

  const appliedMigrationIds = new Set(appliedMigrations.map((migration) => migration.id));

  for (const migration of migrations) {
    if (appliedMigrationIds.has(migration.id)) {
      continue;
    }

    await runMigration(migration);
  }
}

