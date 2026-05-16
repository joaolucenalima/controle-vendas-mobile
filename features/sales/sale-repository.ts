import { db } from "@/database/sqlite";
import {
    CreateSaleDTO,
    CreateSaleItemDTO,
    Sale,
    SaleItem,
    SaleListFilters,
    SaleWithItems,
    UpdateSaleDTO,
} from "./sale.types";

type DatabaseLike = Pick<typeof db, "runAsync" | "getFirstAsync" | "getAllAsync" | "execAsync">;

function buildDateFilter(filters?: SaleListFilters) {
  const where: string[] = [];
  const params: string[] = [];

  if (filters?.initialDate) {
    where.push("sold_at >= ?");
    params.push(`${filters.initialDate}T00:00:00.000Z`);
  }

  if (filters?.finalDate) {
    where.push("sold_at <= ?");
    params.push(`${filters.finalDate}T23:59:59.999Z`);
  }

  return {
    clause: where.length > 0 ? `WHERE ${where.join(" AND ")}` : "",
    params,
  };
}

async function findSaleRowById(database: DatabaseLike, id: number): Promise<Sale | null> {
  const sale = await database.getFirstAsync<Sale>("SELECT * FROM sales WHERE id = ?", [id]);
  return sale ?? null;
}

async function findItemsBySaleId(database: DatabaseLike, saleId: number): Promise<SaleItem[]> {
  return await database.getAllAsync<SaleItem>(
    "SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id ASC",
    [saleId],
  );
}

async function findSaleWithItemsById(
  database: DatabaseLike,
  id: number,
): Promise<SaleWithItems | null> {
  const sale = await findSaleRowById(database, id);
  if (!sale) {
    return null;
  }

  const items = await findItemsBySaleId(database, sale.id);
  return { ...sale, items };
}

async function insertSaleRow(
  database: DatabaseLike,
  { total_in_cents, discount_in_cents, notes, sold_at }: Omit<CreateSaleDTO, "items">,
): Promise<number> {
  const soldAt = sold_at ?? new Date().toISOString();
  const result = await database.runAsync(
    "INSERT INTO sales (total_in_cents, discount_in_cents, notes, sold_at) VALUES (?, ?, ?, ?)",
    [total_in_cents, discount_in_cents ?? 0, notes ?? null, soldAt],
  );

  return result.lastInsertRowId;
}

async function insertSaleItems(
  database: DatabaseLike,
  saleId: number,
  items: CreateSaleItemDTO[],
): Promise<void> {
  for (const item of items) {
    await database.runAsync(
      "INSERT INTO sale_items (sale_id, product_id, quantity, unit_price_in_cents, subtotal_in_cents) VALUES (?, ?, ?, ?, ?)",
      [saleId, item.product_id, item.quantity, item.unit_price_in_cents, item.subtotal_in_cents],
    );
  }
}

async function updateSaleRow(
  database: DatabaseLike,
  id: number,
  data: UpdateSaleDTO,
): Promise<Sale> {
  const updates: string[] = [];
  const params: (string | number | null)[] = [];

  if (data.total_in_cents !== undefined) {
    updates.push("total_in_cents = ?");
    params.push(data.total_in_cents);
  }

  if (data.discount_in_cents !== undefined) {
    updates.push("discount_in_cents = ?");
    params.push(data.discount_in_cents);
  }

  if (data.notes !== undefined) {
    updates.push("notes = ?");
    params.push(data.notes);
  }

  if (data.sold_at !== undefined) {
    updates.push("sold_at = ?");
    params.push(data.sold_at);
  }

  if (updates.length === 0) {
    const existing = await findSaleRowById(database, id);
    if (!existing) {
      throw new Error("Venda não encontrada");
    }
    return existing;
  }

  const result = await database.runAsync(`UPDATE sales SET ${updates.join(", ")} WHERE id = ?`, [
    ...params,
    id,
  ]);

  if (result.changes === 0) {
    throw new Error("Venda não encontrada");
  }

  const sale = await findSaleRowById(database, id);
  if (!sale) {
    throw new Error("Falha ao atualizar venda");
  }

  return sale;
}

async function replaceSaleItems(
  database: DatabaseLike,
  saleId: number,
  items: CreateSaleItemDTO[],
): Promise<SaleItem[]> {
  await database.runAsync("DELETE FROM sale_items WHERE sale_id = ?", [saleId]);
  await insertSaleItems(database, saleId, items);
  return await findItemsBySaleId(database, saleId);
}

async function runSaleTransaction<T>(task: (database: DatabaseLike) => Promise<T>): Promise<T> {
  let value: T | undefined;

  try {
    await db.withExclusiveTransactionAsync(async (txn) => {
      value = await task(txn);
    });
    return value as T;
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.includes("withExclusiveTransactionAsync is not supported on web")
    ) {
      throw error;
    }

    await db.withTransactionAsync(async () => {
      value = await task(db);
    });
    return value as T;
  }
}

export const SaleRepository = {
  async findAll(filters?: SaleListFilters): Promise<Sale[]> {
    const { clause, params } = buildDateFilter(filters);
    return await db.getAllAsync<Sale>(
      `SELECT * FROM sales ${clause} ORDER BY sold_at DESC, id DESC`,
      params,
    );
  },

  async findById(id: number): Promise<SaleWithItems | null> {
    return await findSaleWithItemsById(db, id);
  },

  async findItemsBySaleId(saleId: number): Promise<SaleItem[]> {
    return await findItemsBySaleId(db, saleId);
  },

  async create(data: CreateSaleDTO): Promise<SaleWithItems> {
    let createdSale: SaleWithItems | null = null;

    await runSaleTransaction(async (database) => {
      const saleId = await insertSaleRow(database, data);
      await insertSaleItems(database, saleId, data.items);

      const sale = await findSaleWithItemsById(database, saleId);
      if (!sale) {
        throw new Error("Falha ao criar venda");
      }

      createdSale = sale;
    });

    if (!createdSale) {
      throw new Error("Falha ao criar venda");
    }

    return createdSale;
  },

  async update(id: number, data: UpdateSaleDTO): Promise<SaleWithItems> {
    let updatedSale: SaleWithItems | null = null;

    await runSaleTransaction(async (database) => {
      await updateSaleRow(database, id, data);
      const sale = await findSaleWithItemsById(database, id);
      if (!sale) {
        throw new Error("Falha ao atualizar venda");
      }

      updatedSale = sale;
    });

    if (!updatedSale) {
      throw new Error("Falha ao atualizar venda");
    }

    return updatedSale;
  },

  async replaceItems(saleId: number, items: CreateSaleItemDTO[]): Promise<SaleWithItems> {
    let updatedSale: SaleWithItems | null = null;

    await runSaleTransaction(async (database) => {
      const sale = await findSaleRowById(database, saleId);
      if (!sale) {
        throw new Error("Venda não encontrada");
      }

      await replaceSaleItems(database, saleId, items);
      const saleWithItems = await findSaleWithItemsById(database, saleId);
      if (!saleWithItems) {
        throw new Error("Falha ao atualizar itens da venda");
      }

      updatedSale = saleWithItems;
    });

    if (!updatedSale) {
      throw new Error("Falha ao atualizar itens da venda");
    }

    return updatedSale;
  },

  async updateWithItems(
    id: number,
    data: UpdateSaleDTO,
    items: CreateSaleItemDTO[],
  ): Promise<SaleWithItems> {
    let updatedSale: SaleWithItems | null = null;

    await runSaleTransaction(async (database) => {
      await updateSaleRow(database, id, data);
      await replaceSaleItems(database, id, items);

      const sale = await findSaleWithItemsById(database, id);
      if (!sale) {
        throw new Error("Falha ao atualizar venda");
      }

      updatedSale = sale;
    });

    if (!updatedSale) {
      throw new Error("Falha ao atualizar venda");
    }

    return updatedSale;
  },

  async delete(id: number): Promise<void> {
    const result = await db.runAsync("DELETE FROM sales WHERE id = ?", [id]);

    if (result.changes === 0) {
      throw new Error("Venda não encontrada");
    }
  },
};

