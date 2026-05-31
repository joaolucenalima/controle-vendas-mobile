import { db } from "../sqlite";
import { Migration } from "./init";

export const add_app_settings: Migration = {
  id: 4,
  name: "add_app_settings",
  up: async () => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  },
};
