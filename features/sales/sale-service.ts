import { z } from "zod";

import { SaleRepository } from "./sale-repository";
import { CreateSaleDTO, CreateSaleItemDTO, SaleListFilters, UpdateSaleDTO } from "./sale.types";

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

const saleItemSchema = z.object({
  product_id: z.number().int().positive("Produto inválido"),
  quantity: z.number().int().positive("Quantidade inválida"),
  unit_price_in_cents: z.number().int().positive("Preço unitário inválido"),
  subtotal_in_cents: z.number().int().positive("Subtotal inválido"),
});

const createSaleSchema = z.object({
  total_in_cents: z.number().int().positive("Total inválido"),
  discount_in_cents: z.number().int().nonnegative("Desconto inválido").optional(),
  notes: z.string().optional(),
  sold_at: z.string().datetime({ offset: true }).optional(),
  items: z.array(saleItemSchema).min(1, "Adicione ao menos um item"),
});

const updateSaleSchema = z.object({
  total_in_cents: z.number().int().positive("Total inválido").optional(),
  discount_in_cents: z.number().int().nonnegative("Desconto inválido").optional(),
  notes: z.string().nullable().optional(),
  sold_at: z.string().datetime({ offset: true }).optional(),
});

const dateFilterSchema = z
  .object({
    initialDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inicial inválida")
      .optional(),
    finalDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data final inválida")
      .optional(),
  })
  .refine(
    ({ initialDate, finalDate }) => {
      if (!initialDate || !finalDate) return true;
      return initialDate <= finalDate;
    },
    { message: "Data inicial deve ser menor ou igual à data final" },
  );

const updateWithItemsSchema = z.object({
  sale: updateSaleSchema,
  items: z.array(saleItemSchema).min(1, "Adicione ao menos um item"),
});

export const SaleService = {
  async getSales(filters?: SaleListFilters) {
    const parsedFilters = filters ? parseOrThrow(dateFilterSchema, filters) : undefined;
    return await SaleRepository.findAll(parsedFilters);
  },

  async getSaleById(id: number) {
    const parsedId = parseOrThrow(idSchema, id, { fallbackMessage: "ID inválido" });

    const sale = await SaleRepository.findById(parsedId);
    if (!sale) {
      throw new Error("Venda não encontrada");
    }

    return sale;
  },

  async createSale(data: CreateSaleDTO) {
    const parsedData = parseOrThrow(createSaleSchema, data, {
      fallbackMessage: "Dados inválidos",
      issueMessage: (issue) => {
        const field = issue.path[0];
        if (field === "total_in_cents") return "Total inválido";
        if (field === "items") return "Adicione ao menos um item";
        return undefined;
      },
    });

    return await SaleRepository.create(parsedData);
  },

  async updateSale(id: number, data: UpdateSaleDTO) {
    const parsedId = parseOrThrow(idSchema, id, { fallbackMessage: "ID inválido" });
    const parsedData = parseOrThrow(updateSaleSchema, data, {
      fallbackMessage: "Dados inválidos",
      issueMessage: (issue) => {
        const field = issue.path[0];
        if (field === "total_in_cents") return "Total inválido";
        if (field === "discount_in_cents") return "Desconto inválido";
        return undefined;
      },
    });

    return await SaleRepository.update(parsedId, parsedData);
  },

  async updateSaleItems(id: number, items: CreateSaleItemDTO[]) {
    const parsedId = parseOrThrow(idSchema, id, { fallbackMessage: "ID inválido" });
    const parsedItems = parseOrThrow(
      z.array(saleItemSchema).min(1, "Adicione ao menos um item"),
      items,
      {
        fallbackMessage: "Dados inválidos",
        issueMessage: (issue) => {
          if (issue.path[0] === undefined) return "Adicione ao menos um item";
          return undefined;
        },
      },
    );

    return await SaleRepository.replaceItems(parsedId, parsedItems);
  },

  async updateSaleWithItems(id: number, data: { sale: UpdateSaleDTO; items: CreateSaleItemDTO[] }) {
    const parsedId = parseOrThrow(idSchema, id, { fallbackMessage: "ID inválido" });
    const parsedData = parseOrThrow(updateWithItemsSchema, data, {
      fallbackMessage: "Dados inválidos",
      issueMessage: (issue) => {
        const field = issue.path[0];
        if (field === "sale") return "Dados da venda inválidos";
        if (field === "items") return "Adicione ao menos um item";
        return undefined;
      },
    });

    return await SaleRepository.updateWithItems(parsedId, parsedData.sale, parsedData.items);
  },

  async deleteSale(id: number) {
    const parsedId = parseOrThrow(idSchema, id, { fallbackMessage: "ID inválido" });
    await SaleRepository.delete(parsedId);
  },
};

