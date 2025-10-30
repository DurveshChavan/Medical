import React from 'react';

interface TopNSelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const TopNSelector: React.FC<TopNSelectorProps> = ({ 
  value, 
  onChange, 
  min = 3, 
  max = 10 
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-sm)',
      minWidth: '200px'
    }}>
      <label style={{
        fontSize: '0.875rem',
        fontWeight: '500',
        color: 'var(--text-primary)'
      }}>
        Number of Top Medicines to Analyze
      </label>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)'
      }}>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          style={{
            flex: 1,
            height: '6px',
            background: 'var(--border)',
            borderRadius: '3px',
            outline: 'none',
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none'
          }}
          onMouseDown={(e) => {
            const slider = e.target as HTMLInputElement;
            slider.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((value - min) / (max - min)) * 100}%, var(--border) ${((value - min) / (max - min)) * 100}%, var(--border) 100%)`;
          }}
          onInput={(e) => {
            const slider = e.target as HTMLInputElement;
            const newValue = parseInt(slider.value);
            slider.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((newValue - min) / (max - min)) * 100}%, var(--border) ${((newValue - min) / (max - min)) * 100}%, var(--border) 100%)`;
          }}
        />
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          minWidth: '60px'
        }}>
          <input
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={(e) => {
              const newValue = Math.max(min, Math.min(max, parseInt(e.target.value) || min));
              onChange(newValue);
            }}
            style={{
              width: '50px',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              textAlign: 'center',
              background: 'var(--surface)',
              color: 'var(--text-primary)'
            }}
          />
          <span style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            medicines
          </span>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        <span>Min: {min}</span>
        <span>Max: {max}</span>
      </div>
    </div>
  );
};

export default TopNSelector;
