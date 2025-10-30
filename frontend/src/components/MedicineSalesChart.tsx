import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface SalesTrendData {
  month: string;
  sales: number;
  season?: 'Summer' | 'Monsoon' | 'Winter';
}

interface MedicineSalesChartProps {
  data: SalesTrendData[];
  medicineName: string;
}

const MedicineSalesChart: React.FC<MedicineSalesChartProps> = ({ data, medicineName }) => {
  const getSeasonColor = (season?: string): string => {
    const colors: Record<string, string> = {
      'Summer': 'var(--season-summer)',
      'Monsoon': 'var(--season-monsoon)',
      'Winter': 'var(--season-winter)'
    };
    return season ? colors[season] || 'var(--primary)' : 'var(--primary)';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(1rem)',
          boxShadow: 'var(--shadow-lg)',
          fontFamily: 'DM Sans, sans-serif'
        }}>
          <p style={{ 
            fontWeight: '600', 
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            color: 'var(--foreground)'
          }}>
            {label}
          </p>
          <p style={{ 
            fontSize: '0.8125rem',
            color: 'var(--primary)',
            fontFamily: 'Space Mono, monospace',
            margin: 0
          }}>
            Sales: {data.sales.toLocaleString()} units
          </p>
          {data.season && (
            <p style={{ 
              fontSize: '0.75rem',
              color: getSeasonColor(data.season),
              marginTop: '0.25rem'
            }}>
              Season: {data.season}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card" style={{ padding: 'var(2rem)' }}>
      <h3 style={{ 
        fontSize: '1.125rem',
        fontWeight: '600',
        color: 'var(--foreground)',
        marginBottom: '0.25rem',
        fontFamily: 'DM Sans, sans-serif'
      }}>
        Sales Trend - {medicineName}
      </h3>
      <p style={{ 
        fontSize: '0.875rem',
        color: 'var(--muted-foreground)',
        marginBottom: 'var(2rem)',
        fontFamily: 'DM Sans, sans-serif'
      }}>
        12-month sales performance with seasonal indicators
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="var(--border)" 
            vertical={false}
          />
          <XAxis 
            dataKey="month" 
            stroke="var(--muted-foreground)"
            tick={{ 
              fill: 'var(--muted-foreground)', 
              fontSize: 12, 
              fontFamily: 'DM Sans, sans-serif' 
            }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis 
            stroke="var(--muted-foreground)"
            tick={{ 
              fill: 'var(--muted-foreground)', 
              fontSize: 12, 
              fontFamily: 'Space Mono, monospace' 
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="var(--primary)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#salesGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Season Legend */}
      <div style={{ 
        marginTop: 'var(1.5rem)',
        display: 'flex',
        gap: 'var(1.5rem)',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {['Summer', 'Monsoon', 'Winter'].map((season) => (
          <div key={season} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            fontSize: '0.8125rem',
            fontFamily: 'DM Sans, sans-serif'
          }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%',
              background: getSeasonColor(season)
            }} />
            <span style={{ color: 'var(--muted-foreground)' }}>{season}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MedicineSalesChart;

