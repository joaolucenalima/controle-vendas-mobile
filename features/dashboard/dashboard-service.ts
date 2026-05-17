import { ExpenseRepository } from "../expenses/expense-repository";
import { SaleRepository } from "../sales/sale-repository";

export const DashboardService = {
  async getMetrics(params?: { initialDate?: string; finalDate?: string }) {
    const filters =
      params?.initialDate || params?.finalDate
        ? { initialDate: params.initialDate, finalDate: params.finalDate }
        : undefined;

    const expensesAmount = await ExpenseRepository.getTotalAmountInCents(filters);
    const salesAmount = await SaleRepository.getTotalAmountInCents(filters);
    const { totalItems, totalSales } = await SaleRepository.getTotalItemsSold(filters);

    return {
      expensesAmount,
      salesAmount,
      totalItems,
      totalSales,
    };
  },

  async getLastSale() {
    return await SaleRepository.getLastSale();
  },
};

