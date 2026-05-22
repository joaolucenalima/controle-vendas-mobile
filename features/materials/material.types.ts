export interface CreateMaterialDTO {
  name: string;
  price_in_cents?: number | null;
}

export interface UpdateMaterialDTO {
  name?: string;
  price_in_cents?: number | null;
}

export interface Material {
  id: number;
  name: string;
  price_in_cents: number | null;
  created_at: string;
}
