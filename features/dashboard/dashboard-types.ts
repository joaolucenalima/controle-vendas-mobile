import { SaleWithItems } from "../sales/sale.types";

export interface DashboardMetrics {
  expensesAmount: number;
  salesAmount: number;
  totalItems: number;
  totalSales: number;
}

export interface DashboardState {
  metrics: DashboardMetrics;
  lastSale: SaleWithItems | null;
  loadMetrics: (params: { initialDate: string; finalDate: string }) => Promise<void>;
  loadLastSale: () => Promise<void>;
}

