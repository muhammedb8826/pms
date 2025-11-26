import axios from 'axios';
import type { ImportResult } from '@/types/product-import';
import { API_BASE_URL } from '@/lib/config/api';

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
    // Backend expects POST /products/import with multipart/form-data and field name `file`
    const response = await axios.post(`${API_BASE_URL}/products/import`, formData, { headers });
    return response.data;
  }
}

export const productImportService = new ProductImportService();


