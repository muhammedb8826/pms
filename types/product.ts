export interface SimpleRef {
  id: string;
  name: string;
}

export interface Batch {
  id: string;
  code?: string;
  expiryDate?: string;
  quantity?: number;
}

export interface Product {
  id: string;
  name: string;
  genericName?: string;
  description?: string;
  type?: string;
  category: SimpleRef;
  manufacturer: SimpleRef;
  unitOfMeasure: SimpleRef;
  packSize?: string;
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
  genericName?: string;
  description?: string;
  type?: string;
  categoryId: string;
  manufacturerId: string;
  unitOfMeasureId: string;
  packSize?: string;
  purchasePrice: number;
  sellingPrice: number;
  markupPercentage?: number;
  quantity?: number;
  minLevel?: number;
  maxLevel?: number;
  status?: string;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface PaginatedProducts {
  products: Product[];
  total: number;
}


