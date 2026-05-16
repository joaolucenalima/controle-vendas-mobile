import { create } from "zustand";
import { ExpenseService } from "./expense-service";
import { CreateExpenseDTO, Expense, UpdateExpenseDTO } from "./expense.types";

type ExpenseStoreState = {
  expenses: Expense[];
  loadExpenses: () => Promise<void>;
  createExpense: (data: CreateExpenseDTO) => Promise<Expense>;
  updateExpense: (id: number, data: UpdateExpenseDTO) => Promise<Expense>;
  deleteExpense: (id: number) => Promise<void>;
};

export const useExpenseStore = create<ExpenseStoreState>((set, get) => ({
  expenses: [],

  loadExpenses: async () => {
    const expenses = await ExpenseService.getExpenses();
    set({ expenses });
  },

  createExpense: async (data) => {
    const expense = await ExpenseService.createExpense(data);
    await get().loadExpenses();
    return expense;
  },

  updateExpense: async (id, data) => {
    const expense = await ExpenseService.updateExpense(id, data);
    await get().loadExpenses();
    return expense;
  },

  deleteExpense: async (id) => {
    await ExpenseService.deleteExpense(id);
    await get().loadExpenses();
  },
}));

