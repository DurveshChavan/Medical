/* ========================================
   API SERVICE LAYER
   ======================================== */

import axios from 'axios';
import type {
  Medicine,
  SalesData,
  DashboardStats,
  SeasonalAnalysis,
  InventoryItem,
  UploadResponse
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/* ===== DASHBOARD APIs ===== */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await api.get('/dashboard/stats');
  return data;
};

export const getSalesData = async (period: string = 'month'): Promise<SalesData[]> => {
  const { data } = await api.get(`/dashboard/sales?period=${period}`);
  return data;
};

/* ===== SEASONAL ANALYSIS APIs ===== */
export const getSeasonalAnalysis = async (season?: string): Promise<SeasonalAnalysis[]> => {
  const { data } = await api.get('/seasonal/analysis', {
    params: { season }
  });
  return data;
};

export const getSeasonalData = async (season: string): Promise<any> => {
  const { data } = await api.get('/seasonal', {
    params: { season }
  });
  return data;
};

export const getSeasonalRecommendations = async (season: string): Promise<Medicine[]> => {
  const { data } = await api.get(`/seasonal/recommendations/${season}`);
  return data;
};

export const getTopMedicinesBySeason = async (season: string, limit: number = 10): Promise<Medicine[]> => {
  const { data } = await api.get(`/seasonal/top-medicines/${season}`, {
    params: { limit }
  });
  return data;
};

/* ===== INVENTORY APIs ===== */
export const getInventory = async (filters?: {
  category?: string;
  status?: string;
  search?: string;
}): Promise<InventoryItem[]> => {
  const { data } = await api.get('/inventory', { params: filters });
  return data;
};

export const getLowStockItems = async (): Promise<InventoryItem[]> => {
  const { data } = await api.get('/inventory/low-stock');
  return data;
};

export const updateInventory = async (id: number, updates: Partial<InventoryItem>): Promise<InventoryItem> => {
  const { data } = await api.put(`/inventory/${id}`, updates);
  return data;
};

export const getMedicineById = async (id: number): Promise<Medicine> => {
  const { data } = await api.get(`/inventory/${id}`);
  return data;
};

/* ===== DATA MANAGEMENT APIs ===== */
export const uploadSalesData = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const { data } = await api.post('/data/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const exportData = async (format: 'csv' | 'json' = 'csv'): Promise<Blob> => {
  const { data } = await api.get(`/data/export?format=${format}`, {
    responseType: 'blob',
  });
  return data;
};

export const rebuildDatabase = async (): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.post('/data/rebuild');
  return data;
};

/* ===== ANALYTICS APIs ===== */
export const getCategoryDistribution = async (): Promise<{ category: string; count: number; value: number }[]> => {
  const { data } = await api.get('/analytics/category-distribution');
  return data;
};

export const getSeasonalTrends = async (): Promise<any> => {
  const { data } = await api.get('/analytics/seasonal-trends');
  return data;
};

export default api;

