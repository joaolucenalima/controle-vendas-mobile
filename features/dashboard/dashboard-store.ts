import { create } from "zustand";
import { DashboardService } from "./dashboard-service";
import { DashboardMetrics, DashboardState } from "./dashboard-types";

const emptyMetrics: DashboardMetrics = {
  expensesAmount: 0,
  salesAmount: 0,
  totalItems: 0,
  totalSales: 0,
};

export const useDashboardStore = create<DashboardState>((set, _get) => ({
  metrics: emptyMetrics,
  lastSale: null,

  loadMetrics: async (params) => {
    const metrics = await DashboardService.getMetrics(params);
    set({ metrics });
  },

  loadLastSale: async () => {
    const lastSale = await DashboardService.getLastSale();
    set({ lastSale });
  },
}));

