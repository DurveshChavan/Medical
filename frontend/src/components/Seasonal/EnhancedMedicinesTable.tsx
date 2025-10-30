import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface Medicine {
  id: number;
  name: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  suggestedStock: number;
  estimatedCost: number;
  currentStock: number;
  stockStatus: 'out' | 'low' | 'adequate';
}

interface EnhancedMedicinesTableProps {
  medicines: Medicine[];
  selectedSeason?: string;
}

const EnhancedMedicinesTable: React.FC<EnhancedMedicinesTableProps> = ({ medicines, selectedSeason = 'all' }) => {
  const [sortField, setSortField] = useState<keyof Medicine>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof Medicine) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getPriorityTag = (priority: string) => {
    const config = {
      critical: { emoji: '🔴', color: 'var(--destructive)', text: 'CRITICAL' },
      high: { emoji: '🟡', color: 'var(--accent)', text: 'HIGH' },
      medium: { emoji: '🟢', color: 'var(--chart-3)', text: 'MEDIUM' },
      low: { emoji: '🔵', color: 'var(--muted-foreground)', text: 'LOW' }
    };
    
    const { emoji, color, text } = config[priority as keyof typeof config] || config.low;
    
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        background: color,
        color: 'white',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.75rem',
        fontWeight: '600',
        textTransform: 'uppercase'
      }}>
        {emoji} {text}
      </span>
    );
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out':
        return 'var(--destructive)';
      case 'low':
        return 'var(--accent)';
      case 'adequate':
        return 'var(--chart-5)';
      default:
        return 'var(--muted-foreground)';
    }
  };

  const getSortIcon = (field: keyof Medicine) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} />;
    }
    return sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const sortedMedicines = [...medicines].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ 
        fontSize: '1.125rem', 
        fontWeight: '600', 
        margin: 0,
        marginBottom: 'var(--spacing-md)',
        color: 'var(--text-primary)'
      }}>
        {selectedSeason === 'all' ? 'Priority Medicine Recommendations' : 
         selectedSeason === 'summer' ? 'Summer Priority Medicines' :
         selectedSeason === 'monsoon' ? 'Monsoon Priority Medicines' :
         selectedSeason === 'winter' ? 'Winter Priority Medicines' : 'Priority Medicine Recommendations'}
      </h3>
      
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {sortedMedicines.length === 0 ? (
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
            <ArrowUpDown size={24} style={{ marginBottom: 'var(--spacing-sm)', opacity: 0.5 }} />
            <div>No recommendations available</div>
            <div style={{ fontSize: '0.75rem', marginTop: 'var(--spacing-xs)' }}>
              Medicine recommendations will appear here
            </div>
          </div>
        ) : (
          <>
            {/* Enhanced Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
              background: 'var(--surface-hover)',
              borderBottom: '1px solid var(--border)',
              padding: 'var(--spacing-sm) 0'
            }}>
              {[
                { field: 'name', label: 'Medicine Name' },
                { field: 'priority', label: 'Priority' },
                { field: 'suggestedStock', label: 'Suggested Stock' },
                { field: 'estimatedCost', label: 'Estimated Cost' },
                { field: 'currentStock', label: 'Current Stock' },
                { field: 'stockStatus', label: 'Status' }
              ].map(({ field, label }) => (
                <button
                  key={field}
                  onClick={() => handleSort(field as keyof Medicine)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    padding: 'var(--spacing-md)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--foreground)',
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    textAlign: 'left',
                    borderRadius: 'var(--radius-sm)',
                    margin: '0 var(--spacing-xs)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--card-hover)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {label}
                  {getSortIcon(field as keyof Medicine)}
                </button>
              ))}
            </div>

            {/* Enhanced Table Body */}
            <div style={{ 
              flex: 1,
              overflowY: 'auto',
              maxHeight: '400px'
            }}>
              {sortedMedicines.map((medicine, index) => (
                <div
                  key={medicine.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                    padding: 'var(--spacing-lg)',
                    borderBottom: index < sortedMedicines.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'all var(--transition-fast)',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--card-hover)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Medicine Name */}
                  <div style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600',
                    color: 'var(--foreground)',
                    marginBottom: 'var(--spacing-xs)'
                  }}>
                    {medicine.name}
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--muted-foreground)',
                      marginTop: 'var(--spacing-xs)',
                      fontWeight: '500'
                    }}>
                      {medicine.category}
                    </div>
                  </div>
                  
                  {/* Priority */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getPriorityTag(medicine.priority)}
                  </div>
                  
                  {/* Suggested Stock */}
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{ 
                      fontSize: '1.125rem',
                      color: 'var(--foreground)',
                      fontFamily: 'Space Mono, monospace',
                      fontWeight: '700'
                    }}>
                      {medicine.suggestedStock.toLocaleString()}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem',
                      color: 'var(--muted-foreground)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      units
                    </div>
                  </div>
                  
                  {/* Estimated Cost */}
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{ 
                      fontSize: '1.125rem',
                      color: 'var(--chart-5)',
                      fontFamily: 'Space Mono, monospace',
                      fontWeight: '700'
                    }}>
                      ₹{medicine.estimatedCost.toLocaleString()}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem',
                      color: 'var(--muted-foreground)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      cost
                    </div>
                  </div>
                  
                  {/* Current Stock */}
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{ 
                      fontSize: '1.125rem',
                      color: 'var(--foreground)',
                      fontFamily: 'Space Mono, monospace',
                      fontWeight: '700'
                    }}>
                      {medicine.currentStock.toLocaleString()}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem',
                      color: 'var(--muted-foreground)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      units
                    </div>
                  </div>
                  
                  {/* Stock Status */}
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{ 
                      fontSize: '0.75rem',
                      color: getStockStatusColor(medicine.stockStatus),
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      background: `${getStockStatusColor(medicine.stockStatus)}20`,
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${getStockStatusColor(medicine.stockStatus)}40`,
                      letterSpacing: '0.05em'
                    }}>
                      {medicine.stockStatus}
                    </div>
                    <div style={{ 
                      fontSize: '0.6875rem',
                      color: 'var(--muted-foreground)',
                      marginTop: 'var(--spacing-xs)',
                      textAlign: 'center'
                    }}>
                      {medicine.stockStatus === 'out' ? 'Out of Stock' :
                       medicine.stockStatus === 'low' ? 'Low Stock' :
                       'Adequate Stock'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EnhancedMedicinesTable;
