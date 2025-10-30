import React, { useState } from 'react';
import { Calendar, Clock, ShoppingCart, AlertTriangle } from 'lucide-react';

interface WeekPlan {
  week: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  items: string[];
  estimatedCost: number;
  status: 'pending' | 'in-progress' | 'completed';
}

interface OrderingCalendarProps {
  weeks: WeekPlan[];
  selectedSeason?: string;
}

const OrderingCalendar: React.FC<OrderingCalendarProps> = ({ weeks, selectedSeason = 'all' }) => {
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'var(--destructive)';
      case 'high':
        return 'var(--accent)';
      case 'medium':
        return 'var(--chart-3)';
      case 'low':
        return 'var(--muted-foreground)';
      default:
        return 'var(--muted-foreground)';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle size={14} />;
      case 'high':
        return <ShoppingCart size={14} />;
      case 'medium':
        return <Clock size={14} />;
      case 'low':
        return <Calendar size={14} />;
      default:
        return <Calendar size={14} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'var(--chart-5)';
      case 'in-progress':
        return 'var(--accent)';
      case 'pending':
        return 'var(--muted-foreground)';
      default:
        return 'var(--muted-foreground)';
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <style>
        {`
          .ordering-calendar-scroll::-webkit-scrollbar {
            width: 6px;
          }
          
          .ordering-calendar-scroll::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 3px;
          }
          
          .ordering-calendar-scroll::-webkit-scrollbar-thumb {
            background: var(--muted-foreground);
            border-radius: 3px;
            opacity: 0.5;
          }
          
          .ordering-calendar-scroll::-webkit-scrollbar-thumb:hover {
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
        {selectedSeason === 'all' ? 'Week-by-Week Ordering Calendar' : 
         selectedSeason === 'summer' ? 'Summer Ordering Calendar' :
         selectedSeason === 'monsoon' ? 'Monsoon Ordering Calendar' :
         selectedSeason === 'winter' ? 'Winter Ordering Calendar' : 'Week-by-Week Ordering Calendar'}
      </h3>
      
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {weeks.length === 0 ? (
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
            <Calendar size={24} style={{ marginBottom: 'var(--spacing-sm)', opacity: 0.5 }} />
            <div>No ordering plans available</div>
            <div style={{ fontSize: '0.75rem', marginTop: 'var(--spacing-xs)' }}>
              Create weekly ordering schedules
            </div>
          </div>
        ) : (
          <div 
            className="ordering-calendar-scroll"
            style={{ 
              display: 'flex', 
              flexDirection: 'column',
              flex: 1,
              overflowY: 'auto',
              maxHeight: '500px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--muted-foreground) transparent'
            }}>
            {weeks.map((week, index) => (
              <div
                key={week.week}
                style={{
                  padding: 'var(--spacing-lg)',
                  borderBottom: index < weeks.length - 1 ? '1px solid var(--border)' : 'none',
                  background: selectedWeek === week.week ? 'var(--card-hover)' : 'var(--surface)',
                  transition: 'all var(--transition-fast)',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => setSelectedWeek(selectedWeek === week.week ? null : week.week)}
                onMouseEnter={(e) => {
                  if (selectedWeek !== week.week) {
                    e.currentTarget.style.background = 'var(--card-hover)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedWeek !== week.week) {
                    e.currentTarget.style.background = 'var(--surface)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
                  <div style={{ 
                    color: getPriorityColor(week.priority),
                    marginTop: '4px',
                    padding: 'var(--spacing-sm)',
                    background: `${getPriorityColor(week.priority)}20`,
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${getPriorityColor(week.priority)}40`
                  }}>
                    {getPriorityIcon(week.priority)}
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
                          {week.week}
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
                            background: getPriorityColor(week.priority),
                            color: 'white',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.6875rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            {week.priority} Priority
                          </span>
                          <span>•</span>
                          <span>{week.items.length} items</span>
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '1.125rem', 
                          fontWeight: '700',
                          color: 'var(--text-primary)',
                          marginBottom: 'var(--spacing-xs)'
                        }}>
                          ₹{week.estimatedCost.toLocaleString()}
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: getStatusColor(week.status),
                          textTransform: 'capitalize',
                          fontWeight: '600'
                        }}>
                          {week.status.replace('-', ' ')}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
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
                          Total Items
                        </div>
                        <div style={{ 
                          fontSize: '1.125rem', 
                          fontWeight: '700',
                          color: 'var(--text-primary)'
                        }}>
                          {week.items.length}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                          medicines
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
                          Estimated Cost
                        </div>
                        <div style={{ 
                          fontSize: '1.125rem', 
                          fontWeight: '700',
                          color: 'var(--text-primary)'
                        }}>
                          ₹{week.estimatedCost.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                          total budget
                        </div>
                      </div>
                    </div>
                    
                    {selectedWeek === week.week && (
                      <div style={{ 
                        marginTop: 'var(--spacing-sm)',
                        padding: 'var(--spacing-sm)',
                        background: `${getPriorityColor(week.priority)}10`,
                        border: `1px solid ${getPriorityColor(week.priority)}30`,
                        borderRadius: 'var(--radius-sm)'
                      }}>
                        <h5 style={{ 
                          margin: 0, 
                          fontSize: '0.8125rem', 
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          marginBottom: 'var(--spacing-sm)'
                        }}>
                          Items to Order:
                        </h5>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                          {week.items.map((item, itemIndex) => (
                            <span
                              key={itemIndex}
                              style={{
                                background: 'var(--surface-hover)',
                                color: 'var(--text-primary)',
                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.75rem',
                                border: '1px solid var(--border)',
                                fontWeight: '500'
                              }}
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div style={{
                      padding: 'var(--spacing-sm)',
                      background: `${getPriorityColor(week.priority)}10`,
                      border: `1px solid ${getPriorityColor(week.priority)}30`,
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      color: 'var(--muted-foreground)'
                    }}>
                      <strong>Status:</strong> {week.status === 'pending' ? 'Ready to order' : 
                                            week.status === 'in-progress' ? 'Order in progress' : 
                                            'Order completed'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderingCalendar;
