import { ExpenseRepository } from "../expenses/expense-repository";
import { SaleRepository } from "../sales/sale-repository";

export const DashboardService = {
  async getMetrics(params: { initialDate: string; finalDate: string }) {
    const expensesAmount = await ExpenseRepository.getTotalAmountInCents(params);
    const salesAmount = await SaleRepository.getTotalAmountInCents(params);
    const { totalItems, totalSales } = await SaleRepository.getTotalItemsSold(params);

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

