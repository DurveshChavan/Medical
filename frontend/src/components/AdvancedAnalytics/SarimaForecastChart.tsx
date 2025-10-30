import React from 'react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';

interface SARIMAForecastChartProps {
  data: {
    success: boolean;
    error?: string;
    historical_dates: string[];
    historical_quantities: number[];
    forecast_dates: string[];
    forecast_values: number[];
    lower_bound: number[];
    upper_bound: number[];
  };
}

const SARIMAForecastChart: React.FC<SARIMAForecastChartProps> = ({ data }) => {
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
          SARIMA Forecast Unavailable
        </div>
        <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
          {data.error}
        </div>
      </div>
    );
  }

  // Combine historical and forecast data
  const historicalData = data.historical_dates.map((date, index) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    quantity: data.historical_quantities[index],
    type: 'historical',
    fullDate: date
  }));

  const forecastData = data.forecast_dates.map((date, index) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    forecast: data.forecast_values[index],
    lower: data.lower_bound[index],
    upper: data.upper_bound[index],
    type: 'forecast',
    fullDate: date
  }));

  // Find the last historical date for the forecast start line
  const lastHistoricalDate = data.historical_dates[data.historical_dates.length - 1];

  // Combine all data for the chart
  const chartData = [...historicalData, ...forecastData];

  if (chartData.length === 0) {
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
    <div style={{ width: '100%', height: '400px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
          
          <XAxis 
            dataKey="date" 
            stroke="var(--text-secondary)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="var(--text-secondary)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            label={{ 
              value: 'Weekly Quantity Sold', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: 'var(--text-secondary)' }
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)'
            }}
            labelStyle={{ color: 'var(--text-primary)' }}
            formatter={(value: number, name: string) => {
              if (name === 'quantity') return [`${value.toLocaleString()} units`, 'Historical Sales'];
              if (name === 'forecast') return [`${value.toLocaleString()} units`, 'Forecast'];
              if (name === 'lower') return [`${value.toLocaleString()} units`, 'Lower Bound'];
              if (name === 'upper') return [`${value.toLocaleString()} units`, 'Upper Bound'];
              return [value, name];
            }}
            labelFormatter={(label: string, payload: any[]) => {
              if (payload && payload[0]) {
                const data = payload[0].payload;
                return `${data.fullDate} (${data.type})`;
              }
              return label;
            }}
          />
          
          {/* Confidence interval area for forecast */}
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill="#E74C3C"
            fillOpacity={0.1}
            connectNulls={false}
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill="#E74C3C"
            fillOpacity={0.1}
            connectNulls={false}
          />
          
          {/* Historical sales line */}
          <Line
            type="monotone"
            dataKey="quantity"
            stroke="#2C3E50"
            strokeWidth={2}
            dot={{ fill: '#2C3E50', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#2C3E50', strokeWidth: 2 }}
            connectNulls={false}
          />
          
          {/* Forecast line */}
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#E74C3C"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#E74C3C', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#E74C3C', strokeWidth: 2 }}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      
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
          <div style={{ width: '12px', height: '2px', background: '#2C3E50' }} />
          <span>Historical Sales</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <div style={{ width: '12px', height: '2px', background: '#E74C3C', borderStyle: 'dashed' }} />
          <span>Forecast</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <div style={{ width: '12px', height: '8px', background: '#E74C3C', opacity: 0.3 }} />
          <span>95% Confidence Interval</span>
        </div>
      </div>
      
      {/* Forecast info */}
      <div style={{
        textAlign: 'center',
        marginTop: 'var(--spacing-sm)',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        Forecast Start: {new Date(lastHistoricalDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>
    </div>
  );
};

export default SARIMAForecastChart;