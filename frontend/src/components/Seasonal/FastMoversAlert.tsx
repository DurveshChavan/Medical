import React from 'react';
import { AlertTriangle, TrendingUp, Clock, Package } from 'lucide-react';
import { useSeasonalColors } from '@/hooks/useSeasonalColors';

interface FastMover {
  id: string;
  medicine: string;
  currentStock: number;
  demandRate: number;
  daysUntilOut: number;
  urgency: 'critical' | 'high' | 'medium';
  suggestedOrder: number;
}

interface FastMoversAlertProps {
  fastMovers: FastMover[];
  selectedSeason?: string;
}

const FastMoversAlert: React.FC<FastMoversAlertProps> = ({ fastMovers, selectedSeason = 'all' }) => {
  const { getUrgencyColor } = useSeasonalColors();

  // Sort fast movers by days left (low to high - most urgent first)
  const sortedFastMovers = [...fastMovers].sort((a, b) => a.daysUntilOut - b.daysUntilOut);

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <AlertTriangle size={16} />;
      case 'high':
        return <TrendingUp size={16} />;
      case 'medium':
        return <Clock size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  const getDaysColor = (days: number) => {
    if (days <= 3) return 'var(--destructive)';
    if (days <= 7) return 'var(--accent)';
    return 'var(--chart-3)';
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <style>
        {`
          .fast-movers-scroll::-webkit-scrollbar {
            width: 6px;
          }
          
          .fast-movers-scroll::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 3px;
          }
          
          .fast-movers-scroll::-webkit-scrollbar-thumb {
            background: var(--muted-foreground);
            border-radius: 3px;
            opacity: 0.5;
          }
          
          .fast-movers-scroll::-webkit-scrollbar-thumb:hover {
            background: var(--foreground);
            opacity: 0.8;
          }
        `}
      </style>
      
      <h3 style={{ 
        fontSize: '1.125rem', 
        fontWeight: '600', 
        margin: 0,
        marginBottom: 'var(--spacing-md)',
        color: 'var(--text-primary)'
      }}>
        {selectedSeason === 'all' ? 'Fast Movers Alert' : 
         selectedSeason === 'summer' ? 'Summer Fast Movers' :
         selectedSeason === 'monsoon' ? 'Monsoon Fast Movers' :
         selectedSeason === 'winter' ? 'Winter Fast Movers' : 'Fast Movers Alert'}
      </h3>
      
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}>
        {sortedFastMovers.length === 0 ? (
          <div style={{
            padding: 'var(--spacing-xl)',
            textAlign: 'center',
            color: 'var(--muted-foreground)',
            fontSize: '0.875rem',
            background: 'var(--muted)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Package size={24} style={{ marginBottom: 'var(--spacing-sm)', opacity: 0.5 }} />
            <div>No fast movers detected</div>
            <div style={{ fontSize: '0.75rem', marginTop: 'var(--spacing-xs)' }}>
              All medicines have adequate stock levels
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div 
              className="fast-movers-scroll"
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                maxHeight: '850px',
                overflowY: 'auto',
                paddingRight: 'var(--spacing-sm)',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--muted-foreground) transparent',
                scrollBehavior: 'smooth'
              }}>
              {sortedFastMovers.map((mover, index) => (
                <div
                  key={mover.id}
                  style={{
                    padding: 'var(--spacing-lg)',
                    borderBottom: index < sortedFastMovers.length - 1 ? '1px solid var(--border)' : 'none',
                    background: 'var(--card)',
                    transition: 'all var(--transition-fast)',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--card-hover)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--card)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
                  <div style={{ 
                    color: getUrgencyColor(mover.urgency),
                    marginTop: '4px',
                    padding: 'var(--spacing-sm)',
                    background: `${getUrgencyColor(mover.urgency)}20`,
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${getUrgencyColor(mover.urgency)}40`
                  }}>
                    {getUrgencyIcon(mover.urgency)}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-sm)' }}>
                      <div>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: '1rem', 
                          fontWeight: '600',
                          color: 'var(--foreground)',
                          marginBottom: 'var(--spacing-xs)'
                        }}>
                          {mover.medicine}
                        </h4>
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-xs)',
                          fontSize: '0.75rem',
                          color: getDaysColor(mover.daysUntilOut),
                          fontWeight: '600'
                        }}>
                          <Clock size={12} />
                          {mover.daysUntilOut} days left
                        </div>
                      </div>
                      
                      <div style={{ 
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        background: getUrgencyColor(mover.urgency),
                        color: 'white',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.6875rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {mover.urgency} priority
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 'var(--spacing-md)',
                      marginBottom: 'var(--spacing-sm)'
                    }}>
                      <div style={{
                        padding: 'var(--spacing-sm)',
                        background: 'var(--muted)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)'
                      }}>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '600',
                          color: 'var(--muted-foreground)',
                          marginBottom: 'var(--spacing-xs)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Current Stock
                        </div>
                        <div style={{ 
                          fontSize: '1.125rem', 
                          fontWeight: '700',
                          color: 'var(--foreground)'
                        }}>
                          {mover.currentStock.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                          units
                        </div>
                      </div>
                      
                      <div style={{
                        padding: 'var(--spacing-sm)',
                        background: 'var(--muted)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)'
                      }}>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '600',
                          color: 'var(--muted-foreground)',
                          marginBottom: 'var(--spacing-xs)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Demand Rate
                        </div>
                        <div style={{ 
                          fontSize: '1.125rem', 
                          fontWeight: '700',
                          color: 'var(--foreground)'
                        }}>
                          {mover.demandRate.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                          per day
                        </div>
                      </div>
                      
                      <div style={{
                        padding: 'var(--spacing-sm)',
                        background: 'var(--muted)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)'
                      }}>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '600',
                          color: 'var(--muted-foreground)',
                          marginBottom: 'var(--spacing-xs)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Suggested Order
                        </div>
                        <div style={{ 
                          fontSize: '1.125rem', 
                          fontWeight: '700',
                          color: 'var(--foreground)'
                        }}>
                          {mover.suggestedOrder.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                          units
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      padding: 'var(--spacing-sm)',
                      background: `${getUrgencyColor(mover.urgency)}10`,
                      border: `1px solid ${getUrgencyColor(mover.urgency)}30`,
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      color: 'var(--muted-foreground)'
                    }}>
                      <strong>Action Required:</strong> {mover.urgency === 'critical' ? 'Immediate restocking needed' : 
                                                      mover.urgency === 'high' ? 'Order within 2-3 days' : 
                                                      'Monitor closely and order soon'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Fade effect at bottom */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 'var(--spacing-sm)',
              height: '20px',
              background: 'linear-gradient(transparent, var(--card))',
              pointerEvents: 'none',
              opacity: 0.8
            }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FastMoversAlert;
