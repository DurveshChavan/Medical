import React from 'react';
import { TrendingUp, Award, Star } from 'lucide-react';
import { useSeasonalColors } from '@/hooks/useSeasonalColors';

interface TopMedicine {
  rank: number;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
  growthRate: number;
  trend: 'up' | 'down' | 'stable';
}

interface TopMedicinesSoldProps {
  medicines: TopMedicine[];
  selectedSeason?: string;
}

const TopMedicinesSold: React.FC<TopMedicinesSoldProps> = ({ medicines, selectedSeason = 'all' }) => {
  const { getRankColor } = useSeasonalColors();

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      const color = getRankColor(rank);
      return <Award size={16} style={{ color }} />;
    }
    return <span style={{ 
      fontSize: '0.75rem', 
      fontWeight: '600',
      color: 'var(--muted-foreground)',
      minWidth: '16px',
      textAlign: 'center'
    }}>#{rank}</span>;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={14} style={{ color: '#22c55e' }} />;
      case 'down':
        return <TrendingUp size={14} style={{ color: 'var(--destructive)', transform: 'rotate(180deg)' }} />;
      case 'stable':
        return <Star size={14} style={{ color: 'var(--muted-foreground)' }} />;
      default:
        return <Star size={14} style={{ color: 'var(--muted-foreground)' }} />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return '#22c55e';
      case 'down':
        return 'var(--destructive)';
      case 'stable':
        return 'var(--muted-foreground)';
      default:
        return 'var(--muted-foreground)';
    }
  };

  return (
    <div>
      <style>
        {`
          .top-medicines-scroll::-webkit-scrollbar {
            width: 6px;
          }
          
          .top-medicines-scroll::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 3px;
          }
          
          .top-medicines-scroll::-webkit-scrollbar-thumb {
            background: var(--muted-foreground);
            border-radius: 3px;
            opacity: 0.5;
          }
          
          .top-medicines-scroll::-webkit-scrollbar-thumb:hover {
            background: var(--text-primary);
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
        {selectedSeason === 'all' ? 'Top Medicines Sold' : 
         selectedSeason === 'summer' ? 'Top Summer Medicines' :
         selectedSeason === 'monsoon' ? 'Top Monsoon Medicines' :
         selectedSeason === 'winter' ? 'Top Winter Medicines' : 'Top Medicines Sold'}
      </h3>
      
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {medicines.length === 0 ? (
          <div style={{
            padding: 'var(--spacing-xl)',
            textAlign: 'center',
            color: 'var(--muted-foreground)',
            fontSize: '0.875rem',
            background: 'var(--muted)'
          }}>
            <Award size={24} style={{ marginBottom: 'var(--spacing-sm)', opacity: 0.5 }} />
            <div>No medicine data available</div>
            <div style={{ fontSize: '0.75rem', marginTop: 'var(--spacing-xs)' }}>
              Sales data will appear here
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div 
              className="top-medicines-scroll"
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                maxHeight: '400px',
                overflowY: 'auto',
                paddingRight: 'var(--spacing-sm)',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--muted-foreground) transparent'
              }}
            >
              {medicines.slice(0, 10).map((medicine, index) => (
                <div
                  key={medicine.rank}
                  style={{
                    padding: 'var(--spacing-lg)',
                    borderBottom: index < Math.min(medicines.length, 10) - 1 ? '1px solid var(--border)' : 'none',
                    background: 'var(--surface)',
                    transition: 'all var(--transition-fast)',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--card-hover)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--surface)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '32px',
                      height: '32px',
                      background: medicine.rank <= 3 ? `${getRankColor(medicine.rank)}20` : 'var(--muted)',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${medicine.rank <= 3 ? getRankColor(medicine.rank) : 'var(--border)'}`
                    }}>
                      {getRankIcon(medicine.rank)}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-sm)' }}>
                        <div>
                          <h4 style={{ 
                            margin: 0, 
                            fontSize: '1rem', 
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginBottom: 'var(--spacing-xs)'
                          }}>
                            {medicine.name}
                          </h4>
                          <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)',
                            fontSize: '0.75rem',
                            color: 'var(--muted-foreground)'
                          }}>
                            <span style={{ 
                              padding: 'var(--spacing-xs) var(--spacing-sm)',
                              background: 'var(--muted)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.6875rem',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}>
                              {medicine.category}
                            </span>
                            <span>•</span>
                            <span>Rank #{medicine.rank}</span>
                          </div>
                        </div>
                        
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-xs)',
                          fontSize: '0.75rem',
                          color: getTrendColor(medicine.trend),
                          padding: 'var(--spacing-xs) var(--spacing-sm)',
                          background: `${getTrendColor(medicine.trend)}20`,
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${getTrendColor(medicine.trend)}40`
                        }}>
                          {getTrendIcon(medicine.trend)}
                          <span style={{ fontWeight: '600' }}>
                            {medicine.growthRate > 0 ? '+' : ''}{medicine.growthRate}%
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
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
                            Units Sold
                          </div>
                          <div style={{ 
                            fontSize: '1.125rem', 
                            fontWeight: '700',
                            color: 'var(--text-primary)'
                          }}>
                            {medicine.unitsSold.toLocaleString()}
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
                            Revenue
                          </div>
                          <div style={{ 
                            fontSize: '1.125rem', 
                            fontWeight: '700',
                            color: 'var(--text-primary)'
                          }}>
                            ₹{medicine.revenue.toLocaleString()}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                            total sales
                          </div>
                        </div>
                      </div>
                      
                      <div style={{
                        padding: 'var(--spacing-sm)',
                        background: `${getTrendColor(medicine.trend)}10`,
                        border: `1px solid ${getTrendColor(medicine.trend)}30`,
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        color: 'var(--muted-foreground)'
                      }}>
                        <strong>Performance:</strong> {medicine.trend === 'up' ? 'Strong growth trend' : 
                                                    medicine.trend === 'down' ? 'Declining performance' : 
                                                    'Stable performance'} • {medicine.growthRate > 0 ? '+' : ''}{medicine.growthRate}% growth rate
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Fade effect at bottom */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 'var(--spacing-sm)',
              height: '20px',
              background: 'linear-gradient(transparent, var(--surface))',
              pointerEvents: 'none',
              opacity: 0.8
            }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TopMedicinesSold;
