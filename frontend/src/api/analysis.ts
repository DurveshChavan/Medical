import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export interface SeasonalSummary {
  seasonal_breakdown: Record<string, {
    Total_Quantity: number;
    Total_Revenue_INR: number;
    Unique_Invoices: number;
    Unique_Medicines: number;
  }>;
  total_records: number;
  date_range: {
    start: string;
    end: string;
  };
  unique_medicines: number;
  total_revenue: number;
  total_quantity: number;
}

export interface TopMedicine {
  rank: number;
  medicine_name: string;
  quantity_sold: number;
  total_revenue: number;
  avg_unit_price: number;
  unique_orders: number;
}

export interface Recommendation {
  rank: number;
  medicine_name: string;
  last_season_sales: number;
  suggested_stock_quantity: number;
  daily_avg_sales: number;
  total_revenue: number;
  avg_unit_price: number;
  unique_orders: number;
  is_fast_mover: boolean;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface RecommendationsData {
  recommendations: Recommendation[];
  summary: {
    total_medicines: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
    fast_movers: number;
    total_investment: number;
    total_units: number;
  };
  top_10: Recommendation[];
  fast_movers: Recommendation[];
}

export interface MedicineTrend {
  medicine_name: string;
  total_quantity: number;
  total_revenue: number;
  weekly_trend: Record<string, number>;
  avg_weekly_sales: number;
  peak_week: string | null;
  peak_quantity: number;
}

export interface CategoryAnalysis {
  category_breakdown: Record<string, {
    quantity: number;
    total_sales: number;
    medicine_name_clean: number;
    invoice_id: number;
  }>;
  top_categories: Record<string, any>;
  total_categories: number;
}

export interface OrderingGuide {
  season: string;
  guide: string;
  recommendations: RecommendationsData;
}

export interface CompleteAnalysis {
  seasonal_summary: SeasonalSummary;
  recommendations: Record<string, RecommendationsData>;
  trends: MedicineTrend[];
  category_analysis: CategoryAnalysis;
  generated_at: string;
}

export const analysisAPI = {
  // Get seasonal sales summary
  getSeasonalSummary: async (): Promise<SeasonalSummary> => {
    const response = await axios.get(`${API_BASE_URL}/analysis/seasonal-summary`);
    return response.data.data;
  },

  // Get top medicines for a season
  getTopMedicines: async (season: string, topN: number = 10): Promise<TopMedicine[]> => {
    const response = await axios.get(`${API_BASE_URL}/analysis/top-medicines/${season}?top_n=${topN}`);
    return response.data.medicines;
  },

  // Get seasonal recommendations
  getRecommendations: async (season: string, buffer: number = 0.15): Promise<RecommendationsData> => {
    const response = await axios.get(`${API_BASE_URL}/analysis/recommendations/${season}?buffer=${buffer}`);
    return response.data.recommendations;
  },

  // Get medicine trends
  getTrends: async (topN: number = 5): Promise<MedicineTrend[]> => {
    const response = await axios.get(`${API_BASE_URL}/analysis/trends?top_n=${topN}`);
    return response.data.trends;
  },

  // Get category analysis
  getCategoryAnalysis: async (): Promise<CategoryAnalysis> => {
    const response = await axios.get(`${API_BASE_URL}/analysis/categories`);
    return response.data.analysis;
  },

  // Get ordering guide
  getOrderingGuide: async (season: string): Promise<OrderingGuide> => {
    const response = await axios.get(`${API_BASE_URL}/analysis/ordering-guide/${season}`);
    return {
      season: response.data.season,
      guide: response.data.guide,
      recommendations: response.data.recommendations
    };
  },

  // Get complete analysis
  getCompleteAnalysis: async (): Promise<CompleteAnalysis> => {
    const response = await axios.get(`${API_BASE_URL}/analysis/complete`);
    return response.data.results;
  },

  // Enhanced Analytics endpoints
  getSeasonalPerformers: async (): Promise<any[]> => {
    const response = await axios.get(`${API_BASE_URL}/analysis/seasonal-performers`);
    return response.data.data;
  },

  getFastMovers: async (): Promise<any[]> => {
    const response = await axios.get(`${API_BASE_URL}/analysis/fast-movers`);
    return response.data.data;
  },

  getEnhancedMedicines: async (): Promise<any[]> => {
    const response = await axios.get(`${API_BASE_URL}/analysis/enhanced-medicines`);
    return response.data.data;
  },

  getWeekPlans: async (): Promise<any[]> => {
    const response = await axios.get(`${API_BASE_URL}/analysis/week-plans`);
    return response.data.data;
  },


  // Dashboard specific endpoints

  getDetailedSeasonalAnalysis: async (season: string): Promise<{
    data: {
      season: string;
      timeline: {
        duration: string;
        order_deadline: string;
        peak_period: string;
        months: number[];
      };
      inventory_requirements: {
        total_medicines: number;
        total_units: number;
        estimated_investment: number;
        daily_avg_sales: number;
      };
      priority_breakdown: {
        critical: { count: number; investment: number; percentage: number };
        high: { count: number; investment: number; percentage: number };
        medium: { count: number; investment: number; percentage: number };
        low: { count: number; investment: number; percentage: number };
      };
      critical_actions: string[];
      top_5_medicines: Array<{
        name: string;
        category: string;
        order_quantity: number;
        estimated_cost: number;
        daily_need: number;
        priority: string;
        current_stock: number;
        reorder_level: number;
      }>;
      ordering_calendar: Array<{
        period: string;
        action: string;
        medicines: number;
        quantity: number;
        budget: number;
      }>;
      current_season: string;
    };
  }> => {
    const response = await axios.get(`${API_BASE_URL}/analysis/detailed-seasonal-analysis/${season}`);
    return response.data;
  },

  getSalesPerformance: async (): Promise<any[]> => {
    const response = await axios.get(`${API_BASE_URL}/analysis/sales-performance`);
    return response.data.data;
  },

  // Get daily sales data for time series charts
  getDailySales: async (period: string = '30'): Promise<{
    data: Array<{
      date: string;
      revenue: number;
      quantity: number;
      transactions: number;
    }>;
    period: string;
    total_days: number;
    date_range: {
      start: string;
      end: string;
    };
  }> => {
    const response = await axios.get(`${API_BASE_URL}/analysis/daily-sales?period=${period}`);
    return response.data;
  },

  // Get KPI metrics from real database data
  getKPIMetrics: async (): Promise<{
    total_revenue: number;
    total_quantity: number;
    unique_medicines: number;
    total_transactions: number;
    avg_daily_revenue: number;
    growth_rate: number;
    top_medicine_revenue: number;
    date_range: {
      start: string;
      end: string;
    };
    recent_performance: {
      recent_revenue: number;
      previous_revenue: number;
    };
  }> => {
    const response = await axios.get(`${API_BASE_URL}/analysis/kpi-metrics`);
    return response.data.data;
  },

  // Get comprehensive seasonal data for a specific season
  getSeasonalData: async (season: string): Promise<{
    seasonal_performers: Array<{
      medicine: string;
      summer?: number;
      monsoon?: number;
      winter?: number;
      total: number;
    }>;
    fast_movers: Array<{
      id: string;
      medicine: string;
      currentStock: number;
      demandRate: number;
      daysUntilOut: number;
      urgency: 'critical' | 'high' | 'medium';
      suggestedOrder: number;
    }>;
    top_medicines: Array<{
      rank: number;
      medicine_name: string;
      quantity_sold: number;
      total_revenue: number;
      unique_orders: number;
      avg_price: number;
    }>;
    enhanced_medicines: Array<{
      id: number;
      name: string;
      category: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      suggestedStock: number;
      estimatedCost: number;
      currentStock: number;
      stockStatus: 'out' | 'low' | 'adequate';
    }>;
    week_plans: Array<{
      week: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      items: string[];
      estimatedCost: number;
      status: 'pending' | 'in-progress' | 'completed';
    }>;
  }> => {
    const response = await axios.get(`${API_BASE_URL}/analysis/seasonal-data/${season}`);
    return response.data.data;
  },

  // ==================== INVENTORY MANAGEMENT API ====================

  // Get all inventory data
  getInventory: async (): Promise<{
    data: Array<{
      inventory_id: number;
      medicine_id: number;
      medicine_name: string;
      category: string;
      supplier_name: string;
      batch_number: string;
      expiry_date: string;
      quantity_in_stock: number;
      purchase_price_per_unit: number;
      selling_price_per_unit: number;
      reorder_level: number;
      last_restocked_date: string;
      created_at: string;
      updated_at: string;
      stock_status: 'out_of_stock' | 'low_stock' | 'medium_stock' | 'adequate_stock';
    }>;
    total_count: number;
  }> => {
    const response = await axios.get(`${API_BASE_URL}/inventory`);
    return response.data;
  },

  // Get specific inventory item
  getInventoryItem: async (inventoryId: number): Promise<{
    inventory_id: number;
    medicine_id: number;
    medicine_name: string;
    category: string;
    supplier_name: string;
    batch_number: string;
    expiry_date: string;
    quantity_in_stock: number;
    purchase_price_per_unit: number;
    selling_price_per_unit: number;
    reorder_level: number;
    last_restocked_date: string;
  }> => {
    const response = await axios.get(`${API_BASE_URL}/inventory/${inventoryId}`);
    return response.data.data;
  },

  // Add new inventory item
  addInventoryItem: async (item: {
    medicine_id: number;
    supplier_id: number;
    batch_number: string;
    expiry_date: string;
    quantity_in_stock: number;
    purchase_price_per_unit: number;
    selling_price_per_unit: number;
    reorder_level?: number;
    last_restocked_date?: string;
  }): Promise<{
    success: boolean;
    message: string;
    inventory_id?: number;
  }> => {
    const response = await axios.post(`${API_BASE_URL}/inventory`, item);
    return response.data;
  },

  // Update inventory item
  updateInventoryItem: async (inventoryId: number, updates: {
    quantity_in_stock?: number;
    purchase_price_per_unit?: number;
    selling_price_per_unit?: number;
    reorder_level?: number;
    last_restocked_date?: string;
  }): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await axios.put(`${API_BASE_URL}/inventory/${inventoryId}`, updates);
    return response.data;
  },

  // Delete inventory item
  deleteInventoryItem: async (inventoryId: number): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await axios.delete(`${API_BASE_URL}/inventory/${inventoryId}`);
    return response.data;
  },

  // Get medicines list for inventory
  getMedicinesForInventory: async (): Promise<Array<{
    medicine_id: number;
    medicine_name: string;
    category: string;
  }>> => {
    const response = await axios.get(`${API_BASE_URL}/inventory/medicines`);
    return response.data.data;
  },

  // Get suppliers list for inventory
  getSuppliersForInventory: async (): Promise<Array<{
    supplier_id: number;
    supplier_name: string;
    contact_person: string;
    phone: string;
  }>> => {
    const response = await axios.get(`${API_BASE_URL}/inventory/suppliers`);
    return response.data.data;
  },

  // Get immediate actions for dashboard
  getImmediateActions: async (): Promise<Array<{
    id: string;
    title: string;
    description: string;
    urgency: 'critical' | 'high' | 'medium' | 'low';
    medicine_name: string;
    category: string;
    current_stock: number;
    reorder_level: number;
    estimated_cost: number;
    timestamp: string;
  }>> => {
    const response = await axios.get(`${API_BASE_URL}/analysis/immediate-actions`);
    return response.data.data;
  },

  // Get priority distribution for dashboard
  getPriorityDistribution: async (): Promise<{
    distribution: Array<{
      priority: string;
      count: number;
      percentage: number;
      revenue: number;
      revenue_percentage: number;
    }>;
    total_medicines: number;
    total_revenue: number;
  }> => {
    const response = await axios.get(`${API_BASE_URL}/analysis/priority-distribution`);
    return response.data.data;
  },

  // Get recent activity for dashboard
  getRecentActivity: async (): Promise<Array<{
    id: string;
    type: 'sales_update' | 'inventory_update' | 'data_loaded' | 'forecast_updated' | 'inventory_synced' | 'analysis_completed' | 'system_update';
    message: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error' | 'info';
  }>> => {
    const response = await axios.get(`${API_BASE_URL}/analysis/recent-activity`);
    return response.data.data;
  },

  // ==================== ADVANCED ANALYTICS API ====================

  // Get advanced analytics with time-series forecasting
  getAdvancedAnalytics: async (topN: number = 3): Promise<{
    success: boolean;
    top_n: number;
    medicines: Array<{
      medicine_id: number;
      medicine_name: string;
      total_quantity: number;
      sales_trends: {
        dates: string[];
        quantities: number[];
        seasons: string[];
      };
      sarima_forecast: {
        success: boolean;
        error?: string;
        historical_dates: string[];
        historical_quantities: number[];
        forecast_dates: string[];
        forecast_values: number[];
        lower_bound: number[];
        upper_bound: number[];
      };
      prophet_forecast: {
        success: boolean;
        error?: string;
        dates: string[];
        actual: (number | null)[];
        forecast: number[];
        lower: (number | null)[];
        upper: (number | null)[];
        yearly_seasonality: number[];
      };
    }>;
  }> => {
    const response = await axios.get(`${API_BASE_URL}/analysis/advanced-analytics?top_n=${topN}`);
    return response.data;
  }
};

export default analysisAPI;
