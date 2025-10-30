/* ========================================
   SEASONAL ANALYSIS API MODULE
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
export type Season = 'Summer' | 'Monsoon' | 'Winter' | 'All Season';

export interface SeasonalMedicine {
  medicine: string;
  quantity: number;
  revenue?: number;
}

export interface TopMedicine {
  rank: number;
  medicineName: string;
  lastSeasonSales: number;
  suggestedStock: number;
  category?: string;
  growthRate?: number;
}

export interface FastMover {
  id: number;
  name: string;
  category: string;
  predictedSales: number;
  currentStock: number;
  daysUntilStockout: number;
}

export interface SeasonalDataResponse {
  season: Season;
  chartData: SeasonalMedicine[];
  topMedicines: TopMedicine[];
  fastMovers: FastMover[];
}

/* ===== API FUNCTIONS ===== */

/**
 * Get seasonal analysis data for a specific season
 */
export const getSeasonalData = async (season: Season): Promise<SeasonalDataResponse> => {
  try {
    const { data } = await api.get('/analysis/seasonal-data/' + season.toLowerCase(), {
      params: { season }
    });
    return data.data || data;
  } catch (error: any) {
    console.error('Seasonal data error:', error);
    throw new Error('Failed to fetch seasonal data');
  }
};

/**
 * Get seasonal recommendations
 */
export const getSeasonalRecommendations = async (season: Season): Promise<string[]> => {
  try {
    const { data } = await api.get(`/analysis/recommendations/${season.toLowerCase()}`, {
      params: { season }
    });
    return data.recommendations || [];
  } catch (error: any) {
    console.error('Seasonal recommendations error:', error);
    return [];
  }
};

/**
 * Get seasonal trends for all seasons
 */
export const getSeasonalTrends = async (): Promise<any[]> => {
  try {
    const { data } = await api.get('/analysis/trends');
    return data.data || data;
  } catch (error: any) {
    console.error('Seasonal trends error:', error);
    return [];
  }
};


export default api;

