import Constants from "expo-constants";

import { db } from "@/database/sqlite";
import { backupPayloadV1Schema } from "./backup.schema";
import type {
  BackupExpense,
  BackupExpenseMaterial,
  BackupMaterial,
  BackupPayloadV1,
  BackupProduct,
  BackupSale,
  BackupSaleItem,
} from "./backup.types";

type TransactionDatabase = Pick<typeof db, "execAsync" | "runAsync">;

async function insertBackupData(database: TransactionDatabase, payload: BackupPayloadV1) {
  await database.execAsync(`
    DELETE FROM sale_items;
    DELETE FROM expenses_materials;
    DELETE FROM sales;
    DELETE FROM expenses;
    DELETE FROM products;
    DELETE FROM materials;
  `);

  for (const product of payload.data.products) {
    await database.runAsync(
      "INSERT INTO products (id, name, description, price_in_cents, image_url, created_at) VALUES (?, ?, ?, ?, NULL, ?)",
      [
        product.id,
        product.name,
        product.description,
        product.price_in_cents,
        product.created_at,
      ],
    );
  }

  for (const material of payload.data.materials) {
    await database.runAsync(
      "INSERT INTO materials (id, name, price_in_cents, created_at) VALUES (?, ?, ?, ?)",
      [material.id, material.name, material.price_in_cents, material.created_at],
    );
  }

  for (const sale of payload.data.sales) {
    await database.runAsync(
      "INSERT INTO sales (id, total_in_cents, discount_in_cents, notes, sold_at) VALUES (?, ?, ?, ?, ?)",
      [sale.id, sale.total_in_cents, sale.discount_in_cents, sale.notes, sale.sold_at],
    );
  }

  for (const expense of payload.data.expenses) {
    await database.runAsync(
      "INSERT INTO expenses (id, amount_in_cents, notes, created_at) VALUES (?, ?, ?, ?)",
      [expense.id, expense.amount_in_cents, expense.notes, expense.created_at],
    );
  }

  for (const item of payload.data.saleItems) {
    await database.runAsync(
      "INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price_in_cents, subtotal_in_cents) VALUES (?, ?, ?, ?, ?, ?)",
      [
        item.id,
        item.sale_id,
        item.product_id,
        item.quantity,
        item.unit_price_in_cents,
        item.subtotal_in_cents,
      ],
    );
  }

  for (const item of payload.data.expenseMaterials) {
    await database.runAsync(
      "INSERT INTO expenses_materials (id, expense_id, material_id, material_price_in_cents, quantity, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [
        item.id,
        item.expense_id,
        item.material_id,
        item.material_price_in_cents,
        item.quantity,
        item.created_at,
      ],
    );
  }
}

export const BackupRepository = {
  async exportData(): Promise<BackupPayloadV1> {
    const [products, sales, saleItems, expenses, materials, expenseMaterials] = await Promise.all([
      db.getAllAsync<BackupProduct>(
        "SELECT id, name, description, price_in_cents, created_at FROM products ORDER BY id",
      ),
      db.getAllAsync<BackupSale>("SELECT * FROM sales ORDER BY id"),
      db.getAllAsync<BackupSaleItem>("SELECT * FROM sale_items ORDER BY id"),
      db.getAllAsync<BackupExpense>("SELECT * FROM expenses ORDER BY id"),
      db.getAllAsync<BackupMaterial>("SELECT * FROM materials ORDER BY id"),
      db.getAllAsync<BackupExpenseMaterial>("SELECT * FROM expenses_materials ORDER BY id"),
    ]);

    return {
      format: "controle-vendas-backup",
      version: 1,
      createdAt: new Date().toISOString(),
      appVersion: Constants.expoConfig?.version ?? "1.0.0",
      data: { products, sales, saleItems, expenses, materials, expenseMaterials },
    };
  },

  parse(serializedBackup: string): BackupPayloadV1 {
    let value: unknown;

    try {
      value = JSON.parse(serializedBackup);
    } catch {
      throw new Error("O arquivo de backup está corrompido.");
    }

    const result = backupPayloadV1Schema.safeParse(value);
    if (!result.success) {
      const version =
        typeof value === "object" && value !== null && "version" in value
          ? String(value.version)
          : null;
      throw new Error(
        version && version !== "1"
          ? `A versão ${version} deste backup não é compatível com o aplicativo.`
          : "O arquivo selecionado não é um backup válido.",
      );
    }

    return result.data;
  },

  async restore(payload: BackupPayloadV1): Promise<void> {
    try {
      await db.withExclusiveTransactionAsync(async (transaction) => {
        await insertBackupData(transaction, payload);
      });
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes("withExclusiveTransactionAsync is not supported on web")
      ) {
        throw error;
      }

      await db.withTransactionAsync(async () => {
        await insertBackupData(db, payload);
      });
    }
  },
};
