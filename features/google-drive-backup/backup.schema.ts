import { z } from "zod";

const positiveId = z.number().int().positive();
const cents = z.number().int().nonnegative();

const productSchema = z.object({
  id: positiveId,
  name: z.string(),
  description: z.string().nullable(),
  price_in_cents: cents,
  created_at: z.string(),
});

const saleSchema = z.object({
  id: positiveId,
  total_in_cents: cents,
  discount_in_cents: cents,
  notes: z.string().nullable(),
  sold_at: z.string(),
});

const saleItemSchema = z.object({
  id: positiveId,
  sale_id: positiveId,
  product_id: positiveId,
  quantity: z.number().int().positive(),
  unit_price_in_cents: cents,
  subtotal_in_cents: cents,
});

const expenseSchema = z.object({
  id: positiveId,
  amount_in_cents: cents,
  notes: z.string().nullable(),
  created_at: z.string(),
});

const materialSchema = z.object({
  id: positiveId,
  name: z.string(),
  price_in_cents: cents.nullable(),
  created_at: z.string(),
});

const expenseMaterialSchema = z.object({
  id: positiveId,
  expense_id: positiveId,
  material_id: positiveId,
  material_price_in_cents: cents,
  quantity: z.number().int().positive(),
  created_at: z.string(),
});

export const backupPayloadV1Schema = z.object({
  format: z.literal("controle-vendas-backup"),
  version: z.literal(1),
  createdAt: z.string(),
  appVersion: z.string(),
  data: z.object({
    products: z.array(productSchema),
    sales: z.array(saleSchema),
    saleItems: z.array(saleItemSchema),
    expenses: z.array(expenseSchema),
    materials: z.array(materialSchema),
    expenseMaterials: z.array(expenseMaterialSchema),
  }),
});

