import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useSeasonalColors } from '@/hooks/useSeasonalColors';

interface SeasonalPerformer {
  medicine: string;
  summer: number;
  monsoon: number;
  winter: number;
  total: number;
}

interface SeasonalPerformerChartProps {
  data: SeasonalPerformer[];
  selectedSeason: string;
}

const SeasonalPerformerChart: React.FC<SeasonalPerformerChartProps> = ({ data, selectedSeason }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-sm)',
          boxShadow: 'var(--shadow-md)'
        }}>
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600' }}>
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ 
              margin: 0, 
              fontSize: '0.75rem', 
              color: entry.color,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                background: entry.color,
                borderRadius: '2px'
              }} />
              {entry.dataKey}: {entry.value?.toLocaleString() || 0}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const { getSeasonColor } = useSeasonalColors();

  // Transform data based on selected season
  const getChartData = () => {
    if (selectedSeason === 'all') {
      return data;
    } else {
      // For individual seasons, show only that season's data
      return data.map(item => ({
        medicine: item.medicine,
        [selectedSeason]: item[selectedSeason as keyof SeasonalPerformer] as number
      }));
    }
  };

  const chartData = getChartData();

  const getChartTitle = () => {
    switch (selectedSeason) {
      case 'summer':
        return 'Summer Season Performance';
      case 'monsoon':
        return 'Monsoon Season Performance';
      case 'winter':
        return 'Winter Season Performance';
      default:
        return 'Seasonal Performer Medicines';
    }
  };

  return (
    <div>
      <h3 style={{ 
        fontSize: '1.125rem', 
        fontWeight: '600', 
        margin: 0,
        marginBottom: 'var(--spacing-md)',
        color: 'var(--text-primary)'
      }}>
        {getChartTitle()}
      </h3>
      
      <div style={{ width: '100%', height: '350px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis 
              dataKey="medicine" 
              stroke="var(--muted-foreground)"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />
            {selectedSeason === 'all' && <Legend />}
            
            {selectedSeason === 'all' ? (
              // Show all seasons when "all" is selected
              <>
                <Bar 
                  dataKey="summer" 
                  fill={getSeasonColor('summer')}
                  radius={[2, 2, 0, 0]}
                  name="Summer"
                />
                <Bar 
                  dataKey="monsoon" 
                  fill={getSeasonColor('monsoon')}
                  radius={[2, 2, 0, 0]}
                  name="Monsoon"
                />
                <Bar 
                  dataKey="winter" 
                  fill={getSeasonColor('winter')}
                  radius={[2, 2, 0, 0]}
                  name="Winter"
                />
              </>
            ) : (
              // Show only selected season
              <Bar 
                dataKey={selectedSeason} 
                fill={getSeasonColor(selectedSeason)}
                radius={[2, 2, 0, 0]}
                name={selectedSeason.charAt(0).toUpperCase() + selectedSeason.slice(1)}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SeasonalPerformerChart;
