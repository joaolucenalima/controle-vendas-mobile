import { z } from "zod";

export const expenseFormSchema = z.object({
  notes: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
