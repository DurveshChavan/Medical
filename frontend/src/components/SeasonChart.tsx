import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface SeasonChartData {
  medicine: string;
  quantity: number;
  revenue?: number;
}

interface SeasonChartProps {
  data: SeasonChartData[];
  season: string;
  title?: string;
}

const SeasonChart: React.FC<SeasonChartProps> = ({ 
  data, 
  season,
  title = 'Seasonal Performance by Medicine'
}) => {
  const getSeasonColor = (season: string): string => {
    const colors: Record<string, string> = {
      'Summer': 'var(--season-summer)',
      'Monsoon': 'var(--season-monsoon)',
      'Winter': 'var(--season-winter)',
      'All Season': 'var(--season-all)'
    };
    return colors[season] || 'var(--primary)';
  };

  const seasonColor = getSeasonColor(season);

  const CustomTooltip = ({ active, payload }: any) => {
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
            {data.medicine}
          </p>
          <p style={{ 
            fontSize: '0.8125rem',
            color: seasonColor,
            fontFamily: 'Space Mono, monospace',
            margin: 0
          }}>
            Quantity: {data.quantity.toLocaleString()}
          </p>
          {data.revenue && (
            <p style={{ 
              fontSize: '0.8125rem',
              color: 'var(--muted-foreground)',
              fontFamily: 'Space Mono, monospace',
              margin: '0.25rem 0 0 0'
            }}>
              Revenue: ₹{data.revenue.toLocaleString()}
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
        marginBottom: 'var(0.5rem)',
        fontFamily: 'DM Sans, sans-serif'
      }}>
        {title}
      </h3>
      <p style={{ 
        fontSize: '0.875rem',
        color: 'var(--muted-foreground)',
        marginBottom: 'var(2rem)',
        fontFamily: 'DM Sans, sans-serif'
      }}>
        Total quantity sold per medicine in {season}
      </p>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 20, left: 0, bottom: 60 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="var(--border)" 
            vertical={false}
          />
          <XAxis 
            dataKey="medicine" 
            stroke="var(--muted-foreground)"
            tick={{ 
              fill: 'var(--muted-foreground)', 
              fontSize: 11, 
              fontFamily: 'DM Sans, sans-serif' 
            }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={80}
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
            label={{ 
              value: 'Quantity Sold', 
              angle: -90, 
              position: 'insideLeft',
              style: { 
                fill: 'var(--muted-foreground)', 
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 12
              }
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--card-hover)' }} />
          <Bar 
            dataKey="quantity" 
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
          >
            {data.map((index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={seasonColor}
                opacity={0.9}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SeasonChart;

