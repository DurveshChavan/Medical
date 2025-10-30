import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface BudgetData {
  priority: string;
  amount: number;
  color: string;
  percentage: number;
}

interface BudgetAllocationChartProps {
  data: BudgetData[];
}

const BudgetAllocationChart: React.FC<BudgetAllocationChartProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-sm)',
          boxShadow: 'var(--shadow-md)'
        }}>
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600' }}>
            {data.name} Priority
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
            ₹{data.value?.toLocaleString() || 0} ({data.payload?.percentage || 0}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '250px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="amount"
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
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BudgetAllocationChart;
