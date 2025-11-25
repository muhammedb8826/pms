import axios from 'axios';
import type { CreateProductDto, PaginatedProducts, Product, UpdateProductDto } from '@/types/product';
import { API_BASE_URL } from '@/lib/config/api';

class ProductService {
  private getAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    } as Record<string, string>;
  }

  async createProduct(data: CreateProductDto): Promise<Product> {
    const response = await axios.post(`${API_BASE_URL}/products`, data, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async getProducts(
    page = 1,
    limit = 10,
    params?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }
  ): Promise<PaginatedProducts> {
    const q = new URLSearchParams();
    q.set('page', String(page));
    q.set('limit', String(limit));
    if (params?.search) q.set('search', params.search);
    if (params?.sortBy) q.set('sortBy', params.sortBy);
    if (params?.sortOrder) q.set('sortOrder', params.sortOrder);
    const response = await axios.get(`${API_BASE_URL}/products?${q.toString()}`, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async getAllProducts(params?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }): Promise<Product[]> {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.sortBy) q.set('sortBy', params.sortBy);
    if (params?.sortOrder) q.set('sortOrder', params.sortOrder);
    const response = await axios.get(`${API_BASE_URL}/products/all?${q.toString()}`, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async getProduct(id: string): Promise<Product> {
    const response = await axios.get(`${API_BASE_URL}/products/${id}`, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
    const response = await axios.patch(`${API_BASE_URL}/products/${id}`, data, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async deleteProduct(id: string): Promise<Product> {
    const response = await axios.delete(`${API_BASE_URL}/products/${id}`, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async importProducts(file: File): Promise<{ imported: number; errors?: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    const headers = { ...this.getAuthHeaders(), 'Content-Type': 'multipart/form-data' } as Record<string, string>;
    const response = await axios.post(`${API_BASE_URL}/products/import`, formData, { headers });
    return response.data;
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const response = await axios.get(`${API_BASE_URL}/products/category/${categoryId}`, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async getProductsByManufacturer(manufacturerId: string): Promise<Product[]> {
    const response = await axios.get(`${API_BASE_URL}/products/manufacturer/${manufacturerId}`, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async getLowStockProducts(): Promise<Product[]> {
    const response = await axios.get(`${API_BASE_URL}/products/low-stock`, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async uploadProductImage(id: string, file: File): Promise<Product> {
    const formData = new FormData();
    formData.append('file', file);
    const headers = { ...this.getAuthHeaders(), 'Content-Type': 'multipart/form-data' } as Record<string, string>;
    delete headers['Content-Type']; // Let axios set it automatically with boundary
    const response = await axios.post(`${API_BASE_URL}/products/${id}/image`, formData, { headers });
    return response.data;
  }
}

export const productService = new ProductService();


