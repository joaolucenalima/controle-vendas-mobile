export interface CreateProductDTO {
  name: string;
  description?: string;
  price_in_cents: number;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string | null;
  price_in_cents?: number;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price_in_cents: number;
  created_at: string;
}

