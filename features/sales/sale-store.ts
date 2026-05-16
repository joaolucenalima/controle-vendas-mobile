import { create } from "zustand";

import { SaleService } from "./sale-service";
import {
    CreateSaleDTO,
    CreateSaleItemDTO,
    Sale,
    SaleListFilters,
    SaleWithItems,
    UpdateSaleDTO,
} from "./sale.types";

type SaleStoreState = {
  sales: Sale[];
  loadSales: (filters?: SaleListFilters) => Promise<void>;
  getSaleById: (id: number) => Promise<SaleWithItems>;
  createSale: (data: CreateSaleDTO) => Promise<SaleWithItems>;
  updateSale: (id: number, data: UpdateSaleDTO) => Promise<SaleWithItems>;
  updateSaleItems: (id: number, items: CreateSaleItemDTO[]) => Promise<SaleWithItems>;
  updateSaleWithItems: (
    id: number,
    data: { sale: UpdateSaleDTO; items: CreateSaleItemDTO[] },
  ) => Promise<SaleWithItems>;
  deleteSale: (id: number) => Promise<void>;
};

export const useSaleStore = create<SaleStoreState>((set, get) => ({
  sales: [],

  loadSales: async (filters) => {
    const sales = await SaleService.getSales(filters);
    set({ sales });
  },

  getSaleById: async (id) => {
    return await SaleService.getSaleById(id);
  },

  createSale: async (data) => {
    const sale = await SaleService.createSale(data);
    await get().loadSales();
    return sale;
  },

  updateSale: async (id, data) => {
    const sale = await SaleService.updateSale(id, data);
    await get().loadSales();
    return sale;
  },

  updateSaleItems: async (id, items) => {
    const sale = await SaleService.updateSaleItems(id, items);
    await get().loadSales();
    return sale;
  },

  updateSaleWithItems: async (id, data) => {
    const sale = await SaleService.updateSaleWithItems(id, data);
    await get().loadSales();
    return sale;
  },

  deleteSale: async (id) => {
    await SaleService.deleteSale(id);
    await get().loadSales();
  },
}));

