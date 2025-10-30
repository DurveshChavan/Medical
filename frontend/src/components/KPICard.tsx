import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  subtitle: string;
  icon?: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({ 
  label, 
  value, 
  change, 
  changeType,
  subtitle 
}) => {
  const isPositive = changeType === 'increase';

  return (
    <div className="card" style={{ 
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      overflow: 'hidden'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'var(1.5rem)'
      }}>
        <div style={{ 
          fontSize: '0.875rem', 
          fontWeight: '500',
          color: 'var(--muted-foreground)',
          fontFamily: 'DM Sans, sans-serif'
        }}>
          {label}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.25rem 0.5rem',
          borderRadius: '9999px',
          background: isPositive ? 'var(--success-light)' : 'var(--error-light)',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: isPositive ? 'var(--success)' : 'var(--destructive)',
          border: `1px solid ${isPositive ? 'var(--success)' : 'var(--destructive)'}`,
          boxShadow: 'var(--shadow-xs)'
        }}>
          {isPositive ? (
            <TrendingUp size={12} strokeWidth={2.5} />
          ) : (
            <TrendingDown size={12} strokeWidth={2.5} />
          )}
          <span>{isPositive ? '+' : ''}{change}%</span>
        </div>
      </div>

      <div style={{ 
        fontSize: 'clamp(1.25rem, 4vw, 1.875rem)', 
        fontWeight: '600',
        color: 'var(--foreground)',
        marginBottom: 'var(0.5rem)',
        fontFamily: 'Space Mono, monospace',
        letterSpacing: '-0.02em',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '100%'
      }}>
        {value}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        fontSize: '0.8125rem',
        color: 'var(--muted-foreground)',
        fontFamily: 'DM Sans, sans-serif'
      }}>
        {isPositive ? (
          <TrendingUp size={14} style={{ color: 'var(--success)' }} />
        ) : (
          <TrendingDown size={14} style={{ color: 'var(--destructive)' }} />
        )}
        <span>{subtitle}</span>
      </div>
    </div>
  );
};

export default KpiCard;
