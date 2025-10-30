import React from 'react';
import { AlertTriangle, ShoppingCart, Clock, CheckCircle, IndianRupee } from 'lucide-react';

interface ImmediateAction {
  id: string;
  title: string;
  description: string;
  urgency: 'critical' | 'high' | 'medium';
  estimatedBudget: number;
  deadline: string;
  icon: React.ReactNode;
}

interface ImmediateActionsListProps {
  actions: ImmediateAction[];
  selectedSeason?: string;
}

const ImmediateActionsList: React.FC<ImmediateActionsListProps> = ({ actions, selectedSeason = 'all' }) => {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'var(--destructive)';
      case 'high':
        return 'var(--accent)';
      case 'medium':
        return 'var(--chart-3)';
      default:
        return 'var(--muted-foreground)';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <AlertTriangle size={16} />;
      case 'high':
        return <ShoppingCart size={16} />;
      case 'medium':
        return <Clock size={16} />;
      default:
        return <CheckCircle size={16} />;
    }
  };

  return (
    <div>
      <h3 style={{ 
        fontSize: '1.125rem', 
        fontWeight: '600', 
        margin: 0,
        marginBottom: 'var(--spacing-md)',
        color: 'var(--text-primary)'
      }}>
        {selectedSeason === 'all' ? 'Immediate Actions Required' : 
         selectedSeason === 'summer' ? 'Summer Actions Required' :
         selectedSeason === 'monsoon' ? 'Monsoon Actions Required' :
         selectedSeason === 'winter' ? 'Winter Actions Required' : 'Immediate Actions Required'}
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {actions.map((action) => (
          <div
            key={action.id}
            style={{
              padding: 'var(--spacing-md)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              borderLeft: `4px solid ${getUrgencyColor(action.urgency)}`,
              transition: 'all var(--transition-fast)',
              cursor: 'pointer'
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
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
              <div style={{ 
                color: getUrgencyColor(action.urgency),
                marginTop: '2px'
              }}>
                {getUrgencyIcon(action.urgency)}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-xs)' }}>
                  <h4 style={{ 
                    margin: 0, 
                    fontSize: '0.9375rem', 
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    {action.title}
                  </h4>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    fontSize: '0.75rem',
                    color: 'var(--chart-5)',
                    fontWeight: '600'
                  }}>
                    <IndianRupee size={12} />
                    ₹{action.estimatedBudget.toLocaleString()}
                  </div>
                </div>
                
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.8125rem', 
                  color: 'var(--muted-foreground)',
                  lineHeight: '1.4',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  {action.description}
                </p>
                
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  fontSize: '0.75rem',
                  color: 'var(--muted-foreground)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                    <Clock size={12} />
                    Due: {action.deadline}
                  </div>
                  <div style={{ 
                    padding: '2px 6px',
                    background: getUrgencyColor(action.urgency),
                    color: 'white',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {action.urgency}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImmediateActionsList;
