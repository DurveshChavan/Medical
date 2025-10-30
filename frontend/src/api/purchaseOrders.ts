/**
 * Purchase Orders API
 * ===================
 * Handles all purchase order-related API calls.
 */

import { 
  PurchaseOrder, 
  PurchaseOrderDetails, 
  CreatePurchaseOrderRequest, 
  ApiResponse 
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class PurchaseOrdersAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/purchase_orders`;
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
   * Create a new purchase order
   */
  async createPurchaseOrder(data: CreatePurchaseOrderRequest): Promise<ApiResponse<PurchaseOrderDetails>> {
    return this.request<PurchaseOrderDetails>('/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get all pending purchase orders
   */
  async getPendingOrders(
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<{ data: PurchaseOrder[]; pagination: any }>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return this.request<{ data: PurchaseOrder[]; pagination: any }>(`/pending?${params}`);
  }

  /**
   * Finalize a purchase order
   */
  async finalizePurchaseOrder(purchaseInvoiceId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/${purchaseInvoiceId}/finalize`, {
      method: 'PUT',
    });
  }

  /**
   * Get purchase order details
   */
  async getPurchaseOrderDetails(purchaseInvoiceId: number): Promise<ApiResponse<PurchaseOrderDetails>> {
    return this.request<PurchaseOrderDetails>(`/${purchaseInvoiceId}`);
  }

  /**
   * Get purchase orders for a specific supplier
   */
  async getSupplierPurchaseOrders(
    supplierId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<{ data: PurchaseOrder[]; pagination: any }>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return this.request<{ data: PurchaseOrder[]; pagination: any }>(
      `/supplier/${supplierId}?${params}`
    );
  }
}

// Export singleton instance
export const purchaseOrdersAPI = new PurchaseOrdersAPI();