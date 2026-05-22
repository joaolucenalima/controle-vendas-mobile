export interface CreateExpenseDTO {
  title: string;
  amount_in_cents: number;
  notes?: string;
}

export interface UpdateExpenseDTO {
  title?: string;
  amount_in_cents?: number;
  notes?: string | null;
}

export interface Expense {
  id: number;
  title: string;
  amount_in_cents: number;
  notes: string | null;
  created_at: string;
}

