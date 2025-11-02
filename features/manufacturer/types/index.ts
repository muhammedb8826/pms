export interface Manufacturer {
  id: string;
  name: string;
  contact?: string;
  address?: string;
}

export interface CreateManufacturerDto {
  name: string;
  contact?: string;
  address?: string;
}

export interface UpdateManufacturerDto {
  name?: string;
  contact?: string;
  address?: string;
}

export interface PaginatedManufacturers {
  manufacturers: Manufacturer[];
  total: number;
}

