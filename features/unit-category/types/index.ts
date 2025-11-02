export interface UnitCategory {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnitCategoryDto {
  name: string;
  description: string;
}

export interface UpdateUnitCategoryDto {
  name?: string;
  description?: string;
}

export interface PaginatedUnitCategories {
  data: UnitCategory[];
  total: number;
}

