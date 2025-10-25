import axios from 'axios';
import type { CreateManufacturerDto, Manufacturer, PaginatedManufacturers, UpdateManufacturerDto } from '@/types/manufacturer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pms-api.daminaa.org/api/v1';

class ManufacturerService {
  private getAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    } as Record<string, string>;
  }

  async createManufacturer(data: CreateManufacturerDto): Promise<Manufacturer> {
    const response = await axios.post(`${API_BASE_URL}/manufacturers`, data, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async getManufacturers(page = 1, limit = 10, params?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }): Promise<PaginatedManufacturers> {
    const q = new URLSearchParams();
    q.set('page', String(page));
    q.set('limit', String(limit));
    if (params?.search) q.set('search', params.search);
    if (params?.sortBy) q.set('sortBy', params.sortBy);
    if (params?.sortOrder) q.set('sortOrder', params.sortOrder);
    const response = await axios.get(`${API_BASE_URL}/manufacturers?${q.toString()}`, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async getAllManufacturers(params?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }): Promise<Manufacturer[]> {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.sortBy) q.set('sortBy', params.sortBy);
    if (params?.sortOrder) q.set('sortOrder', params.sortOrder);
    const response = await axios.get(`${API_BASE_URL}/manufacturers/all?${q.toString()}`, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async getManufacturer(id: string): Promise<Manufacturer> {
    const response = await axios.get(`${API_BASE_URL}/manufacturers/${id}`, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async updateManufacturer(id: string, data: UpdateManufacturerDto): Promise<Manufacturer> {
    const response = await axios.patch(`${API_BASE_URL}/manufacturers/${id}`, data, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async deleteManufacturer(id: string): Promise<Manufacturer> {
    const response = await axios.delete(`${API_BASE_URL}/manufacturers/${id}`, { headers: this.getAuthHeaders() });
    return response.data;
  }
}

export const manufacturerService = new ManufacturerService();


