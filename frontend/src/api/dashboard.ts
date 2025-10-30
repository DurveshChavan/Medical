/* ========================================
   DASHBOARD API MODULE
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

// Add request interceptor for auth
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ===== TYPES ===== */
export interface DashboardStats {
  totalRevenue: number;
  newCustomers: number;
  activeAccounts: number;
  growthRate: number;
  revenueChange?: number;
  customersChange?: number;
}

export interface VisitorData {
  date: string;
  value: number;
  value2?: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  visitors: VisitorData[];
}

/* ===== API FUNCTIONS ===== */

/**
 * Get dashboard KPI statistics
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const { data } = await api.get('/dashboard/stats');
    return data.data || data;
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    throw new Error('Failed to fetch dashboard statistics');
  }
};

/**
 * Get visitor analytics data
 */
export const getVisitorData = async (period: string = '30days'): Promise<VisitorData[]> => {
  try {
    const { data } = await api.get('/dashboard/sales', {
      params: { period }
    });
    return data.data || data;
  } catch (error: any) {
    console.error('Visitor data error:', error);
    throw new Error('Failed to fetch visitor data');
  }
};

/**
 * Get complete dashboard data (stats + visitors)
 */
export const getDashboardData = async (): Promise<DashboardResponse> => {
  try {
    const [stats, visitors] = await Promise.all([
      getDashboardStats(),
      getVisitorData()
    ]);
    
    return { stats, visitors };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch dashboard data');
  }
};

/**
 * Get top products/medicines
 */
export const getTopProducts = async (limit: number = 5): Promise<any[]> => {
  try {
    const { data } = await api.get('/dashboard/top-products', {
      params: { limit }
    });
    return data;
  } catch (error: any) {
    console.error('Top products error:', error);
    return [];
  }
};

export default api;

