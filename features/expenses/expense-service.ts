import { z } from "zod";
import { ExpenseRepository } from "./expense-repository";
import { CreateExpenseDTO, ExpenseWithMaterials, UpdateExpenseDTO } from "./expense.types";

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

const expenseMaterialSchema = z.object({
  material_id: z.number().int().positive("Material inválido"),
  quantity: z.number().int().positive("Quantidade inválida"),
  material_price_in_cents: z.number().int().positive("Preço inválido"),
  subtotal_in_cents: z.number().int().positive("Subtotal inválido"),
});

const createExpenseSchema = z.object({
  amount_in_cents: z.number().int("Valor inválido").positive("Valor inválido"),
  notes: z.string().optional(),
  materials: z.array(expenseMaterialSchema).min(1, "Adicione ao menos um material"),
});

const updateExpenseSchema = z.object({
  amount_in_cents: z.number().int("Valor inválido").positive("Valor inválido").optional(),
  notes: z.string().nullable().optional(),
  materials: z.array(expenseMaterialSchema).min(1, "Adicione ao menos um material").optional(),
});

export const ExpenseService = {
  async getExpenses() {
    return await ExpenseRepository.findAll();
  },

  async getExpenseById(id: number): Promise<ExpenseWithMaterials> {
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
        if (field === "amount_in_cents") return "Valor inválido";
        if (field === "materials") return "Adicione ao menos um material";
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
        if (field === "amount_in_cents") return "Valor inválido";
        if (field === "materials") return "Adicione ao menos um material";
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

