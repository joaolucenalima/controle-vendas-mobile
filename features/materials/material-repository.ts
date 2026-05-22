import { db } from "@/database/sqlite";

import { CreateMaterialDTO, Material, UpdateMaterialDTO } from "./material.types";

export const MaterialRepository = {
  async findAll(): Promise<Material[]> {
    return await db.getAllAsync<Material>("SELECT * FROM materials ORDER BY name ASC, id ASC");
  },

  async findById(id: number): Promise<Material | null> {
    const material = await db.getFirstAsync<Material>("SELECT * FROM materials WHERE id = ?", [id]);
    return material ?? null;
  },

  async create({ name, price_in_cents }: CreateMaterialDTO): Promise<Material> {
    const createdAt = new Date().toISOString();

    const result = await db.runAsync(
      "INSERT INTO materials (name, price_in_cents, created_at) VALUES (?, ?, ?)",
      [name, price_in_cents ?? null, createdAt],
    );

    const material = await this.findById(result.lastInsertRowId);
    if (!material) {
      throw new Error("Falha ao criar material");
    }

    return material;
  },

  async update(id: number, data: UpdateMaterialDTO): Promise<Material> {
    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      params.push(data.name);
    }

    if (data.price_in_cents !== undefined) {
      updates.push("price_in_cents = ?");
      params.push(data.price_in_cents);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error("Material não encontrado");
      }
      return existing;
    }

    const result = await db.runAsync(`UPDATE materials SET ${updates.join(", ")} WHERE id = ?`, [
      ...params,
      id,
    ]);

    if (result.changes === 0) {
      throw new Error("Material não encontrado");
    }

    const material = await this.findById(id);
    if (!material) {
      throw new Error("Falha ao atualizar material");
    }

    return material;
  },

  async delete(id: number): Promise<void> {
    const result = await db.runAsync("DELETE FROM materials WHERE id = ?", [id]);

    if (result.changes === 0) {
      throw new Error("Material não encontrado");
    }
  },
};
