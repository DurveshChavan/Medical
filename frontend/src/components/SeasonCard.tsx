import React from 'react';
import { Sun, CloudRain, Snowflake, Calendar } from 'lucide-react';
import type { SeasonalAnalysis } from '@/types';

interface SeasonCardProps {
  analysis: SeasonalAnalysis;
  onClick?: () => void;
}

const SeasonCard: React.FC<SeasonCardProps> = ({ analysis, onClick }) => {
  const getSeasonIcon = (season: string) => {
    const icons = {
      'Summer': <Sun size={24} />,
      'Monsoon': <CloudRain size={24} />,
      'Winter': <Snowflake size={24} />,
      'All Season': <Calendar size={24} />
    };
    return icons[season as keyof typeof icons] || <Calendar size={24} />;
  };

  const getSeasonColor = (season: string) => {
    const colors = {
      'Summer': 'var(--season-summer)',
      'Monsoon': 'var(--season-monsoon)',
      'Winter': 'var(--season-winter)',
      'All Season': 'var(--season-all)'
    };
    return colors[season as keyof typeof colors] || 'var(--primary)';
  };

  const seasonColor = getSeasonColor(analysis.season);

  return (
    <div 
      className="card" 
      onClick={onClick}
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: `4px solid ${seasonColor}`
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(1rem)' }}>
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(0.5rem)',
            marginBottom: 'var(0.5rem)',
            color: seasonColor
          }}>
            {getSeasonIcon(analysis.season)}
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--foreground)' }}>
              {analysis.season}
            </h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
            {analysis.medicines.length} medicines
          </p>
        </div>
        <div style={{ 
          fontSize: '1.5rem', 
          fontWeight: '700',
          color: seasonColor
        }}>
          {analysis.demand_score}%
        </div>
      </div>

      <div style={{ marginBottom: 'var(1rem)' }}>
        <div style={{ 
          fontSize: '0.75rem', 
          fontWeight: '600', 
          color: 'var(--muted-foreground)',
          marginBottom: 'var(0.5rem)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Top Medicines
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(0.25rem)' }}>
          {analysis.medicines.slice(0, 3).map((med, index) => (
            <div 
              key={med.id || index} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '0.875rem'
              }}
            >
              <span style={{ color: 'var(--foreground)' }}>{med.name}</span>
              <span style={{ color: 'var(--muted-foreground)' }}>
                Stock: {med.stock}
              </span>
            </div>
          ))}
        </div>
      </div>

      {analysis.recommendations.length > 0 && (
        <div>
          <div style={{ 
            fontSize: '0.75rem', 
            fontWeight: '600', 
            color: 'var(--muted-foreground)',
            marginBottom: 'var(0.5rem)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Key Recommendations
          </div>
          <ul style={{ 
            paddingLeft: 'var(1.5rem)',
            margin: 0,
            fontSize: '0.875rem',
            color: 'var(--muted-foreground)',
            lineHeight: '1.6'
          }}>
            {analysis.recommendations.slice(0, 2).map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SeasonCard;

