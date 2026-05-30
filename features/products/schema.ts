import { z } from "zod";

import { parsePriceToCents } from "@/shared/utils/parse-price-to-cents";

const priceStringSchema = z
  .string()
  .trim()
  .min(1, "Preço obrigatório")
  .refine((value) => {
    const cents = parsePriceToCents(value);
    return cents !== null && cents > 0;
  }, "Preço inválido");

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório"),
  description: z.string().optional(),
  price: priceStringSchema,
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
