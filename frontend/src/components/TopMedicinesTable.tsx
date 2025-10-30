import React from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';

interface TopMedicine {
  rank: number;
  medicineName: string;
  lastSeasonSales: number;
  suggestedStock: number;
  category?: string;
  growthRate?: number;
}

interface TopMedicinesTableProps {
  medicines: TopMedicine[];
  season: string;
  onMedicineClick?: (medicine: TopMedicine) => void;
}

const TopMedicinesTable: React.FC<TopMedicinesTableProps> = ({ 
  medicines, 
  season,
  onMedicineClick 
}) => {
  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) {
      return {
        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
        color: '#000',
        fontWeight: '700'
      };
    } else if (rank === 2) {
      return {
        background: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
        color: '#000',
        fontWeight: '700'
      };
    } else if (rank === 3) {
      return {
        background: 'linear-gradient(135deg, #CD7F32, #B8860B)',
        color: '#fff',
        fontWeight: '700'
      };
    } else {
      return {
        background: 'var(--card-hover)',
        color: 'var(--muted-foreground)',
        fontWeight: '600'
      };
    }
  };

  const getSeasonColor = (season: string): string => {
    const colors: Record<string, string> = {
      'Summer': 'var(--season-summer)',
      'Monsoon': 'var(--season-monsoon)',
      'Winter': 'var(--season-winter)',
      'All Season': 'var(--season-all)'
    };
    return colors[season] || 'var(--accent)';
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ 
        padding: 'var(2rem) var(2rem) var(1.5rem)',
        borderBottom: '1px solid var(--border)'
      }}>
        <h3 style={{ 
          fontSize: '1.125rem',
          fontWeight: '600',
          color: 'var(--foreground)',
          marginBottom: '0.25rem',
          fontFamily: 'DM Sans, sans-serif'
        }}>
          Top Medicines - {season}
        </h3>
        <p style={{ 
          fontSize: '0.875rem',
          color: 'var(--muted-foreground)',
          fontFamily: 'DM Sans, sans-serif'
        }}>
          Best performing medicines with stock recommendations
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'DM Sans, sans-serif'
        }}>
          <thead>
            <tr style={{
              borderBottom: '1px solid var(--border)',
              background: 'var(--background)'
            }}>
              <th style={{ 
                width: '80px',
                padding: 'var(1rem) var(1.5rem)',
                textAlign: 'center',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: 'var(--muted-foreground)',
                verticalAlign: 'middle'
              }}>
                Rank
              </th>
              <th style={{ 
                width: '35%',
                padding: 'var(1rem) var(1.5rem)',
                textAlign: 'left',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: 'var(--muted-foreground)',
                verticalAlign: 'middle'
              }}>
                Medicine Name
              </th>
              <th style={{ 
                width: '25%',
                padding: 'var(1rem) var(1.5rem)',
                textAlign: 'right',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: 'var(--muted-foreground)',
                verticalAlign: 'middle'
              }}>
                Last Season's Sales
              </th>
              <th style={{ 
                width: '25%',
                padding: 'var(1rem) var(1.5rem)',
                textAlign: 'right',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: 'var(--muted-foreground)',
                verticalAlign: 'middle'
              }}>
                Suggested Stock
              </th>
              <th style={{ 
                width: '15%',
                padding: 'var(1rem) var(1.5rem)',
                textAlign: 'center',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: 'var(--muted-foreground)',
                verticalAlign: 'middle'
              }}>
                Trend
              </th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((medicine, index) => (
              <tr
                key={medicine.rank}
                onClick={() => onMedicineClick?.(medicine)}
                style={{
                  borderBottom: index < medicines.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background-color var(150ms ease-in-out)',
                  cursor: onMedicineClick ? 'pointer' : 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--card-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <td style={{ 
                  padding: 'var(1rem) var(1.5rem)',
                  textAlign: 'center',
                  verticalAlign: 'middle'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    fontSize: '0.875rem',
                    fontFamily: 'Space Mono, monospace',
                    ...getRankBadgeStyle(medicine.rank)
                  }}>
                    {medicine.rank}
                  </div>
                </td>
                <td style={{ 
                  padding: 'var(1rem) var(1.5rem)',
                  verticalAlign: 'middle'
                }}>
                  <div style={{ 
                    fontSize: '0.9375rem',
                    fontWeight: '600',
                    color: 'var(--foreground)',
                    marginBottom: '0.25rem'
                  }}>
                    {medicine.medicineName}
                  </div>
                  {medicine.category && (
                    <div style={{ 
                      fontSize: '0.75rem',
                      color: 'var(--muted-foreground)'
                    }}>
                      {medicine.category}
                    </div>
                  )}
                </td>
                <td style={{ 
                  padding: 'var(1rem) var(1.5rem)',
                  textAlign: 'right',
                  fontSize: '0.9375rem',
                  fontWeight: '500',
                  fontFamily: 'Space Mono, monospace',
                  color: 'var(--foreground)',
                  verticalAlign: 'middle'
                }}>
                  {medicine.lastSeasonSales.toLocaleString()}
                </td>
                <td style={{ 
                  padding: 'var(1rem) var(1.5rem)',
                  textAlign: 'right',
                  verticalAlign: 'middle'
                }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.375rem 0.75rem',
                    background: `${getSeasonColor(season)}15`,
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.9375rem',
                    fontWeight: '600',
                    fontFamily: 'Space Mono, monospace',
                    color: getSeasonColor(season)
                  }}>
                    {medicine.suggestedStock.toLocaleString()}
                    <ArrowUpRight size={14} />
                  </div>
                </td>
                <td style={{ 
                  padding: 'var(1rem) var(1.5rem)',
                  textAlign: 'center',
                  verticalAlign: 'middle'
                }}>
                  {medicine.growthRate !== undefined && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.625rem',
                      background: medicine.growthRate >= 0 ? '#dcfce7' : 'var(--destructive-light)',
                      color: medicine.growthRate >= 0 ? '#22c55e' : 'var(--destructive)',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      fontFamily: 'Space Mono, monospace'
                    }}>
                      <TrendingUp size={12} />
                      {medicine.growthRate >= 0 ? '+' : ''}{medicine.growthRate}%
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopMedicinesTable;

