export interface SaleListFilters {
  initialDate?: string;
  finalDate?: string;
}

export interface CreateSaleItemDTO {
  product_id: number;
  quantity: number;
  unit_price_in_cents: number;
  subtotal_in_cents: number;
}

export interface CreateSaleDTO {
  total_in_cents: number;
  discount_in_cents?: number;
  notes?: string;
  sold_at?: string;
  items: CreateSaleItemDTO[];
}

export interface UpdateSaleDTO {
  total_in_cents?: number;
  discount_in_cents?: number;
  notes?: string | null;
  sold_at?: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price_in_cents: number;
  subtotal_in_cents: number;
}

export interface Sale {
  id: number;
  total_in_cents: number;
  discount_in_cents: number;
  notes: string | null;
  sold_at: string;
}

export interface SaleWithItems extends Sale {
  items: SaleItem[];
}
