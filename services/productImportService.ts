import axios from 'axios';
import type { ImportResult } from '@/types/product-import';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pms-api.daminaa.org/api/v1';

class ProductImportService {
  private getAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return {
      Authorization: token ? `Bearer ${token}` : '',
    } as Record<string, string>;
  }

  async downloadTemplate(): Promise<Blob> {
    const response = await axios.get(`${API_BASE_URL}/products/import/template`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob',
    });
    return response.data;
  }

  async importProducts(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    const headers = { ...this.getAuthHeaders(), 'Content-Type': 'multipart/form-data' } as Record<string, string>;
    const response = await axios.post(`${API_BASE_URL}/products/import/simple`, formData, { headers });
    return response.data;
  }
}

export const productImportService = new ProductImportService();


