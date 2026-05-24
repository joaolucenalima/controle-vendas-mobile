import { db } from "@/database/sqlite";
import {
  CreateExpenseDTO,
  CreateExpenseMaterialDTO,
  Expense,
  ExpenseMaterial,
  ExpenseWithMaterials,
  UpdateExpenseDTO,
} from "./expense.types";

type DatabaseLike = Pick<
  typeof db,
  | "runAsync"
  | "getFirstAsync"
  | "getAllAsync"
  | "execAsync"
  | "withExclusiveTransactionAsync"
  | "withTransactionAsync"
>;

async function findExpenseRowById(database: DatabaseLike, id: number): Promise<Expense | null> {
  const expense = await database.getFirstAsync<Expense>("SELECT * FROM expenses WHERE id = ?", [
    id,
  ]);
  return expense ?? null;
}

async function findMaterialsByExpenseId(
  database: DatabaseLike,
  expenseId: number,
): Promise<ExpenseMaterial[]> {
  return await database.getAllAsync<ExpenseMaterial>(
    "SELECT * FROM expenses_materials WHERE expense_id = ? ORDER BY id ASC",
    [expenseId],
  );
}

async function findExpenseWithMaterialsById(
  database: DatabaseLike,
  id: number,
): Promise<ExpenseWithMaterials | null> {
  const expense = await findExpenseRowById(database, id);
  if (!expense) {
    return null;
  }

  const materials = await findMaterialsByExpenseId(database, expense.id);
  return { ...expense, materials };
}

async function insertExpenseRow(
  database: DatabaseLike,
  { amount_in_cents, notes }: Omit<CreateExpenseDTO, "materials">,
): Promise<number> {
  const createdAt = new Date().toISOString();
  const result = await database.runAsync(
    "INSERT INTO expenses (amount_in_cents, notes, created_at) VALUES (?, ?, ?)",
    [amount_in_cents, notes ?? null, createdAt],
  );

  return result.lastInsertRowId;
}

async function insertExpenseMaterials(
  database: DatabaseLike,
  expenseId: number,
  materials: CreateExpenseMaterialDTO[],
): Promise<void> {
  for (const item of materials) {
    await database.runAsync(
      "INSERT INTO expenses_materials (expense_id, material_id, material_price_in_cents, quantity, created_at) VALUES (?, ?, ?, ?, ?)",
      [
        expenseId,
        item.material_id,
        item.material_price_in_cents,
        item.quantity,
        new Date().toISOString(),
      ],
    );
  }
}

async function replaceExpenseMaterials(
  database: DatabaseLike,
  expenseId: number,
  materials: CreateExpenseMaterialDTO[],
): Promise<ExpenseMaterial[]> {
  await database.runAsync("DELETE FROM expenses_materials WHERE expense_id = ?", [expenseId]);
  await insertExpenseMaterials(database, expenseId, materials);
  return await findMaterialsByExpenseId(database, expenseId);
}

async function updateExpenseRow(
  database: DatabaseLike,
  id: number,
  data: UpdateExpenseDTO,
): Promise<Expense> {
  const updates: string[] = [];
  const params: (string | number | null)[] = [];

  if (data.amount_in_cents !== undefined) {
    updates.push("amount_in_cents = ?");
    params.push(data.amount_in_cents);
  }

  if (data.notes !== undefined) {
    updates.push("notes = ?");
    params.push(data.notes ?? null);
  }

  if (updates.length === 0) {
    const existing = await findExpenseRowById(database, id);
    if (!existing) {
      throw new Error("Despesa não encontrada");
    }
    return existing;
  }

  const result = await database.runAsync(`UPDATE expenses SET ${updates.join(", ")} WHERE id = ?`, [
    ...params,
    id,
  ]);

  if (result.changes === 0) {
    throw new Error("Despesa não encontrada");
  }

  const expense = await findExpenseRowById(database, id);
  if (!expense) {
    throw new Error("Falha ao atualizar despesa");
  }

  return expense;
}

async function runExpenseTransaction<T>(task: (database: DatabaseLike) => Promise<T>): Promise<T> {
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

export const ExpenseRepository = {
  async findAll(): Promise<Expense[]> {
    return await db.getAllAsync<Expense>("SELECT * FROM expenses");
  },

  async findById(id: number): Promise<ExpenseWithMaterials | null> {
    return await findExpenseWithMaterialsById(db, id);
  },

  async getTotalAmountInCents(filters?: {
    initialDate?: string;
    finalDate?: string;
  }): Promise<number> {
    const where: string[] = [];
    const params: string[] = [];

    if (filters?.initialDate) {
      where.push("created_at >= ?");
      params.push(`${filters.initialDate}T00:00:00.000Z`);
    }

    if (filters?.finalDate) {
      where.push("created_at <= ?");
      params.push(`${filters.finalDate}T23:59:59.999Z`);
    }

    const clause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const result = await db.getFirstAsync<{ total: number }>(
      `SELECT SUM(amount_in_cents) as total FROM expenses ${clause}`,
      params,
    );

    return result?.total ?? 0;
  },

  async create(data: CreateExpenseDTO): Promise<ExpenseWithMaterials> {
    let createdExpense: ExpenseWithMaterials | null = null;

    await runExpenseTransaction(async (database) => {
      const expenseId = await insertExpenseRow(database, data);
      await insertExpenseMaterials(database, expenseId, data.materials);

      const expense = await findExpenseWithMaterialsById(database, expenseId);
      if (!expense) {
        throw new Error("Falha ao criar despesa");
      }

      createdExpense = expense;
    });

    if (!createdExpense) {
      throw new Error("Falha ao criar despesa");
    }

    return createdExpense;
  },

  async update(id: number, data: UpdateExpenseDTO): Promise<ExpenseWithMaterials> {
    let updatedExpense: ExpenseWithMaterials | null = null;

    await runExpenseTransaction(async (database) => {
      const existing = await findExpenseRowById(database, id);
      if (!existing) {
        throw new Error("Despesa não encontrada");
      }

      const updatedRow = await updateExpenseRow(database, id, data);
      if (data.materials) {
        await replaceExpenseMaterials(database, id, data.materials);
      }

      const expense = await findExpenseWithMaterialsById(database, updatedRow.id);
      if (!expense) {
        throw new Error("Falha ao atualizar despesa");
      }

      updatedExpense = expense;
    });

    if (!updatedExpense) {
      throw new Error("Falha ao atualizar despesa");
    }

    return updatedExpense;
  },

  async delete(id: number): Promise<void> {
    const result = await db.runAsync("DELETE FROM expenses WHERE id = ?", [id]);

    if (result.changes === 0) {
      throw new Error("Despesa não encontrada");
    }
  },
};

