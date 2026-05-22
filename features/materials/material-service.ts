import { z } from "zod";

import { MaterialRepository } from "./material-repository";
import { CreateMaterialDTO, UpdateMaterialDTO } from "./material.types";

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

const createMaterialSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório"),
  price_in_cents: z.number().int().positive("Preço inválido").nullable().optional(),
});

const updateMaterialSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").optional(),
  price_in_cents: z.number().int().positive("Preço inválido").nullable().optional(),
});

export const MaterialService = {
  async getMaterials() {
    return await MaterialRepository.findAll();
  },

  async getMaterialById(id: number) {
    const parsedId = parseOrThrow(idSchema, id, { fallbackMessage: "ID inválido" });

    const material = await MaterialRepository.findById(parsedId);
    if (!material) {
      throw new Error("Material não encontrado");
    }

    return material;
  },

  async createMaterial(data: CreateMaterialDTO) {
    const parsedData = parseOrThrow(createMaterialSchema, data, {
      fallbackMessage: "Dados inválidos",
      issueMessage: (issue) => {
        const field = issue.path[0];
        if (field === "name") return "Nome obrigatório";
        if (field === "price_in_cents") return "Preço inválido";
        return undefined;
      },
    });

    return await MaterialRepository.create(parsedData);
  },

  async updateMaterial(id: number, data: UpdateMaterialDTO) {
    const parsedId = parseOrThrow(idSchema, id, { fallbackMessage: "ID inválido" });
    const parsedData = parseOrThrow(updateMaterialSchema, data, {
      fallbackMessage: "Dados inválidos",
      issueMessage: (issue) => {
        const field = issue.path[0];
        if (field === "name") return "Nome obrigatório";
        if (field === "price_in_cents") return "Preço inválido";
        return undefined;
      },
    });

    return await MaterialRepository.update(parsedId, parsedData);
  },

  async deleteMaterial(id: number) {
    const parsedId = parseOrThrow(idSchema, id, { fallbackMessage: "ID inválido" });
    await MaterialRepository.delete(parsedId);
  },
};
