/**
 * Manufacturers API
 * =================
 * Handles all manufacturer-related API calls.
 */

import { 
  Manufacturer, 
  ManufacturerStats, 
  ManufacturerMedicine, 
  ManufacturerInventory, 
  ApiResponse 
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ManufacturersAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/manufacturers`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Get all manufacturers with pagination
   */
  async getAllManufacturers(
    page: number = 1,
    limit: number = 50,
    activeOnly: boolean = true
  ): Promise<ApiResponse<{ data: Manufacturer[]; pagination: any }>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      active_only: activeOnly.toString(),
    });

    return this.request<{ data: Manufacturer[]; pagination: any }>(`/?${params}`);
  }

  /**
   * Search manufacturers by query
   */
  async searchManufacturers(
    query: string,
    activeOnly: boolean = true
  ): Promise<ApiResponse<Manufacturer[]>> {
    const params = new URLSearchParams({
      query,
      active_only: activeOnly.toString(),
    });

    return this.request<Manufacturer[]>(`/search?${params}`);
  }

  /**
   * Get manufacturer by ID
   */
  async getManufacturerById(manufacturerId: number): Promise<ApiResponse<Manufacturer>> {
    return this.request<Manufacturer>(`/${manufacturerId}`);
  }

  /**
   * Create a new manufacturer
   */
  async createManufacturer(data: Partial<Manufacturer>): Promise<ApiResponse<Manufacturer>> {
    return this.request<Manufacturer>('/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update manufacturer information
   */
  async updateManufacturer(
    manufacturerId: number,
    data: Partial<Manufacturer>
  ): Promise<ApiResponse<Manufacturer>> {
    return this.request<Manufacturer>(`/${manufacturerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete manufacturer (soft delete)
   */
  async deleteManufacturer(manufacturerId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/${manufacturerId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get manufacturer statistics
   */
  async getManufacturerStatistics(manufacturerId: number): Promise<ApiResponse<ManufacturerStats>> {
    return this.request<ManufacturerStats>(`/${manufacturerId}/statistics`);
  }

  /**
   * Get medicines manufactured by this manufacturer
   */
  async getManufacturerMedicines(manufacturerId: number): Promise<ApiResponse<ManufacturerMedicine[]>> {
    return this.request<ManufacturerMedicine[]>(`/${manufacturerId}/medicines`);
  }

  /**
   * Get inventory levels for manufacturer's medicines
   */
  async getManufacturerInventory(manufacturerId: number): Promise<ApiResponse<ManufacturerInventory[]>> {
    return this.request<ManufacturerInventory[]>(`/${manufacturerId}/inventory`);
  }
}

// Export singleton instance
export const manufacturersAPI = new ManufacturersAPI();