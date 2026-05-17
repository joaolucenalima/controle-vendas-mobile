import { db } from "@/database/sqlite";
import { CreateExpenseDTO, Expense, UpdateExpenseDTO } from "./expense.types";

export const ExpenseRepository = {
  async findAll(): Promise<Expense[]> {
    return await db.getAllAsync<Expense>("SELECT * FROM expenses");
  },

  async findById(id: number): Promise<Expense | null> {
    const expense = await db.getFirstAsync<Expense>("SELECT * FROM expenses WHERE id = ?", [id]);
    return expense ?? null;
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

  async create({ title, amount_in_cents, category, notes }: CreateExpenseDTO): Promise<Expense> {
    const createdAt = new Date().toISOString();

    const result = await db.runAsync(
      "INSERT INTO expenses (title, amount_in_cents, category, notes, created_at) VALUES (?, ?, ?, ?, ?)",
      [title, amount_in_cents, category ?? null, notes ?? null, createdAt],
    );

    const expense = await this.findById(result.lastInsertRowId);
    if (!expense) {
      throw new Error("Falha ao criar despesa");
    }

    return expense;
  },

  async update(id: number, data: UpdateExpenseDTO): Promise<Expense> {
    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (data.title !== undefined) {
      updates.push("title = ?");
      params.push(data.title);
    }

    if (data.amount_in_cents !== undefined) {
      updates.push("amount_in_cents = ?");
      params.push(data.amount_in_cents);
    }

    if (data.category !== undefined) {
      updates.push("category = ?");
      params.push(data.category ?? null);
    }

    if (data.notes !== undefined) {
      updates.push("notes = ?");
      params.push(data.notes ?? null);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error("Despesa não encontrada");
      }
      return existing;
    }

    const result = await db.runAsync(`UPDATE expenses SET ${updates.join(", ")} WHERE id = ?`, [
      ...params,
      id,
    ]);

    if (result.changes === 0) {
      throw new Error("Despesa não encontrada");
    }

    const expense = await this.findById(id);
    if (!expense) {
      throw new Error("Falha ao atualizar despesa");
    }

    return expense;
  },

  async delete(id: number): Promise<void> {
    const result = await db.runAsync("DELETE FROM expenses WHERE id = ?", [id]);

    if (result.changes === 0) {
      throw new Error("Despesa não encontrada");
    }
  },
};

