/**
 * Billing API - POS billing operations
 */

import { ApiResponse, MedicineWithStock, InvoiceCreateRequest, InvoiceDetails, PendingInvoice } from '@/types';

const API_BASE = '/api/billing';

export const billingAPI = {
  /**
   * Search medicines for billing
   */
  async searchMedicines(query: string): Promise<ApiResponse<MedicineWithStock[]>> {
    try {
      const response = await fetch(`${API_BASE}/medicines/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to search medicines'
      };
    }
  },

  /**
   * Get medicine stock information
   */
  async getMedicineStock(medicineId: number): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE}/medicines/${medicineId}/stock`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get medicine stock'
      };
    }
  },

  /**
   * Create new invoice
   */
  async createInvoice(invoiceData: InvoiceCreateRequest): Promise<ApiResponse<{ invoice_id: number; message: string }>> {
    try {
      const response = await fetch(`${API_BASE}/invoices/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create invoice'
      };
    }
  },

  /**
   * Get all pending invoices
   */
  async getPendingInvoices(): Promise<ApiResponse<PendingInvoice[]>> {
    try {
      const response = await fetch(`${API_BASE}/invoices/pending`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get pending invoices'
      };
    }
  },

  /**
   * Finalize a pending invoice
   */
  async finalizeInvoice(invoiceId: number, paymentMethod: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE}/invoices/${invoiceId}/finalize`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment_method: paymentMethod }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to finalize invoice'
      };
    }
  },

  /**
   * Get invoice details
   */
  async getInvoiceDetails(invoiceId: number): Promise<ApiResponse<InvoiceDetails>> {
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
   * Print invoice (get HTML)
   */
  async printInvoice(invoiceId: number): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE}/invoices/${invoiceId}/print`);
      if (response.ok) {
        return await response.text();
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Download invoice as PDF
   */
  async downloadInvoicePDF(invoiceId: number): Promise<Blob | null> {
    try {
      const response = await fetch(`${API_BASE}/invoices/${invoiceId}/pdf`);
      if (response.ok) {
        return await response.blob();
      }
      return null;
    } catch (error) {
      return null;
    }
  }
};