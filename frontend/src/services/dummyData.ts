/* ========================================
   DUMMY DATA - For Development & Testing
   ======================================== */

import type {
  SalesData,
  DashboardStats,
  SeasonalAnalysis,
  InventoryItem,
  KPIMetric
} from '@/types';

export const dummyDashboardStats: DashboardStats = {
  total_revenue: 1245670,
  total_sales: 55234,
  total_medicines: 487,
  low_stock_items: 23,
  revenue_change: 12.5,
  sales_change: 8.3
};

export const dummyKPIMetrics: KPIMetric[] = [
  {
    label: 'Total Revenue',
    value: '₹12.45L',
    change: 12.5,
    changeType: 'increase',
    icon: 'TrendingUp',
    color: 'var(--chart-5)'
  },
  {
    label: 'Total Sales',
    value: '55,234',
    change: 8.3,
    changeType: 'increase',
    icon: 'ShoppingCart',
    color: 'var(--primary)'
  },
  {
    label: 'Total Medicines',
    value: '487',
    change: 0,
    changeType: 'neutral',
    icon: 'Package',
    color: 'var(--secondary)'
  },
  {
    label: 'Low Stock Alerts',
    value: '23',
    change: -15.2,
    changeType: 'decrease',
    icon: 'AlertTriangle',
    color: 'var(--accent)'
  }
];

export const dummySalesData: SalesData[] = [
  { date: '2024-01', sales: 4235, revenue: 98450, transactions: 1234 },
  { date: '2024-02', sales: 4567, revenue: 105230, transactions: 1345 },
  { date: '2024-03', sales: 5123, revenue: 125670, transactions: 1567 },
  { date: '2024-04', sales: 4876, revenue: 118900, transactions: 1456 },
  { date: '2024-05', sales: 5234, revenue: 132450, transactions: 1678 },
  { date: '2024-06', sales: 5678, revenue: 145230, transactions: 1789 },
  { date: '2024-07', sales: 6123, revenue: 158900, transactions: 1923 },
  { date: '2024-08', sales: 5890, revenue: 149870, transactions: 1845 },
  { date: '2024-09', sales: 5456, revenue: 138760, transactions: 1723 },
  { date: '2024-10', sales: 5234, revenue: 132450, transactions: 1654 }
];

export const dummySeasonalAnalysis: SeasonalAnalysis[] = [
  {
    season: 'Summer',
    medicines: [
      { id: 1, name: 'ORS', category: 'Electrolytes', stock: 234, price: 12.5, seasonal_demand: 'Summer' },
      { id: 2, name: 'Sunscreen Lotion', category: 'Skincare', stock: 156, price: 350, seasonal_demand: 'Summer' },
      { id: 3, name: 'Anti-dehydration Salts', category: 'Supplements', stock: 189, price: 25, seasonal_demand: 'Summer' }
    ],
    demand_score: 87.5,
    recommendations: [
      'Increase ORS stock by 40%',
      'Order more sunscreen products',
      'Promote heat-related healthcare products'
    ]
  },
  {
    season: 'Monsoon',
    medicines: [
      { id: 4, name: 'Antibiotic Tablets', category: 'Antibiotics', stock: 345, price: 125, seasonal_demand: 'Monsoon' },
      { id: 5, name: 'Anti-fungal Cream', category: 'Dermatology', stock: 167, price: 185, seasonal_demand: 'Monsoon' },
      { id: 6, name: 'Mosquito Repellent', category: 'Prevention', stock: 278, price: 95, seasonal_demand: 'Monsoon' }
    ],
    demand_score: 92.3,
    recommendations: [
      'Stock up on anti-malarial medications',
      'Increase antifungal product inventory',
      'Promote waterborne disease prevention'
    ]
  },
  {
    season: 'Winter',
    medicines: [
      { id: 7, name: 'Cough Syrup', category: 'Respiratory', stock: 423, price: 145, seasonal_demand: 'Winter' },
      { id: 8, name: 'Vitamin C Tablets', category: 'Vitamins', stock: 567, price: 85, seasonal_demand: 'Winter' },
      { id: 9, name: 'Cold Relief Tablets', category: 'Cold & Flu', stock: 389, price: 65, seasonal_demand: 'Winter' }
    ],
    demand_score: 95.8,
    recommendations: [
      'Prepare for high demand of cold & flu medications',
      'Stock vitamin supplements',
      'Increase respiratory care products'
    ]
  },
  {
    season: 'All Season',
    medicines: [
      { id: 10, name: 'Paracetamol', category: 'Pain Relief', stock: 1234, price: 15, seasonal_demand: 'All Season' },
      { id: 11, name: 'Bandages', category: 'First Aid', stock: 567, price: 25, seasonal_demand: 'All Season' },
      { id: 12, name: 'Hand Sanitizer', category: 'Hygiene', stock: 789, price: 55, seasonal_demand: 'All Season' }
    ],
    demand_score: 78.4,
    recommendations: [
      'Maintain steady stock levels',
      'Regular restocking schedule',
      'Monitor for any seasonal spikes'
    ]
  }
];

export const dummyInventory: InventoryItem[] = [
  {
    id: 1,
    name: 'Paracetamol 500mg',
    category: 'Pain Relief',
    stock: 1234,
    price: 15,
    status: 'In Stock',
    supplier: 'PharmaCorp Ltd',
    last_restocked: '2024-09-15',
    expiry_date: '2025-12-31',
    reorder_point: 500
  },
  {
    id: 2,
    name: 'Amoxicillin 250mg',
    category: 'Antibiotics',
    stock: 156,
    price: 125,
    status: 'Low Stock',
    supplier: 'MediSupply Inc',
    last_restocked: '2024-08-20',
    expiry_date: '2025-08-20',
    reorder_point: 200
  },
  {
    id: 3,
    name: 'Vitamin D3',
    category: 'Vitamins',
    stock: 45,
    price: 285,
    status: 'Low Stock',
    supplier: 'HealthPlus',
    last_restocked: '2024-07-10',
    expiry_date: '2026-01-15',
    reorder_point: 100
  },
  {
    id: 4,
    name: 'Cough Syrup',
    category: 'Respiratory',
    stock: 567,
    price: 145,
    status: 'In Stock',
    supplier: 'WellCare Pharma',
    last_restocked: '2024-09-25',
    expiry_date: '2025-09-25',
    reorder_point: 300
  },
  {
    id: 5,
    name: 'Insulin Injection',
    category: 'Diabetes',
    stock: 0,
    price: 850,
    status: 'Out of Stock',
    supplier: 'DiabetesCare Co',
    last_restocked: '2024-06-01',
    expiry_date: '2024-12-01',
    reorder_point: 50
  }
];

export const dummyCategoryDistribution = [
  { name: 'Pain Relief', value: 28, count: 45, color: 'var(--chart-1)' },
  { name: 'Antibiotics', value: 22, count: 38, color: 'var(--chart-2)' },
  { name: 'Vitamins', value: 15, count: 62, color: 'var(--chart-3)' },
  { name: 'Respiratory', value: 12, count: 29, color: 'var(--chart-4)' },
  { name: 'Diabetes', value: 10, count: 15, color: 'var(--chart-5)' },
  { name: 'Cardiovascular', value: 8, count: 24, color: 'var(--chart-6)' },
  { name: 'Others', value: 5, count: 34, color: 'var(--chart-7)' }
];

export const dummySeasonalTrends = [
  { month: 'Jan', Summer: 120, Monsoon: 230, Winter: 450, AllSeason: 320 },
  { month: 'Feb', Summer: 140, Monsoon: 210, Winter: 480, AllSeason: 335 },
  { month: 'Mar', Summer: 280, Monsoon: 180, Winter: 320, AllSeason: 350 },
  { month: 'Apr', Summer: 420, Monsoon: 150, Winter: 180, AllSeason: 340 },
  { month: 'May', Summer: 520, Monsoon: 140, Winter: 120, AllSeason: 360 },
  { month: 'Jun', Summer: 480, Monsoon: 280, Winter: 100, AllSeason: 370 },
  { month: 'Jul', Summer: 350, Monsoon: 520, Winter: 90, AllSeason: 355 },
  { month: 'Aug', Summer: 320, Monsoon: 580, Winter: 85, AllSeason: 365 },
  { month: 'Sep', Summer: 280, Monsoon: 450, Winter: 110, AllSeason: 360 },
  { month: 'Oct', Summer: 220, Monsoon: 280, Winter: 240, AllSeason: 350 },
  { month: 'Nov', Summer: 150, Monsoon: 180, Winter: 380, AllSeason: 345 },
  { month: 'Dec', Summer: 130, Monsoon: 160, Winter: 520, AllSeason: 340 }
];

/* ===== DUMMY API FUNCTIONS (Fallback when backend is unavailable) ===== */
export const useDummyData = true; // Toggle this to switch between real and dummy data

export const dummyAPI = {
  getDashboardStats: () => Promise.resolve(dummyDashboardStats),
  getSalesData: () => Promise.resolve(dummySalesData),
  getSeasonalAnalysis: () => Promise.resolve(dummySeasonalAnalysis),
  getInventory: () => Promise.resolve(dummyInventory),
  getLowStockItems: () => Promise.resolve(dummyInventory.filter(item => item.status === 'Low Stock')),
  getCategoryDistribution: () => Promise.resolve(dummyCategoryDistribution),
  getSeasonalTrends: () => Promise.resolve(dummySeasonalTrends)
};

export default dummyAPI;

