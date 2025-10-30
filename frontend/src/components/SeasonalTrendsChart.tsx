import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface SeasonalTrendsChartProps {
  data: Array<{
    month: string;
    Summer: number;
    Monsoon: number;
    Winter: number;
    AllSeason: number;
  }>;
}

const SeasonalTrendsChart: React.FC<SeasonalTrendsChartProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
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
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ 
              color: entry.color, 
              fontSize: '0.875rem',
              marginBottom: '0.125rem'
            }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis 
          dataKey="month" 
          stroke="var(--muted-foreground)" 
          style={{ fontSize: '0.75rem' }}
        />
        <YAxis 
          stroke="var(--muted-foreground)" 
          style={{ fontSize: '0.75rem' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: '0.875rem' }}
          iconType="square"
        />
        <Bar 
          dataKey="Summer" 
          fill="var(--season-summer)" 
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          dataKey="Monsoon" 
          fill="var(--season-monsoon)" 
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          dataKey="Winter" 
          fill="var(--season-winter)" 
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          dataKey="AllSeason" 
          fill="var(--season-all)" 
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SeasonalTrendsChart;

