import { db } from "../sqlite";
import { Migration } from "./init";

export const add_materials_table: Migration = {
  id: 2,
  name: "add_materials_table",
  up: async () => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        name TEXT NOT NULL,

        price_in_cents INTEGER,

        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS expenses_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        expense_id INTEGER NOT NULL,
        material_id INTEGER NOT NULL,

        material_price_in_cents INTEGER NOT NULL,
        quantity integer NOT NULL,

        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
        FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
      );

      ALTER TABLE expenses REMOVE COLUMN category;
      ALTER TABLE expenses REMOVE COLUMN title;
    `);
  },
};

