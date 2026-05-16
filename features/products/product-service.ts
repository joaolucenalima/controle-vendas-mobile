import { z } from "zod";
import { ProductRepository } from "./product-repository";
import { CreateProductDTO, UpdateProductDTO } from "./product.types";

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

const createProductSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório"),
  description: z.string().optional(),
  price_in_cents: z.int("Preço inválido").positive("Preço inválido"),
});

const updateProductSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").optional(),
  description: z.string().nullable().optional(),
  price_in_cents: z.int("Preço inválido").positive("Preço inválido").optional(),
});

export const ProductService = {
  async getProducts() {
    return await ProductRepository.findAll();
  },

  async getProductById(id: number) {
    const parsedId = parseOrThrow(idSchema, id, { fallbackMessage: "ID inválido" });

    const product = await ProductRepository.findById(parsedId);
    if (!product) {
      throw new Error("Produto não encontrado");
    }

    return product;
  },

  async createProduct(data: CreateProductDTO) {
    const parsedData = parseOrThrow(createProductSchema, data, {
      fallbackMessage: "Dados inválidos",
      issueMessage: (issue) => {
        const field = issue.path[0];
        if (field === "name") return "Nome obrigatório";
        if (field === "price_in_cents") return "Preço inválido";
        return undefined;
      },
    });
    return await ProductRepository.create(parsedData);
  },

  async updateProduct(id: number, data: UpdateProductDTO) {
    const parsedId = parseOrThrow(idSchema, id, { fallbackMessage: "ID inválido" });
    const parsedData = parseOrThrow(updateProductSchema, data, {
      fallbackMessage: "Dados inválidos",
      issueMessage: (issue) => {
        const field = issue.path[0];
        if (field === "name") return "Nome obrigatório";
        if (field === "price_in_cents") return "Preço inválido";
        return undefined;
      },
    });
    return await ProductRepository.update(parsedId, parsedData);
  },

  async deleteProduct(id: number) {
    const parsedId = parseOrThrow(idSchema, id, { fallbackMessage: "ID inválido" });
    await ProductRepository.delete(parsedId);
  },
};

