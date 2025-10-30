/**
 * Returns API - Medicine returns and refunds
 */

import { ApiResponse } from '@/types';

const API_BASE = '/api/returns';

export interface InvoiceForReturn {
  invoice_id: number;
  sale_date: string;
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  items: {
    sale_id: number;
    medicine_id: number;
    medicine_name: string;
    generic_name: string;
    brand: string;
    quantity_sold: number;
    unit_price_at_sale: number;
    total_amount: number;
  }[];
}

export interface ReturnRequest {
  sale_id: number;
  customer_id: number;
  medicine_id: number;
  quantity_returned: number;
  reason_for_return: string;
  refund_amount: number;
  processed_by?: number;
}

export interface RefundRequest {
  return_id: number;
  customer_id: number;
  payment_method: string;
  refund_amount: number;
  refund_reason: string;
  approved_by?: number;
}

export interface Return {
  return_id: number;
  sale_id: number;
  customer_id: number;
  customer_name: string;
  medicine_id: number;
  medicine_name: string;
  quantity_returned: number;
  reason_for_return: string;
  return_date: string;
  refund_amount: number;
  processed_by: number;
  created_at: string;
}

export interface Refund {
  refund_id: number;
  return_id: number;
  customer_id: number;
  customer_name: string;
  payment_method: string;
  refund_amount: number;
  refund_date: string;
  approved_by: number;
  refund_reason: string;
  created_at: string;
}

export const returnsAPI = {
  /**
   * Search invoices for return processing
   */
  async searchInvoices(query: string): Promise<ApiResponse<InvoiceForReturn[]>> {
    try {
      const response = await fetch(`${API_BASE}/invoices/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to search invoices'
      };
    }
  },

  /**
   * Get invoice details for return processing
   */
  async getInvoiceForReturn(invoiceId: number): Promise<ApiResponse<InvoiceForReturn>> {
    try {
      const response = await fetch(`${API_BASE}/invoices/${invoiceId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get invoice details'
      };
    }
  },

  /**
   * Create medicine return
   */
  async createReturn(returnData: ReturnRequest): Promise<ApiResponse<{ return_id: number; message: string }>> {
    try {
      const response = await fetch(`${API_BASE}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(returnData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create return'
      };
    }
  },

  /**
   * Process refund for a return
   */
  async processRefund(returnId: number, refundData: RefundRequest): Promise<ApiResponse<{ refund_id: number; message: string }>> {
    try {
      const response = await fetch(`${API_BASE}/${returnId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refundData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to process refund'
      };
    }
  },

  /**
   * Get return history
   */
  async getReturnHistory(customerId?: number): Promise<ApiResponse<Return[]>> {
    try {
      const url = customerId 
        ? `${API_BASE}/history?customer_id=${customerId}`
        : `${API_BASE}/history`;
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get return history'
      };
    }
  },

  /**
   * Get refund history
   */
  async getRefundHistory(customerId?: number): Promise<ApiResponse<Refund[]>> {
    try {
      const url = customerId 
        ? `${API_BASE}/refunds/history?customer_id=${customerId}`
        : `${API_BASE}/refunds/history`;
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get refund history'
      };
    }
  }
};