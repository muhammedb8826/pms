export interface ProductSummary {
  id: string;
  name: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  products?: ProductSummary[];
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
}

export interface PaginatedCategories {
  categories: Category[];
  total: number;
}


