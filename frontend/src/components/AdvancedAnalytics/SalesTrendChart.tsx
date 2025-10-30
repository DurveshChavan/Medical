import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';

interface SalesTrendChartProps {
  data: {
    dates: string[];
    quantities: number[];
    seasons: string[];
  };
  highlightSeason?: string | null;
}

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ data, highlightSeason }) => {
  // Debug logging
  console.log('SalesTrendChart: Received highlightSeason:', highlightSeason);
  // Transform data for Recharts
  const chartData = data.dates.map((date, index) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    quantity: data.quantities[index],
    season: data.seasons[index],
    fullDate: date
  }));

  // Add seasonal background data to chart data
  const enhancedChartData = chartData.map((item) => {
    const date = new Date(item.fullDate);
    const month = date.getMonth() + 1; // 1-12
    
    let season = '';
    
    // Determine season based on month
    if (month >= 2 && month <= 5) {
      season = 'summer';
    } else if (month >= 6 && month <= 9) {
      season = 'monsoon';
    } else {
      season = 'winter';
    }
    
    // Determine color for this specific data point
    let pointColor = 'var(--primary)'; // default
    if (highlightSeason) {
      if (season === highlightSeason) {
        // This point is in the selected season
        pointColor = season === 'summer' ? '#FF6B6B' :
                     season === 'monsoon' ? '#4ECDC4' : '#45B7D1';
      }
    }
    
    return {
      ...item,
      season,
      pointColor
    };
  });

  if (chartData.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '300px',
        color: 'var(--text-muted)'
      }}>
        No sales data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={enhancedChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
          
          {/* Seasonal background highlighting */}
          {highlightSeason && (
            <ReferenceArea
              x1="0%"
              x2="100%"
              fill={highlightSeason === 'summer' ? '#FF6B6B' : 
                    highlightSeason === 'monsoon' ? '#4ECDC4' : '#45B7D1'}
              fillOpacity={0.05}
              stroke="none"
            />
          )}
          
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
              value: 'Quantity Sold', 
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
            formatter={(value: number) => [
              `${value.toLocaleString()} units`,
              'Quantity Sold'
            ]}
            labelFormatter={(label: string, payload: any[]) => {
              if (payload && payload[0]) {
                const data = payload[0].payload;
                return `${data.fullDate} (${data.season})`;
              }
              return label;
            }}
          />
          <Line
            type="monotone"
            dataKey="quantity"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              const color = payload.pointColor || 'var(--primary)';
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={color}
                  stroke={color}
                  strokeWidth={2}
                />
              );
            }}
            activeDot={(props: any) => {
              const { cx, cy, payload } = props;
              const color = payload.pointColor || 'var(--primary)';
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={6}
                  fill={color}
                  stroke={color}
                  strokeWidth={2}
                />
              );
            }}
          />
        </LineChart>
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
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-xs)',
          opacity: highlightSeason === 'summer' ? 1 : 0.5,
          fontWeight: highlightSeason === 'summer' ? '600' : '400',
          color: highlightSeason === 'summer' ? '#FF6B6B' : 'var(--text-secondary)'
        }}>
          <div style={{ 
            width: '12px', 
            height: '3px', 
            background: '#FF6B6B', 
            opacity: highlightSeason === 'summer' ? 1 : 0.3 
          }} />
          <span>Summer (Feb-May)</span>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-xs)',
          opacity: highlightSeason === 'monsoon' ? 1 : 0.5,
          fontWeight: highlightSeason === 'monsoon' ? '600' : '400',
          color: highlightSeason === 'monsoon' ? '#4ECDC4' : 'var(--text-secondary)'
        }}>
          <div style={{ 
            width: '12px', 
            height: '3px', 
            background: '#4ECDC4', 
            opacity: highlightSeason === 'monsoon' ? 1 : 0.3 
          }} />
          <span>Monsoon (Jun-Sep)</span>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-xs)',
          opacity: highlightSeason === 'winter' ? 1 : 0.5,
          fontWeight: highlightSeason === 'winter' ? '600' : '400',
          color: highlightSeason === 'winter' ? '#45B7D1' : 'var(--text-secondary)'
        }}>
          <div style={{ 
            width: '12px', 
            height: '3px', 
            background: '#45B7D1', 
            opacity: highlightSeason === 'winter' ? 1 : 0.3 
          }} />
          <span>Winter (Oct-Jan)</span>
        </div>
      </div>
      
      {/* Highlight indicator */}
      {highlightSeason && (
        <div style={{
          textAlign: 'center',
          marginTop: 'var(--spacing-sm)',
          fontSize: '0.75rem',
          color: highlightSeason === 'summer' ? '#FF6B6B' : 
                 highlightSeason === 'monsoon' ? '#4ECDC4' : '#45B7D1',
          fontWeight: '600'
        }}>
          📊 Highlighting {highlightSeason.charAt(0).toUpperCase() + highlightSeason.slice(1)} season data points only
        </div>
      )}
    </div>
  );
};

export default SalesTrendChart;
