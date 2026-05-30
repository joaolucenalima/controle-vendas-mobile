import { z } from "zod";

export const saleFormSchema = z.object({
  notes: z.string().optional(),
});

export type SaleFormValues = z.infer<typeof saleFormSchema>;
