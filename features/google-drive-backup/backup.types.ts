export type BackupProduct = {
  id: number;
  name: string;
  description: string | null;
  price_in_cents: number;
  created_at: string;
};

export type BackupSale = {
  id: number;
  total_in_cents: number;
  discount_in_cents: number;
  notes: string | null;
  sold_at: string;
};

export type BackupSaleItem = {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price_in_cents: number;
  subtotal_in_cents: number;
};

export type BackupExpense = {
  id: number;
  amount_in_cents: number;
  notes: string | null;
  created_at: string;
};

export type BackupMaterial = {
  id: number;
  name: string;
  price_in_cents: number | null;
  created_at: string;
};

export type BackupExpenseMaterial = {
  id: number;
  expense_id: number;
  material_id: number;
  material_price_in_cents: number;
  quantity: number;
  created_at: string;
};

export type BackupPayloadV1 = {
  format: "controle-vendas-backup";
  version: 1;
  createdAt: string;
  appVersion: string;
  data: {
    products: BackupProduct[];
    sales: BackupSale[];
    saleItems: BackupSaleItem[];
    expenses: BackupExpense[];
    materials: BackupMaterial[];
    expenseMaterials: BackupExpenseMaterial[];
  };
};

export type DriveBackupFile = {
  id: string;
  name: string;
  createdTime: string;
  size: number;
  formatVersion: number;
};

export type BackupOperationStatus =
  | "idle"
  | "listing"
  | "creating"
  | "restoring";

