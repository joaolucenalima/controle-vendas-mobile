import { z } from "zod";

export const materialFormSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório"),
  price: z.string().optional(),
});

export type MaterialFormValues = z.infer<typeof materialFormSchema>;
