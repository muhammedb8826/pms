export interface UnitOfMeasure {
  id: string;
  name: string;
  abbreviation?: string;
  conversionRate: number;
}

export interface CreateUnitOfMeasureDto {
  name: string;
  abbreviation?: string;
  conversionRate?: number;
}

export interface UpdateUnitOfMeasureDto {
  name?: string;
  abbreviation?: string;
  conversionRate?: number;
}

export interface PaginatedUnitOfMeasures {
  unitOfMeasures: UnitOfMeasure[];
  total: number;
}


