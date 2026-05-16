export interface CreateExpenseDTO {
  title: string;
  amount_in_cents: number;
  category?: string;
  notes?: string;
}

export interface UpdateExpenseDTO {
  title?: string;
  amount_in_cents?: number;
  category?: string | null;
  notes?: string | null;
}

export interface Expense {
  id: number;
  title: string;
  amount_in_cents: number;
  category: string | null;
  notes: string | null;
  created_at: string;
}

