import axios from 'axios';
import type { Category, CreateCategoryDto, PaginatedCategories, UpdateCategoryDto } from '@/types/category';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://pms-api.daminaa.org/api/v1');

class CategoryService {
  private getAuthHeaders() {
    if (typeof window === 'undefined') return {} as Record<string, string>;
    const token = localStorage.getItem('accessToken');
    return {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    } as Record<string, string>;
  }

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    const response = await axios.post(
      `${API_BASE_URL}/categories`,
      data,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async getCategories(
    page = 1,
    limit = 10,
    params?: { search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<PaginatedCategories> {
    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('limit', String(limit));
    if (params?.search) query.set('search', params.search);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
    const response = await axios.get(
      `${API_BASE_URL}/categories?${query.toString()}`,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async getAllCategories(): Promise<Category[]> {
    const response = await axios.get(
      `${API_BASE_URL}/categories/all`,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async getCategory(id: string): Promise<Category> {
    const response = await axios.get(
      `${API_BASE_URL}/categories/${id}`,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async updateCategory(id: string, data: UpdateCategoryDto): Promise<Category> {
    const response = await axios.patch(
      `${API_BASE_URL}/categories/${id}`,
      data,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/categories/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }
}

export const categoryService = new CategoryService();


