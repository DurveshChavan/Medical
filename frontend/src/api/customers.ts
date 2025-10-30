/**
 * Customers API - Customer management and credit operations
 */

import { ApiResponse, Customer, CustomerStats } from '@/types';

const API_BASE = '/api/customers';

export interface CustomerUpdateRequest {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  date_of_birth?: string;
  gender?: string;
  is_active_customer?: boolean;
}

export interface CreditPaymentRequest {
  amount: number;
  payment_method: string;
}

export interface CreditSummary {
  outstanding_credit: number;
  payment_status: string;
  has_outstanding_credit: boolean;
}

export const customersAPI = {
  /**
   * Search customers
   */
  async searchCustomers(query: string): Promise<ApiResponse<Customer[]>> {
    try {
      const response = await fetch(`${API_BASE}/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to search customers'
      };
    }
  },

  /**
   * Get all customers
   */
  async getAllCustomers(): Promise<ApiResponse<Customer[]>> {
    try {
      const response = await fetch(`${API_BASE}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get customers'
      };
    }
  },

  /**
   * Get customer by ID
   */
  async getCustomerById(customerId: number): Promise<ApiResponse<Customer>> {
    try {
      const response = await fetch(`${API_BASE}/${customerId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get customer'
      };
    }
  },

  /**
   * Create new customer
   */
  async createCustomer(customerData: Partial<Customer>): Promise<ApiResponse<Customer>> {
    try {
      const response = await fetch(`${API_BASE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create customer'
      };
    }
  },

  /**
   * Update customer
   */
  async updateCustomer(customerId: number, customerData: CustomerUpdateRequest): Promise<ApiResponse<Customer>> {
    try {
      const response = await fetch(`${API_BASE}/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update customer'
      };
    }
  },

  /**
   * Delete customer
   */
  async deleteCustomer(customerId: number): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE}/${customerId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete customer'
      };
    }
  },

  /**
   * Get customer statistics
   */
  async getCustomerStatistics(customerId: number): Promise<ApiResponse<CustomerStats>> {
    try {
      const response = await fetch(`${API_BASE}/${customerId}/statistics`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get customer statistics'
      };
    }
  },

  /**
   * Process credit payment
   */
  async payCredit(customerId: number, paymentData: CreditPaymentRequest): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE}/${customerId}/pay_credit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to process credit payment'
      };
    }
  },

  /**
   * Get customer credit summary
   */
  async getCreditSummary(customerId: number): Promise<ApiResponse<CreditSummary>> {
    try {
      const response = await fetch(`${API_BASE}/${customerId}/credit_summary`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get credit summary'
      };
    }
  }
};