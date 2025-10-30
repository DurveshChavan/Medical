import React from 'react';
import { AlertTriangle, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface ActionItem {
  id: string;
  title: string;
  description: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  icon: React.ReactNode;
}

interface ActionsPanelProps {
  actions: ActionItem[];
}

const ActionsPanel: React.FC<ActionsPanelProps> = ({ actions }) => {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
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

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <AlertTriangle size={16} />;
      case 'high':
        return <AlertCircle size={16} />;
      case 'medium':
        return <Clock size={16} />;
      case 'low':
        return <CheckCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <h3 style={{ 
        fontSize: '1.125rem', 
        fontWeight: '600', 
        margin: 0,
        color: 'var(--foreground)'
      }}>
        Immediate Actions
      </h3>
      
      {actions.length === 0 ? (
        <div style={{
          padding: 'var(--spacing-lg)',
          textAlign: 'center',
          color: 'var(--muted-foreground)',
          fontSize: '0.875rem'
        }}>
          No immediate actions required
        </div>
      ) : (
        actions.map((action) => (
          <div
            key={action.id}
            style={{
              padding: 'var(--spacing-md)',
              background: 'var(--card)',
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
              e.currentTarget.style.background = 'var(--card)';
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
                <h4 style={{ 
                  margin: 0, 
                  fontSize: '0.9375rem', 
                  fontWeight: '600',
                  color: 'var(--foreground)',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  {action.title}
                </h4>
                
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
                  fontSize: '0.75rem', 
                  color: 'var(--muted-foreground)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-xs)'
                }}>
                  <Clock size={12} />
                  {action.timestamp}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ActionsPanel;
