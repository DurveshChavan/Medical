import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface VisitorData {
  date: string;
  value: number;
  value2?: number;
}

interface VisitorsChartProps {
  data: VisitorData[];
  title?: string;
  subtitle?: string;
}

type TimePeriod = 'last3months' | 'last30days' | 'last7days';

const VisitorsChart: React.FC<VisitorsChartProps> = ({ 
  data, 
  title = 'Total Visitors',
  subtitle = 'Total for the last 3 months'
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('last30days');

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
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
            marginBottom: '0.25rem',
            fontSize: '0.875rem',
            color: 'var(--foreground)'
          }}>
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ 
              color: entry.color, 
              fontSize: '0.8125rem',
              fontFamily: 'Space Mono, monospace',
              margin: 0
            }}>
              Visitors: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const periods = [
    { id: 'last3months' as TimePeriod, label: 'Last 3 months' },
    { id: 'last30days' as TimePeriod, label: 'Last 30 days' },
    { id: 'last7days' as TimePeriod, label: 'Last 7 days' }
  ];

  return (
    <div className="card" style={{ 
      padding: 'var(2rem)',
      background: 'var(--card)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: 'var(2rem)'
      }}>
        <div>
          <h3 style={{ 
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--foreground)',
            marginBottom: '0.25rem',
            fontFamily: 'DM Sans, sans-serif'
          }}>
            {title}
          </h3>
          <p style={{ 
            fontSize: '0.875rem',
            color: 'var(--muted-foreground)',
            fontFamily: 'DM Sans, sans-serif'
          }}>
            {subtitle}
          </p>
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem',
          background: 'var(--background)',
          padding: '0.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)'
        }}>
          {periods.map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                fontWeight: '500',
                fontFamily: 'DM Sans, sans-serif',
                background: selectedPeriod === period.id ? 'var(--primary)' : 'transparent',
                color: selectedPeriod === period.id ? 'white' : 'var(--muted-foreground)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(150ms ease-in-out)'
              }}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorVisitors1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorVisitors2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="var(--border)" 
            vertical={false}
          />
          <XAxis 
            dataKey="date" 
            stroke="var(--muted-foreground)"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis 
            stroke="var(--muted-foreground)"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12, fontFamily: 'Space Mono, monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--chart-2)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorVisitors1)"
          />
          {data[0]?.value2 !== undefined && (
            <Area
              type="monotone"
              dataKey="value2"
              stroke="var(--chart-3)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorVisitors2)"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VisitorsChart;

