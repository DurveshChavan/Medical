import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface EnhancedKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
  backgroundColor?: string;
}

const EnhancedKPICard: React.FC<EnhancedKPICardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeType = 'neutral',
  icon,
  color,
  backgroundColor
}) => {
  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp size={14} />;
      case 'decrease':
        return <TrendingDown size={14} />;
      default:
        return <Minus size={14} />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return '#22c55e';
      case 'decrease':
        return 'var(--destructive)';
      default:
        return 'var(--muted-foreground)';
    }
  };

  return (
    <div style={{
      background: backgroundColor || 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--spacing-lg)',
      transition: 'all var(--transition-fast)',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
    }}
    >
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '80px',
        height: '80px',
        background: color,
        borderRadius: '50%',
        opacity: 0.1
      }} />
      
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-sm)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            <div style={{ 
              color: color,
              display: 'flex',
              alignItems: 'center'
            }}>
              {icon}
            </div>
            <h3 style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              margin: 0,
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {title}
            </h3>
          </div>
          
          <div style={{ 
            fontSize: '1.75rem', 
            fontWeight: '700', 
            fontFamily: 'Space Mono, monospace',
            color: 'var(--foreground)',
            marginBottom: 'var(--spacing-xs)',
            lineHeight: '1.2'
          }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          
          {subtitle && (
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--muted-foreground)',
              marginBottom: 'var(--spacing-xs)'
            }}>
              {subtitle}
            </div>
          )}
          
          {change !== undefined && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-xs)',
              fontSize: '0.75rem',
              color: getChangeColor()
            }}>
              {getChangeIcon()}
              <span style={{ fontWeight: '600' }}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedKPICard;
