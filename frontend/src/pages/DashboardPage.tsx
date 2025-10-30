import React, { useEffect, useState } from 'react';
import KPICard from '@/components/KPICard';
import ChartCard from '@/components/ChartCard';
import SalesChart from '@/components/SalesChart';
import CategoryChart from '@/components/CategoryChart';
import { analysisAPI } from '@/api/analysis';
import { useSandbox } from '@/hooks/useSandbox';
import type { KPIMetric, SalesData } from '@/types';

const DashboardPage: React.FC = () => {
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [priorityDistribution, setPriorityDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sandbox context for data source management
  const { dataRefreshTrigger } = useSandbox();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching dashboard data...');
        
        // Fetch all dashboard data from backend APIs
        const [
          kpiMetrics,
          summary,
          topMedicines,
          priorityDistribution,
          recentActivity,
          salesPerformance
        ] = await Promise.all([
          analysisAPI.getKPIMetrics(),
          analysisAPI.getSeasonalSummary(),
          analysisAPI.getTopMedicines('Winter', 5),
          analysisAPI.getPriorityDistribution(),
          analysisAPI.getRecentActivity(),
          analysisAPI.getSalesPerformance()
        ]);
        
        console.log('📊 Dashboard data received:', {
          kpiMetrics,
          summary,
          topMedicines,
          priorityDistribution,
          recentActivity,
          salesPerformance
        });

        // Create KPI metrics from real database data
        const realKpiMetrics: KPIMetric[] = [
          {
            label: 'Total Revenue',
            value: `₹${kpiMetrics.total_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            change: Math.abs(kpiMetrics.growth_rate),
            changeType: kpiMetrics.growth_rate >= 0 ? 'increase' : 'decrease'
          },
          {
            label: 'Unique Medicines',
            value: kpiMetrics.unique_medicines.toLocaleString(),
            change: 0, // No historical data for comparison
            changeType: 'increase'
          },
          {
            label: 'Total Transactions',
            value: kpiMetrics.total_transactions.toLocaleString(),
            change: 0, // No historical data for comparison
            changeType: 'increase'
          },
          {
            label: 'Avg Daily Revenue',
            value: `₹${kpiMetrics.avg_daily_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            change: Math.abs(kpiMetrics.growth_rate),
            changeType: kpiMetrics.growth_rate >= 0 ? 'increase' : 'decrease'
          }
        ];

        // Create sales data from seasonal breakdown
        const realSalesData: SalesData[] = Object.entries(summary.seasonal_breakdown).map(([season, data]: [string, any]) => ({
          date: season,
          sales: data.Total_Quantity,
          revenue: data.Total_Revenue_INR,
          transactions: data.Unique_Invoices
        }));

        // Create category data from top medicines
        const realCategoryData = topMedicines.map((medicine: any) => ({
          category: medicine.medicine_name,
          value: medicine.quantity_sold,
          revenue: medicine.total_revenue
        }));

        console.log('📊 Setting dashboard data...');
        setKpiMetrics(realKpiMetrics);
        setSalesData(realSalesData);
        setCategoryData(realCategoryData);
        setRecentActivity(recentActivity);
        setPriorityDistribution(priorityDistribution.distribution);
        setLoading(false);
        console.log('✅ Dashboard data loaded successfully');
        
      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [dataRefreshTrigger]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%' 
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

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">
          Overview of pharmacy performance metrics and key indicators
        </p>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-4" style={{ marginBottom: 'var(2rem)' }}>
        {kpiMetrics.map((metric, index) => (
          <KPICard 
            key={index}
            label={metric.label}
            value={metric.value}
            change={metric.change || 0}
            changeType={metric.changeType === 'neutral' ? 'increase' : (metric.changeType || 'increase')}
            subtitle={`${metric.changeType === 'increase' ? 'Trending up' : 'Trending down'} this month`}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2" style={{ gap: 'var(2rem)' }}>
        <ChartCard 
          title="Sales & Revenue Trends"
          subtitle="Monthly performance overview"
        >
          <SalesChart data={salesData} type="area" />
        </ChartCard>

        <ChartCard 
          title="Category Distribution"
          subtitle="Medicine categories breakdown"
        >
          <CategoryChart data={categoryData} />
        </ChartCard>
      </div>

      {/* Priority Distribution Section */}
      <div style={{ marginTop: 'var(2rem)' }}>
        <ChartCard title="Priority Distribution" subtitle="Medicine priority levels based on sales performance">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 'var(1rem)' 
          }}>
            {priorityDistribution.length > 0 ? priorityDistribution.map((item, index) => (
              <div 
                key={index}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(1rem)',
                  background: 'var(--card-hover)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `3px solid var(--${item.priority.toLowerCase()})`
                }}
              >
                <div>
                  <span style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--foreground)' }}>
                    {item.priority} Priority
                  </span>
                  <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                    {item.count} medicines
                  </div>
                </div>
                <div style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '600', 
                  color: 'var(--primary)' 
                }}>
                  {item.percentage}%
                </div>
              </div>
            )) : (
              <div style={{ 
                padding: 'var(2rem)', 
                textAlign: 'center', 
                color: 'var(--muted-foreground)' 
              }}>
                No priority distribution data available
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Recent Activity Section */}
      <div style={{ marginTop: 'var(2rem)' }}>
        <ChartCard title="Recent Activity" subtitle="Latest updates and notifications">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 'var(1rem)' 
          }}>
            {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
              <div 
                key={index}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: 'var(1rem)',
                  background: 'var(--card-hover)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `3px solid var(--${activity.type})`
                }}
              >
                <span style={{ fontSize: '0.9375rem', color: 'var(--foreground)' }}>
                  {activity.message}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                  {activity.time}
                </span>
              </div>
            )) : (
              <div style={{ 
                padding: 'var(2rem)', 
                textAlign: 'center', 
                color: 'var(--muted-foreground)' 
              }}>
                No recent activity data available
              </div>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default DashboardPage;

