import { db } from "../sqlite";

export async function initializeDatabase() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      name TEXT NOT NULL,
      description TEXT,

      price_in_cents INTEGER NOT NULL,

      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      total_in_cents INTEGER NOT NULL,

      discount_in_cents INTEGER DEFAULT 0,

      notes TEXT,

      sold_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,

      quantity INTEGER NOT NULL,

      unit_price_in_cents INTEGER NOT NULL,

      subtotal_in_cents INTEGER NOT NULL,

      FOREIGN KEY (sale_id)
        REFERENCES sales(id)
        ON DELETE CASCADE,

      FOREIGN KEY (product_id)
        REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      title TEXT NOT NULL,

      amount_in_cents INTEGER NOT NULL,

      category TEXT,

      notes TEXT,

      created_at TEXT NOT NULL
    );
  `);
}
