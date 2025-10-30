import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface SeasonalData {
  season: string;
  quantity: number;
  revenue: number;
}

interface SeasonalSalesChartProps {
  data: SeasonalData[];
}

const SeasonalSalesChart: React.FC<SeasonalSalesChartProps> = ({ data }) => {
  const [viewMode, setViewMode] = useState<'quantity' | 'revenue'>('revenue');

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-sm)',
          boxShadow: 'var(--shadow-md)'
        }}>
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600' }}>
            {label} Season
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
            {viewMode === 'revenue' ? 'Revenue' : 'Quantity'}: {viewMode === 'revenue' ? `₹${data?.value?.toLocaleString() || 0}` : data?.value?.toLocaleString() || 0}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Chart Header with Toggle */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'var(--spacing-md)'
      }}>
        <h3 style={{ 
          fontSize: '1.125rem', 
          fontWeight: '600', 
          margin: 0,
          color: 'var(--foreground)'
        }}>
          Seasonal Sales Overview
        </h3>
        
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
          <button
            onClick={() => setViewMode('quantity')}
            style={{
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              background: viewMode === 'quantity' ? 'var(--primary)' : 'var(--card)',
              color: viewMode === 'quantity' ? 'white' : 'var(--muted-foreground)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
              transition: 'all var(--transition-fast)'
            }}
          >
            <TrendingUp size={12} />
            Quantity
          </button>
          
          <button
            onClick={() => setViewMode('revenue')}
            style={{
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              background: viewMode === 'revenue' ? 'var(--chart-5)' : 'var(--card)',
              color: viewMode === 'revenue' ? 'white' : 'var(--muted-foreground)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
              transition: 'all var(--transition-fast)'
            }}
          >
            <span style={{ fontSize: '0.875rem' }}>₹</span>
            Revenue
          </button>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis 
              dataKey="season" 
              stroke="var(--muted-foreground)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickFormatter={(value) => viewMode === 'quantity' ? value.toLocaleString() : `₹${value.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey={viewMode === 'quantity' ? 'quantity' : 'revenue'} 
              fill={viewMode === 'revenue' ? 'var(--chart-5)' : 'var(--primary)'}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SeasonalSalesChart;

