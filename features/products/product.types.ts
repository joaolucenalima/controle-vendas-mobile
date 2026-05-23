export interface CreateProductDTO {
  name: string;
  description?: string;
  price_in_cents: number;
  image_url?: string | null;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string | null;
  price_in_cents?: number;
  image_url?: string | null;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price_in_cents: number;
  image_url: string | null;
  created_at: string;
}

