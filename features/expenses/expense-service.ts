import { z } from "zod";
import { ExpenseRepository } from "./expense-repository";
import { CreateExpenseDTO, UpdateExpenseDTO } from "./expense.types";

function parseOrThrow<T>(
  schema: z.ZodType<T>,
  value: unknown,
  options?: {
    fallbackMessage?: string;
    issueMessage?: (issue: z.ZodIssue) => string | undefined;
  },
): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const issue = result.error.issues[0];
    const mapped = issue ? options?.issueMessage?.(issue) : undefined;
    throw new Error(mapped ?? options?.fallbackMessage ?? issue?.message ?? "Dados inválidos");
  }

  return result.data;
}

const idSchema = z.number().int().positive();

const createExpenseSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório"),
  amount_in_cents: z.number().int("Valor inválido").positive("Valor inválido"),
  category: z.string().optional(),
  notes: z.string().optional(),
});

const updateExpenseSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório").optional(),
  amount_in_cents: z.number().int("Valor inválido").positive("Valor inválido").optional(),
  category: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const ExpenseService = {
  async getExpenses() {
    return await ExpenseRepository.findAll();
  },

  async getExpenseById(id: number) {
    const parsedId = parseOrThrow(idSchema, id, { fallbackMessage: "ID inválido" });

    const expense = await ExpenseRepository.findById(parsedId);
    if (!expense) {
      throw new Error("Despesa não encontrada");
    }

    return expense;
  },

  async createExpense(data: CreateExpenseDTO) {
    const parsedData = parseOrThrow(createExpenseSchema, data, {
      fallbackMessage: "Dados inválidos",
      issueMessage: (issue) => {
        const field = issue.path[0];
        if (field === "title") return "Título obrigatório";
        if (field === "amount_in_cents") return "Valor inválido";
        return undefined;
      },
    });
    return await ExpenseRepository.create(parsedData);
  },

  async updateExpense(id: number, data: UpdateExpenseDTO) {
    const parsedId = parseOrThrow(idSchema, id, { fallbackMessage: "ID inválido" });
    const parsedData = parseOrThrow(updateExpenseSchema, data, {
      fallbackMessage: "Dados inválidos",
      issueMessage: (issue) => {
        const field = issue.path[0];
        if (field === "title") return "Título obrigatório";
        if (field === "amount_in_cents") return "Valor inválido";
        return undefined;
      },
    });
    return await ExpenseRepository.update(parsedId, parsedData);
  },

  async deleteExpense(id: number) {
    const parsedId = parseOrThrow(idSchema, id, { fallbackMessage: "ID inválido" });
    await ExpenseRepository.delete(parsedId);
  },
};

