import { create } from "zustand";
import { ProductService } from "./product-service";
import { CreateProductDTO, Product, UpdateProductDTO } from "./product.types";

type ProductStoreState = {
  products: Product[];
  loadProducts: () => Promise<void>;
  createProduct: (data: CreateProductDTO) => Promise<Product>;
  updateProduct: (id: number, data: UpdateProductDTO) => Promise<Product>;
  deleteProduct: (id: number) => Promise<void>;
};

export const useProductStore = create<ProductStoreState>((set, get) => ({
  products: [],

  loadProducts: async () => {
    const products = await ProductService.getProducts();
    set({ products });
  },

  createProduct: async (data) => {
    const product = await ProductService.createProduct(data);
    await get().loadProducts();
    return product;
  },

  updateProduct: async (id, data) => {
    const product = await ProductService.updateProduct(id, data);
    await get().loadProducts();
    return product;
  },

  deleteProduct: async (id) => {
    await ProductService.deleteProduct(id);
    await get().loadProducts();
  },
}));

