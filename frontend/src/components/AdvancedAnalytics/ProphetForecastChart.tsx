import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';

interface ProphetForecastChartProps {
  data: {
    success: boolean;
    error?: string;
    dates: string[];
    actual: (number | null)[];
    forecast: number[];
    lower: (number | null)[];
    upper: (number | null)[];
    yearly_seasonality: number[];
  };
}

const ProphetForecastChart: React.FC<ProphetForecastChartProps> = ({ data }) => {
  if (!data.success) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '300px',
        color: 'var(--error)',
        textAlign: 'center',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)'
      }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '500' }}>
          Prophet Forecast Unavailable
        </div>
        <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
          {data.error}
        </div>
      </div>
    );
  }

  // Transform data for charts
  const forecastData = data.dates.map((date, index) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    actual: data.actual[index],
    forecast: data.forecast[index],
    lower: data.lower[index],
    upper: data.upper[index],
    fullDate: date
  }));

  const seasonalityData = data.dates.map((date, index) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    seasonality: data.yearly_seasonality[index],
    fullDate: date
  }));

  if (forecastData.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '300px',
        color: 'var(--text-muted)'
      }}>
        No forecast data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '500px' }}>
      {/* Top Plot: Forecast Overview */}
      <div style={{ height: '250px', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ 
          fontSize: '0.875rem', 
          fontWeight: '500', 
          marginBottom: 'var(--spacing-sm)',
          color: 'var(--text-primary)'
        }}>
          Prophet Forecast Overview
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={forecastData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
            
            <XAxis 
              dataKey="date" 
              stroke="var(--text-secondary)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="var(--text-secondary)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={{ 
                value: 'Daily Quantity', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: 'var(--text-secondary)', fontSize: 10 }
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.75rem'
              }}
              labelStyle={{ color: 'var(--text-primary)', fontSize: '0.75rem' }}
              formatter={(value: number, name: string) => {
                if (name === 'actual') return [`${value?.toLocaleString() || 'N/A'} units`, 'Actual Sales'];
                if (name === 'forecast') return [`${value.toLocaleString()} units`, 'Forecast'];
                if (name === 'lower') return [`${value?.toLocaleString() || 'N/A'} units`, 'Lower Bound'];
                if (name === 'upper') return [`${value?.toLocaleString() || 'N/A'} units`, 'Upper Bound'];
                return [value, name];
              }}
              labelFormatter={(label: string) => label}
            />
            
            {/* Uncertainty interval */}
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="#3498DB"
              fillOpacity={0.3}
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="#3498DB"
              fillOpacity={0.3}
              connectNulls={false}
            />
            
            {/* Actual sales (dots) */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#2C3E50"
              strokeWidth={0}
              dot={{ fill: '#2C3E50', strokeWidth: 0, r: 3 }}
              connectNulls={false}
            />
            
            {/* Forecast line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#3498DB"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Plot: Seasonal Pattern */}
      <div style={{ height: '200px' }}>
        <div style={{ 
          fontSize: '0.875rem', 
          fontWeight: '500', 
          marginBottom: 'var(--spacing-sm)',
          color: 'var(--text-primary)'
        }}>
          Seasonal Pattern Analysis
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={seasonalityData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
            
            <XAxis 
              dataKey="date" 
              stroke="var(--text-secondary)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="var(--text-secondary)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={{ 
                value: 'Yearly Seasonality Effect', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: 'var(--text-secondary)', fontSize: 10 }
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.75rem'
              }}
              labelStyle={{ color: 'var(--text-primary)', fontSize: '0.75rem' }}
              formatter={(value: number) => [`${value.toFixed(3)}`, 'Seasonality Effect']}
              labelFormatter={(label: string) => label}
            />
            
            {/* Zero line */}
            <Line
              type="monotone"
              dataKey={() => 0}
              stroke="var(--text-muted)"
              strokeWidth={1}
              strokeDasharray="2 2"
              dot={false}
            />
            
            {/* Seasonality line */}
            <Line
              type="monotone"
              dataKey="seasonality"
              stroke="#E74C3C"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 'var(--spacing-lg)',
        marginTop: 'var(--spacing-md)',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <div style={{ width: '8px', height: '8px', background: '#2C3E50', borderRadius: '50%' }} />
          <span>Actual Sales</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <div style={{ width: '12px', height: '2px', background: '#3498DB' }} />
          <span>Forecast</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <div style={{ width: '12px', height: '8px', background: '#3498DB', opacity: 0.3 }} />
          <span>Uncertainty Interval</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <div style={{ width: '12px', height: '2px', background: '#E74C3C' }} />
          <span>Seasonal Effect</span>
        </div>
      </div>
    </div>
  );
};

export default ProphetForecastChart;