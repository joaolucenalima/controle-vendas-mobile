import { db } from "@/database/sqlite";
import { CreateProductDTO, Product, UpdateProductDTO } from "./product.types";

export const ProductRepository = {
  async findAll(): Promise<Product[]> {
    return await db.getAllAsync<Product>("SELECT * FROM products");
  },

  async findById(id: number): Promise<Product | null> {
    const product = await db.getFirstAsync<Product>("SELECT * FROM products WHERE id = ?", [id]);
    return product ?? null;
  },

  async create({ name, description, price_in_cents }: CreateProductDTO): Promise<Product> {
    const createdAt = new Date().toISOString();

    const result = await db.runAsync(
      "INSERT INTO products (name, description, price_in_cents, created_at) VALUES (?, ?, ?, ?)",
      [name, description ?? null, price_in_cents, createdAt],
    );

    const product = await this.findById(result.lastInsertRowId);
    if (!product) {
      throw new Error("Falha ao criar produto");
    }

    return product;
  },

  async update(id: number, data: UpdateProductDTO): Promise<Product> {
    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      params.push(data.name);
    }

    if (data.description !== undefined) {
      updates.push("description = ?");
      params.push(data.description);
    }

    if (data.price_in_cents !== undefined) {
      updates.push("price_in_cents = ?");
      params.push(data.price_in_cents);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error("Produto não encontrado");
      }
      return existing;
    }

    const result = await db.runAsync(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`, [
      ...params,
      id,
    ]);

    if (result.changes === 0) {
      throw new Error("Produto não encontrado");
    }

    const product = await this.findById(id);
    if (!product) {
      throw new Error("Falha ao atualizar produto");
    }

    return product;
  },

  async delete(id: number): Promise<void> {
    const result = await db.runAsync("DELETE FROM products WHERE id = ?", [id]);

    if (result.changes === 0) {
      throw new Error("Produto não encontrado");
    }
  },
};

