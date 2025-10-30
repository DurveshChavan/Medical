/**
 * Suppliers API
 * =============
 * Handles all supplier-related API calls.
 */

import { Supplier, SupplierStats, SuppliedMedicine, PurchaseOrder, ApiResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class SuppliersAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/suppliers`;
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
   * Get all suppliers with pagination
   */
  async getAllSuppliers(
    page: number = 1,
    limit: number = 50,
    activeOnly: boolean = true
  ): Promise<ApiResponse<{ data: Supplier[]; pagination: any }>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      active_only: activeOnly.toString(),
    });

    return this.request<{ data: Supplier[]; pagination: any }>(`/?${params}`);
  }

  /**
   * Search suppliers by query
   */
  async searchSuppliers(
    query: string,
    activeOnly: boolean = true
  ): Promise<ApiResponse<Supplier[]>> {
    const params = new URLSearchParams({
      query,
      active_only: activeOnly.toString(),
    });

    return this.request<Supplier[]>(`/search?${params}`);
  }

  /**
   * Get supplier by ID
   */
  async getSupplierById(supplierId: number): Promise<ApiResponse<Supplier>> {
    return this.request<Supplier>(`/${supplierId}`);
  }

  /**
   * Create a new supplier
   */
  async createSupplier(data: Partial<Supplier>): Promise<ApiResponse<Supplier>> {
    return this.request<Supplier>('/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update supplier information
   */
  async updateSupplier(
    supplierId: number,
    data: Partial<Supplier>
  ): Promise<ApiResponse<Supplier>> {
    return this.request<Supplier>(`/${supplierId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete supplier (soft delete)
   */
  async deleteSupplier(supplierId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/${supplierId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get supplier statistics
   */
  async getSupplierStatistics(supplierId: number): Promise<ApiResponse<SupplierStats>> {
    return this.request<SupplierStats>(`/${supplierId}/statistics`);
  }

  /**
   * Get supplier purchase history
   */
  async getSupplierPurchaseHistory(
    supplierId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<{ data: PurchaseOrder[]; pagination: any }>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return this.request<{ data: PurchaseOrder[]; pagination: any }>(
      `/${supplierId}/purchase_history?${params}`
    );
  }

  /**
   * Get medicines supplied by this supplier
   */
  async getSupplierMedicines(supplierId: number): Promise<ApiResponse<SuppliedMedicine[]>> {
    return this.request<SuppliedMedicine[]>(`/${supplierId}/medicines`);
  }

  /**
   * Get pending orders for this supplier
   */
  async getSupplierPendingOrders(supplierId: number): Promise<ApiResponse<PurchaseOrder[]>> {
    return this.request<PurchaseOrder[]>(`/${supplierId}/pending_orders`);
  }
}

// Export singleton instance
export const suppliersAPI = new SuppliersAPI();