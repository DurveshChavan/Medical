import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { SalesData } from '@/types';

interface SalesChartProps {
  data: SalesData[];
  type?: 'line' | 'area';
}

const SalesChart: React.FC<SalesChartProps> = ({ data, type = 'area' }) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(1rem)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <p style={{ fontWeight: '600', marginBottom: 'var(0.5rem)' }}>
            {payload[0].payload.date}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color, fontSize: '0.875rem' }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const chartProps = {
    data,
    margin: { top: 10, right: 10, left: 0, bottom: 0 }
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      {type === 'area' ? (
        <AreaChart {...chartProps}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis 
            dataKey="date" 
            stroke="var(--muted-foreground)" 
            style={{ fontSize: '0.75rem' }}
          />
          <YAxis 
            stroke="var(--muted-foreground)" 
            style={{ fontSize: '0.75rem' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--primary)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            name="Revenue (₹)"
          />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="var(--accent)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorSales)"
            name="Sales"
          />
        </AreaChart>
      ) : (
        <LineChart {...chartProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis 
            dataKey="date" 
            stroke="var(--muted-foreground)" 
            style={{ fontSize: '0.75rem' }}
          />
          <YAxis 
            stroke="var(--muted-foreground)" 
            style={{ fontSize: '0.75rem' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--primary)"
            strokeWidth={2}
            name="Revenue (₹)"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="var(--accent)"
            strokeWidth={2}
            name="Sales"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
};

export default SalesChart;

