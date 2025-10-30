/* ========================================
   INVENTORY API MODULE
   ======================================== */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ===== TYPES ===== */
export interface InventoryItem {
  id: number;
  medicineName: string;
  category: string;
  stockQuantity: number;
  batchNo: string;
  expiryDate: string;
  manufacturer?: string;
  price?: number;
}

export interface InventoryFilters {
  search?: string;
  category?: string;
  stockStatus?: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock' | 'expiring-soon';
}

export interface InventoryStats {
  totalItems: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  expiringSoon: number;
}

/* ===== API FUNCTIONS ===== */

/**
 * Get inventory list with optional filters
 */
export const getInventory = async (filters?: InventoryFilters): Promise<InventoryItem[]> => {
  try {
    const { data } = await api.get('/inventory', { params: filters });
    console.log('🔍 Inventory API response:', data);
    
    // Handle different response formats
    if (data.success && Array.isArray(data.data)) {
      return data.data;
    } else if (Array.isArray(data)) {
      return data;
    } else {
      console.warn('Unexpected inventory data format:', data);
      return [];
    }
  } catch (error: any) {
    console.error('Inventory fetch error:', error);
    throw new Error('Failed to fetch inventory data');
  }
};

/**
 * Get inventory statistics
 */
export const getInventoryStats = async (): Promise<InventoryStats> => {
  try {
    const { data } = await api.get('/inventory/stats');
    return data;
  } catch (error: any) {
    console.error('Inventory stats error:', error);
    return {
      totalItems: 0,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
      expiringSoon: 0
    };
  }
};

/**
 * Get low stock items
 */
export const getLowStockItems = async (): Promise<InventoryItem[]> => {
  try {
    const { data } = await api.get('/inventory/low-stock');
    return data;
  } catch (error: any) {
    console.error('Low stock items error:', error);
    return [];
  }
};

/**
 * Get expiring items
 */
export const getExpiringItems = async (days: number = 60): Promise<InventoryItem[]> => {
  try {
    const { data } = await api.get('/inventory/expiring', {
      params: { days }
    });
    return data;
  } catch (error: any) {
    console.error('Expiring items error:', error);
    return [];
  }
};

/**
 * Update inventory item
 */
export const updateInventoryItem = async (
  id: number, 
  updates: Partial<InventoryItem>
): Promise<InventoryItem> => {
  try {
    const { data } = await api.put(`/inventory/${id}`, updates);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update inventory');
  }
};

/**
 * Get medicine by ID
 */
export const getMedicineById = async (id: number): Promise<InventoryItem> => {
  try {
    const { data } = await api.get(`/inventory/${id}`);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Medicine not found');
  }
};


export default api;

