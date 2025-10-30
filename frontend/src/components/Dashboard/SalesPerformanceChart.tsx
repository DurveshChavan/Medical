import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, TrendingUp, Package, IndianRupee } from 'lucide-react';
import { analysisAPI } from '@/api/analysis';

interface SalesData {
  date: string;
  revenue: number;
  quantity: number;
  transactions: number;
}

interface SalesPerformanceChartProps {
  className?: string;
}

const SalesPerformanceChart: React.FC<SalesPerformanceChartProps> = ({ className }) => {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'30' | '90' | '365'>('30');

  const periodOptions = [
    { value: '30', label: 'Last 30 days', icon: Calendar },
    { value: '90', label: 'Last 90 days', icon: TrendingUp },
    { value: '365', label: 'Last Year', icon: Package }
  ];

  useEffect(() => {
    fetchSalesData();
  }, [selectedPeriod]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching real sales performance data for period:', selectedPeriod);
      
      // Fetch real data from backend using the new daily sales endpoint
      const response = await analysisAPI.getDailySales(selectedPeriod);
      
      // Convert the response data to our expected format
      const data: SalesData[] = response.data.map((item: any) => ({
        date: item.date,
        revenue: item.revenue,
        quantity: item.quantity,
        transactions: item.transactions
      }));
      
      setSalesData(data);
      console.log('✅ Real sales performance data loaded:', data.length, 'days');
      console.log('📊 Date range:', response.date_range.start, 'to', response.date_range.end);
      
    } catch (err) {
      console.error('❌ Error fetching sales performance data:', err);
      setError('Failed to load sales performance data');
      
      // Fallback to dummy data only if backend is completely unavailable
      const dummyData: SalesData[] = [];
      const days = parseInt(selectedPeriod);
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        dummyData.push({
          date: date.toISOString().split('T')[0],
          revenue: 0, // Show zero for dates with no data
          quantity: 0,
          transactions: 0
        });
      }
      
      setSalesData(dummyData);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-md)',
          boxShadow: 'var(--shadow-lg)',
          fontFamily: 'DM Sans, sans-serif'
        }}>
          <p style={{ 
            margin: 0, 
            fontSize: '0.875rem', 
            fontWeight: '600',
            color: 'var(--foreground)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            {formatDate(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              marginBottom: 'var(--spacing-xs)'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                background: entry.color,
                borderRadius: '2px'
              }} />
              <span style={{ 
                fontSize: '0.75rem',
                color: 'var(--muted-foreground)',
                fontWeight: '500'
              }}>
                {entry.name}:
              </span>
              <span style={{ 
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'var(--foreground)',
                marginLeft: 'auto'
              }}>
                {entry.name === 'Revenue' ? formatCurrency(entry.value) : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '300px',
          fontFamily: 'DM Sans, sans-serif'
        }}>
          <div className="animate-pulse" style={{ 
            fontSize: '1rem', 
            color: 'var(--muted-foreground)' 
          }}>
            Loading sales performance data...
          </div>
        </div>
      </div>
    );
  }

  if (error && salesData.length === 0) {
    return (
      <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '300px',
          fontFamily: 'DM Sans, sans-serif'
        }}>
          <div style={{ 
            textAlign: 'center',
            color: 'var(--destructive)',
            fontSize: '1rem'
          }}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${className || ''}`} style={{ padding: 'var(--spacing-lg)' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'var(--spacing-lg)'
      }}>
        <div>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            margin: 0,
            color: 'var(--foreground)',
            fontFamily: 'DM Sans, sans-serif'
          }}>
            Sales Performance
          </h3>
          <p style={{ 
            margin: 0, 
            fontSize: '0.875rem', 
            color: 'var(--muted-foreground)',
            marginTop: 'var(--spacing-xs)'
          }}>
            Revenue and quantity trends over time
          </p>
        </div>
        
        {/* Period Filter */}
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          {periodOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedPeriod === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => setSelectedPeriod(option.value as '30' | '90' | '365')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-xs)',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  background: isSelected ? 'var(--primary)' : 'var(--card)',
                  color: isSelected ? 'white' : 'var(--muted-foreground)',
                  border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  fontFamily: 'DM Sans, sans-serif'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'var(--card-hover)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'var(--card)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }
                }}
              >
                <Icon size={14} />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: '350px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="quantityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={{ stroke: 'var(--border)' }}
            />
            <YAxis 
              yAxisId="revenue"
              orientation="left"
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={{ stroke: 'var(--border)' }}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            />
            <YAxis 
              yAxisId="quantity"
              orientation="right"
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={{ stroke: 'var(--border)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ 
                paddingTop: 'var(--spacing-md)',
                fontFamily: 'DM Sans, sans-serif'
              }}
            />
            <Area
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#revenueGradient)"
              name="Revenue ₹"
            />
            <Area
              yAxisId="quantity"
              type="monotone"
              dataKey="quantity"
              stroke="var(--chart-2)"
              strokeWidth={2}
              fill="url(#quantityGradient)"
              name="Items Sold"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: 'var(--spacing-lg)',
        marginTop: 'var(--spacing-lg)',
        padding: 'var(--spacing-md)',
        background: 'var(--muted)',
        borderRadius: 'var(--radius-md)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 'var(--spacing-xs)',
            marginBottom: 'var(--spacing-xs)'
          }}>
            <IndianRupee size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600',
              color: 'var(--foreground)'
            }}>
              Total Revenue
            </span>
          </div>
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: '700',
            color: 'var(--primary)',
            fontFamily: 'Space Mono, monospace'
          }}>
            {formatCurrency(salesData.reduce((sum, item) => sum + item.revenue, 0))}
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 'var(--spacing-xs)',
            marginBottom: 'var(--spacing-xs)'
          }}>
            <Package size={16} style={{ color: 'var(--chart-2)' }} />
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600',
              color: 'var(--foreground)'
            }}>
              Total Items
            </span>
          </div>
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: '700',
            color: 'var(--chart-2)',
            fontFamily: 'Space Mono, monospace'
          }}>
            {salesData.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 'var(--spacing-xs)',
            marginBottom: 'var(--spacing-xs)'
          }}>
            <TrendingUp size={16} style={{ color: 'var(--chart-3)' }} />
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600',
              color: 'var(--foreground)'
            }}>
              Avg Daily
            </span>
          </div>
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: '700',
            color: 'var(--chart-3)',
            fontFamily: 'Space Mono, monospace'
          }}>
            {formatCurrency(Math.round(salesData.reduce((sum, item) => sum + item.revenue, 0) / salesData.length))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesPerformanceChart;
