import axios from 'axios';
import type { CreateUnitOfMeasureDto, PaginatedUnitOfMeasures, UnitOfMeasure, UpdateUnitOfMeasureDto } from '@/types/uom';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pms-api.daminaa.org/api/v1';

class UnitOfMeasureService {
  private getAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    } as Record<string, string>;
  }

  async createUnitOfMeasure(data: CreateUnitOfMeasureDto): Promise<UnitOfMeasure> {
    const response = await axios.post(`${API_BASE_URL}/unit-of-measures`, data, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async getUnitOfMeasures(page = 1, limit = 10, params?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }): Promise<PaginatedUnitOfMeasures> {
    const q = new URLSearchParams();
    q.set('page', String(page));
    q.set('limit', String(limit));
    if (params?.search) q.set('search', params.search);
    if (params?.sortBy) q.set('sortBy', params.sortBy);
    if (params?.sortOrder) q.set('sortOrder', params.sortOrder);
    const response = await axios.get(`${API_BASE_URL}/unit-of-measures?${q.toString()}`, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async getAllUnitOfMeasures(params?: { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }): Promise<UnitOfMeasure[]> {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.sortBy) q.set('sortBy', params.sortBy);
    if (params?.sortOrder) q.set('sortOrder', params.sortOrder);
    const response = await axios.get(`${API_BASE_URL}/unit-of-measures/all?${q.toString()}`, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async getUnitOfMeasure(id: string): Promise<UnitOfMeasure> {
    const response = await axios.get(`${API_BASE_URL}/unit-of-measures/${id}`, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async updateUnitOfMeasure(id: string, data: UpdateUnitOfMeasureDto): Promise<UnitOfMeasure> {
    const response = await axios.patch(`${API_BASE_URL}/unit-of-measures/${id}`, data, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async deleteUnitOfMeasure(id: string): Promise<UnitOfMeasure> {
    const response = await axios.delete(`${API_BASE_URL}/unit-of-measures/${id}`, { headers: this.getAuthHeaders() });
    return response.data;
  }
}

export const unitOfMeasureService = new UnitOfMeasureService();


