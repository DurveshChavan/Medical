import React from 'react';

interface SeasonalToggleProps {
  selected: string | null;
  onChange: (season: string | null) => void;
}

const SeasonalToggle: React.FC<SeasonalToggleProps> = ({ selected, onChange }) => {
  const seasons = [
    { key: 'summer', label: 'Summer', color: '#FF6B6B', months: 'Feb-May' },
    { key: 'monsoon', label: 'Monsoon', color: '#4ECDC4', months: 'Jun-Sep' },
    { key: 'winter', label: 'Winter', color: '#45B7D1', months: 'Oct-Jan' }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-sm)'
    }}>
      <label style={{
        fontSize: '0.875rem',
        fontWeight: '500',
        color: 'var(--text-primary)'
      }}>
        Highlight Season
      </label>
      
      <div style={{
        display: 'flex',
        gap: 'var(--spacing-sm)',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => onChange(null)}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            background: selected === null ? 'var(--primary)' : 'var(--surface)',
            color: selected === null ? 'white' : 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)'
          }}
        >
          All Seasons
        </button>
        
        {seasons.map((season) => (
          <button
            key={season.key}
            onClick={() => {
              const newSelection = selected === season.key ? null : season.key;
              console.log(`SeasonalToggle: Clicked ${season.key}, changing selection to:`, newSelection);
              onChange(newSelection);
            }}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-md)',
              border: `1px solid ${season.color}`,
              borderRadius: 'var(--radius-md)',
              background: selected === season.key ? season.color : 'var(--surface)',
              color: selected === season.key ? 'white' : season.color,
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)'
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: season.color
              }}
            />
            {season.label}
            <span style={{
              fontSize: '0.75rem',
              opacity: 0.8
            }}>
              ({season.months})
            </span>
          </button>
        ))}
      </div>
      
      {selected && (
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          fontStyle: 'italic'
        }}>
          Charts will highlight {seasons.find(s => s.key === selected)?.label} season
        </div>
      )}
    </div>
  );
};

export default SeasonalToggle;
