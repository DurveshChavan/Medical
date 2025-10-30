import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface PriorityData {
  name: string;
  value: number;
  color: string;
}

interface PriorityDistributionChartProps {
  data: PriorityData[];
}

const PriorityDistributionChart: React.FC<PriorityDistributionChartProps> = ({ data }) => {
  const renderCustomLabel = (entry: any) => {
    return `${entry.value}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = data.payload.total || data.value;
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      // Define priority descriptions
      const getPriorityDescription = (name: string) => {
        switch (name.toLowerCase()) {
          case 'critical':
            return 'Out of stock - Immediate reorder required';
          case 'high':
            return 'Low stock - Reorder soon';
          case 'medium':
            return 'Adequate stock - Monitor levels';
          case 'low':
            return 'Well stocked - No immediate action needed';
          default:
            return 'Stock level status';
        }
      };
      
      return (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-sm)',
          boxShadow: 'var(--shadow-md)',
          maxWidth: '200px'
        }}>
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: data.color }}>
            {data.name} Priority
          </p>
          <p style={{ margin: '2px 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
            {data.value} medicines ({percentage}%)
          </p>
          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
            {getPriorityDescription(data.name)}
          </p>
        </div>
      );
    }
    return null;
  };

  const totalMedicines = data.reduce((sum, item) => sum + item.value, 0);
  const criticalCount = data.find(item => item.name.toLowerCase() === 'critical')?.value || 0;
  const highCount = data.find(item => item.name.toLowerCase() === 'high')?.value || 0;

  return (
    <div>
      <div style={{ width: '100%', height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={renderCustomLabel}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '0.75rem' }}
              formatter={(value, entry) => (
                <span style={{ color: entry.color, fontWeight: '500' }}>
                  {value} Priority
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Summary */}
      <div style={{
        marginTop: 'var(--spacing-md)',
        padding: 'var(--spacing-sm)',
        background: 'var(--muted)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.8rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)' }}>
          <span style={{ color: 'var(--muted-foreground)' }}>Total Medicines:</span>
          <span style={{ fontWeight: '600' }}>{totalMedicines}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)' }}>
          <span style={{ color: 'var(--destructive)' }}>Need Immediate Action:</span>
          <span style={{ fontWeight: '600', color: 'var(--destructive)' }}>{criticalCount + highCount}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--muted-foreground)' }}>Action Required:</span>
          <span style={{ fontWeight: '600', color: criticalCount + highCount > 0 ? 'var(--destructive)' : 'var(--chart-5)' }}>
            {criticalCount + highCount > 0 ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PriorityDistributionChart;
