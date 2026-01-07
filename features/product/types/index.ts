export interface SimpleRef {
  id: string;
  name: string;
}

export interface UomRef {
  id: string;
  name: string;
  abbreviation?: string;
  conversionRate?: string;
}

export interface Batch {
  id: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity?: number;
}

export interface Product {
  id: string;
  name: string;
  productCode?: string;
  genericName?: string | null;
  description?: string | null;
  image?: string | null;
  type?: string | null;
  category: SimpleRef;
  unitCategory: SimpleRef;
  manufacturer?: SimpleRef | null;
  defaultUom?: UomRef | null;
  purchaseUom?: UomRef | null;
  packSize?: string | null;
  purchasePrice: number;
  sellingPrice: number;
  markupPercentage: number;
  quantity: number;
  minLevel: number;
  maxLevel: number;
  status: string;
  batches?: Batch[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  productCode: string;
  genericName?: string;
  description?: string;
  categoryId: string;
  unitCategoryId: string;
  manufacturerId?: string;
  defaultUomId?: string;
  purchaseUomId?: string;
  minLevel?: number;
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface PaginatedProducts {
  products: Product[];
  total: number;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  products: Product[];
}


export interface BinCardEntry {
  id: string;
  date: string;
  productId: string;
  batchId: string;
  documentNo: string;
  entityName: string;
  quantityIn: number;
  quantityOut: number;
  lossAdjustment: number;
  balance: number;
  unitPrice: string;
  remark: string;
  createdAt: string;
  product: Product;
  batch: Batch;
}

