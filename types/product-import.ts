import type { Product } from '@/types/product';

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  products: Product[];
}


