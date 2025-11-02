export interface UnitCategory {
  id: string;
  name: string;
  description: string;
}

export interface UnitOfMeasure {
  id: string;
  name: string;
  abbreviation?: string;
  conversionRate: string;
  baseUnit: boolean;
  unitCategoryId: string;
  unitCategory?: UnitCategory;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUnitOfMeasureDto {
  name: string;
  abbreviation?: string;
  conversionRate: string;
  baseUnit: boolean;
  unitCategoryId: string;
}

export interface UpdateUnitOfMeasureDto {
  name?: string;
  abbreviation?: string;
  conversionRate?: string;
  baseUnit?: boolean;
  unitCategoryId?: string;
}

export interface PaginatedUnitOfMeasures {
  data: UnitOfMeasure[];
  total: number;
}

