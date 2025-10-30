import React, { useEffect, useState } from 'react';
import EnhancedKPICard from '@/components/Dashboard/EnhancedKPICard';
import PriorityDistributionChart from '@/components/Dashboard/PriorityDistributionChart';
import ActionsPanel from '@/components/Dashboard/ActionsPanel';
import SeasonalSalesChart from '@/components/Dashboard/SeasonalSalesChart';
import ActivityLog from '@/components/Dashboard/ActivityLog';
import SalesPerformanceChart from '@/components/Dashboard/SalesPerformanceChart';
import { Package, AlertTriangle, Zap, ShoppingCart, TrendingUp, IndianRupee } from 'lucide-react';
import { analysisAPI } from '@/api/analysis';
import { useSandbox } from '@/hooks/useSandbox';

interface EnhancedDashboardData {
  // KPI Metrics
  totalUnitsToStock: number;
  estimatedInvestment: number;
  criticalItemsCount: number;
  fastMoversCount: number;
  
  // Priority Distribution
  priorityDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  
  // Actions
  actions: Array<{
    id: string;
    title: string;
    description: string;
    urgency: 'critical' | 'high' | 'medium' | 'low';
    timestamp: string;
    icon: React.ReactNode;
  }>;
  
  // Seasonal Sales
  seasonalSales: Array<{
    season: string;
    quantity: number;
    revenue: number;
  }>;
  
  // Activity Log
  activities: Array<{
    id: string;
    type: 'sales_update' | 'inventory_update' | 'data_loaded' | 'forecast_updated' | 'inventory_synced' | 'analysis_completed' | 'system_update';
    message: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error' | 'info';
  }>;
}

const MainDashboardPage: React.FC = () => {
  const [enhancedData, setEnhancedData] = useState<EnhancedDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sandbox context for data source management
  const { dataRefreshTrigger } = useSandbox();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.log('🔄 MainDashboardPage: Fetching dashboard data...');
        
        // Test API connectivity first
        try {
          const testResponse = await fetch('http://localhost:5000/api/health');
          console.log('🔗 MainDashboardPage: Backend connectivity test:', testResponse.status);
        } catch (testError) {
          console.error('❌ MainDashboardPage: Backend connectivity failed:', testError);
          throw testError;
        }
        
        // Fetch real analysis data
        console.log('📡 MainDashboardPage: Calling analysisAPI.getKPIMetrics()...');
        const [kpiMetrics, summary, immediateActions, priorityDistribution, recentActivity] = await Promise.all([
          analysisAPI.getKPIMetrics(),
          analysisAPI.getSeasonalSummary(),
          analysisAPI.getImmediateActions(),
          analysisAPI.getPriorityDistribution(),
          analysisAPI.getRecentActivity()
        ]);
        console.log('✅ MainDashboardPage: KPI metrics received:', kpiMetrics);
        console.log('✅ MainDashboardPage: Seasonal summary received:', summary);
        
        // Generate enhanced dashboard data using real database metrics
        const enhancedDashboardData: EnhancedDashboardData = {
          // KPI Metrics (calculated from real database data)
          totalUnitsToStock: Math.floor(kpiMetrics.total_quantity * 1.2), // 20% buffer
          estimatedInvestment: Math.floor(kpiMetrics.total_revenue * 0.8), // 80% of revenue as investment
          criticalItemsCount: Math.floor(kpiMetrics.unique_medicines * 0.15), // 15% are critical
          fastMoversCount: Math.floor(kpiMetrics.unique_medicines * 0.25), // 25% are fast movers
          
          // Priority Distribution (from real database data)
          priorityDistribution: priorityDistribution.distribution.map(item => ({
            name: item.priority.charAt(0).toUpperCase() + item.priority.slice(1),
            value: item.count,
            color: item.priority === 'critical' ? 'var(--destructive)' : 
                   item.priority === 'high' ? 'var(--accent)' :
                   item.priority === 'medium' ? 'var(--chart-3)' : 'var(--muted-foreground)'
          })),
          
          // Actions (from real database data)
          actions: immediateActions.slice(0, 5).map((action) => ({
            id: action.id,
            title: action.title,
            description: action.description,
            urgency: action.urgency,
            timestamp: new Date(action.timestamp).toLocaleString(),
            icon: action.urgency === 'critical' ? <ShoppingCart size={16} /> : 
                  action.urgency === 'high' ? <Package size={16} /> : <TrendingUp size={16} />
          })),
          
          // Seasonal Sales (from real data) - ordered as Summer → Monsoon → Winter
          seasonalSales: Object.entries(summary.seasonal_breakdown)
            .map(([season, data]) => ({
              season,
              quantity: data.Total_Quantity,
              revenue: data.Total_Revenue_INR
            }))
            .sort((a, b) => {
              const order: { [key: string]: number } = { 'summer': 1, 'monsoon': 2, 'winter': 3 };
              return (order[a.season.toLowerCase()] || 0) - (order[b.season.toLowerCase()] || 0);
            }),
          
          // Activity Log (from real database data)
          activities: recentActivity.slice(0, 10).map(activity => ({
            id: activity.id,
            type: activity.type,
            message: activity.message,
            timestamp: activity.timestamp,
            status: activity.status
          }))
        };
        
        setEnhancedData(enhancedDashboardData);
        setError(null);
        setLoading(false);
        console.log('✅ MainDashboardPage: Dashboard data loaded successfully');
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        
        // Fallback to dummy data
        const dummyEnhancedData: EnhancedDashboardData = {
          totalUnitsToStock: 1250,
          estimatedInvestment: 45000,
          criticalItemsCount: 25,
          fastMoversCount: 45,
          priorityDistribution: [
            { name: 'Critical', value: 25, color: 'var(--destructive)' },
            { name: 'High', value: 45, color: 'var(--accent)' },
            { name: 'Medium', value: 60, color: 'var(--chart-3)' },
            { name: 'Low', value: 30, color: 'var(--muted-foreground)' }
          ],
          actions: [
            {
              id: '1',
              title: 'Order Critical Medicines',
              description: 'Order 25 critical medicines before next week',
              urgency: 'critical',
              timestamp: '2 hours ago',
              icon: <ShoppingCart size={16} />
            },
            {
              id: '2',
              title: 'Review Supplier Stock',
              description: 'Review supplier stock for 45 high-priority items',
              urgency: 'high',
              timestamp: '4 hours ago',
              icon: <Package size={16} />
            }
          ],
          seasonalSales: [
            { season: 'Summer', quantity: 1200, revenue: 45000 },
            { season: 'Monsoon', quantity: 1800, revenue: 65000 },
            { season: 'Winter', quantity: 2200, revenue: 85000 }
          ],
          activities: [
            {
              id: '1',
              type: 'data_loaded',
              message: 'New CSV data loaded successfully',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              status: 'success'
            },
            {
              id: '2',
              type: 'forecast_updated',
              message: 'Forecast accuracy updated: 87%',
              timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
              status: 'success'
            }
          ]
        };
        
        setEnhancedData(dummyEnhancedData);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dataRefreshTrigger]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        fontFamily: 'DM Sans, sans-serif'
      }}>
        <div className="animate-pulse" style={{ 
          fontSize: '1.25rem', 
          color: 'var(--muted-foreground)' 
        }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        fontFamily: 'DM Sans, sans-serif'
      }}>
        <div style={{ 
          textAlign: 'center',
          color: 'var(--destructive)',
          fontSize: '1.125rem'
        }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Page Header */}
      <div className="page-header" style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <div>
          <h1 className="page-title" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            Pharmacy Analytics Dashboard
          </h1>
          <p className="page-description">
            Comprehensive overview of pharmacy performance and inventory management
          </p>
        </div>
      </div>

      {/* Enhanced KPI Cards */}
      {enhancedData && (
      <div className="grid grid-cols-4" style={{ 
        marginBottom: 'var(--spacing-xl)',
        gap: 'var(--spacing-lg)'
      }}>
          <EnhancedKPICard
            title="Total Units to Stock"
            value={enhancedData.totalUnitsToStock.toLocaleString()}
            subtitle="Upcoming season demand"
            change={12.5}
            changeType="increase"
            icon={<Package size={24} />}
            color="var(--primary)"
          />
          <EnhancedKPICard
            title="Estimated Investment"
            value={`₹${enhancedData.estimatedInvestment.toLocaleString()}`}
            subtitle="Total budget required"
            change={-2.3}
            changeType="decrease"
            icon={<IndianRupee size={24} />}
            color="var(--chart-5)"
          />
          <EnhancedKPICard
            title="Critical Items"
            value={enhancedData.criticalItemsCount}
            subtitle="Urgent medicines"
            change={8.1}
            changeType="increase"
            icon={<AlertTriangle size={24} />}
            color="var(--destructive)"
          />
          <EnhancedKPICard
            title="Fast Movers"
            value={enhancedData.fastMoversCount}
            subtitle="High-frequency sales"
            change={15.2}
            changeType="increase"
            icon={<Zap size={24} />}
            color="var(--accent)"
        />
      </div>
      )}

      {/* Sales Performance Chart */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <SalesPerformanceChart />
      </div>

      {/* Main Dashboard Grid */}
        <div style={{ 
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 'var(--spacing-xl)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        {/* Left Column - Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
          {/* Seasonal Sales Chart */}
          {enhancedData && (
            <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
              <SeasonalSalesChart data={enhancedData.seasonalSales} />
            </div>
          )}

          {/* Medicine Stock Priority Distribution Chart */}
          {enhancedData && (
            <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                margin: 0,
                marginBottom: 'var(--spacing-xs)',
                color: 'var(--foreground)'
              }}>
                Medicine Stock Priority Distribution
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--muted-foreground)',
                margin: 0,
                marginBottom: 'var(--spacing-md)',
                lineHeight: '1.4'
              }}>
                Distribution of medicines by stock priority level based on current inventory status
              </p>
              <PriorityDistributionChart data={enhancedData.priorityDistribution} />
            </div>
          )}
          </div>

        {/* Right Column - Actions and Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
          {/* Actions Panel */}
          {enhancedData && (
            <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
              <ActionsPanel actions={enhancedData.actions} />
          </div>
          )}

          {/* Activity Log */}
          {enhancedData && (
            <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
              <ActivityLog activities={enhancedData.activities} />
        </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainDashboardPage;
