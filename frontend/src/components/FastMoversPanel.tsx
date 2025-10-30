import React from 'react';
import { Zap, TrendingUp, AlertCircle } from 'lucide-react';

interface FastMover {
  id: number;
  name: string;
  category: string;
  predictedSales: number;
  currentStock: number;
  daysUntilStockout: number;
}

interface FastMoversPanelProps {
  medicines: FastMover[];
  season: string;
}

const FastMoversPanel: React.FC<FastMoversPanelProps> = ({ medicines, season }) => {
  const getSeasonColor = (season: string): string => {
    const colors: Record<string, string> = {
      'Summer': 'var(--season-summer)',
      'Monsoon': 'var(--season-monsoon)',
      'Winter': 'var(--season-winter)',
      'All Season': 'var(--season-all)'
    };
    return colors[season] || 'var(--accent)';
  };

  const getUrgencyLevel = (days: number): { color: string; label: string } => {
    if (days <= 3) {
      return { color: 'var(--destructive)', label: 'Critical' };
    } else if (days <= 7) {
      return { color: 'var(--accent)', label: 'Urgent' };
    } else {
      return { color: 'var(--secondary)', label: 'Monitor' };
    }
  };

  return (
    <div className="card" style={{ 
      padding: 'var(2.5rem)',
      background: 'var(--card)',
      border: `2px solid ${getSeasonColor(season)}20`,
      position: 'sticky',
      top: 'var(2rem)',
      minHeight: 'fit-content'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 'var(1rem)',
        marginBottom: 'var(1.5rem)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-lg)',
          background: `${getSeasonColor(season)}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: getSeasonColor(season)
        }}>
          <Zap size={24} />
        </div>
        <div>
          <h3 style={{ 
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--foreground)',
            marginBottom: '0.25rem',
            fontFamily: 'DM Sans, sans-serif'
          }}>
            Fast Movers Alert
          </h3>
          <p style={{ 
            fontSize: '0.8125rem',
            color: 'var(--muted-foreground)',
            fontFamily: 'DM Sans, sans-serif'
          }}>
            Predicted high-demand medicines
          </p>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(1.25rem)' 
      }}>
        {medicines.map((medicine, index) => {
          const urgency = getUrgencyLevel(medicine.daysUntilStockout);
          
          return (
            <div
              key={medicine.id}
              style={{
                padding: 'var(1.25rem)',
                background: 'var(--card-hover)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                transition: 'all var(150ms ease-in-out)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = getSeasonColor(season);
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 'var(0.75rem)'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: `${getSeasonColor(season)}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      fontFamily: 'Space Mono, monospace',
                      color: getSeasonColor(season)
                    }}>
                      {index + 1}
                    </div>
                    <h4 style={{ 
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      color: 'var(--foreground)',
                      fontFamily: 'DM Sans, sans-serif'
                    }}>
                      {medicine.name}
                    </h4>
                  </div>
                  <p style={{ 
                    fontSize: '0.75rem',
                    color: 'var(--muted-foreground)',
                    marginLeft: '2rem',
                    fontFamily: 'DM Sans, sans-serif'
                  }}>
                    {medicine.category}
                  </p>
                </div>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.625rem',
                  fontWeight: '600',
                  background: `${urgency.color}15`,
                  color: urgency.color,
                  fontFamily: 'DM Sans, sans-serif'
                }}>
                  {urgency.label}
                </span>
              </div>

              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 'var(0.75rem)',
                marginTop: 'var(1.25rem)'
              }}>
                <div>
                  <div style={{ 
                    fontSize: '0.6875rem',
                    color: 'var(--muted-foreground)',
                    marginBottom: '0.25rem',
                    fontFamily: 'DM Sans, sans-serif'
                  }}>
                    Predicted
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: getSeasonColor(season),
                    fontFamily: 'Space Mono, monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <TrendingUp size={12} />
                    {medicine.predictedSales.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ 
                    fontSize: '0.6875rem',
                    color: 'var(--muted-foreground)',
                    marginBottom: '0.25rem',
                    fontFamily: 'DM Sans, sans-serif'
                  }}>
                    In Stock
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--foreground)',
                    fontFamily: 'Space Mono, monospace'
                  }}>
                    {medicine.currentStock.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ 
                    fontSize: '0.6875rem',
                    color: 'var(--muted-foreground)',
                    marginBottom: '0.25rem',
                    fontFamily: 'DM Sans, sans-serif'
                  }}>
                    Days Left
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: urgency.color,
                    fontFamily: 'Space Mono, monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {medicine.daysUntilStockout <= 7 && <AlertCircle size={12} />}
                    {medicine.daysUntilStockout}d
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: 'var(1rem)' }}>
                <div style={{
                  height: '4px',
                  background: 'var(--border)',
                  borderRadius: '9999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min((medicine.currentStock / medicine.predictedSales) * 100, 100)}%`,
                    background: urgency.color,
                    borderRadius: '9999px',
                    transition: 'width var(250ms ease-in-out)'
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 'var(2rem)',
        padding: 'var(1.25rem)',
        background: `${getSeasonColor(season)}08`,
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${getSeasonColor(season)}30`
      }}>
        <p style={{
          fontSize: '0.8125rem',
          color: 'var(--muted-foreground)',
          lineHeight: '1.5',
          fontFamily: 'DM Sans, sans-serif'
        }}>
          💡 <strong>Tip:</strong> Stock up on these medicines early to avoid shortages during peak {season.toLowerCase()} season.
        </p>
      </div>
    </div>
  );
};

export default FastMoversPanel;

