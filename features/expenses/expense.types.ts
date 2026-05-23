export interface CreateExpenseMaterialDTO {
  material_id: number;
  quantity: number;
  material_price_in_cents: number;
  subtotal_in_cents: number;
}

export interface CreateExpenseDTO {
  amount_in_cents: number;
  notes?: string;
  materials: CreateExpenseMaterialDTO[];
  created_at?: string;
}

export interface UpdateExpenseDTO {
  amount_in_cents?: number;
  notes?: string | null;
  materials?: CreateExpenseMaterialDTO[];
  created_at?: string;
}

export interface Expense {
  id: number;
  amount_in_cents: number;
  notes: string | null;
  created_at: string;
}

export interface ExpenseMaterial {
  id: number;
  expense_id: number;
  material_id: number;
  quantity: number;
  material_price_in_cents: number;
  subtotal_in_cents: number;
  created_at: string;
}

export interface ExpenseWithMaterials extends Expense {
  materials: ExpenseMaterial[];
}

