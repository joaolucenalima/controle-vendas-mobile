import { db } from "../sqlite";
import { Migration } from "./init";

export const add_product_image: Migration = {
  id: 3,
  name: "add_product_image",
  up: async () => {
    await db.execAsync(`
      ALTER TABLE products ADD COLUMN image_url TEXT;
    `);
  },
};

