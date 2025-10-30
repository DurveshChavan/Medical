import React from 'react';
import { Database, TrendingUp, FileText, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'sales_update' | 'inventory_update' | 'data_loaded' | 'forecast_updated' | 'inventory_synced' | 'analysis_completed' | 'system_update';
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

interface ActivityLogProps {
  activities: ActivityItem[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sales_update':
        return <TrendingUp size={16} />;
      case 'inventory_update':
        return <RefreshCw size={16} />;
      case 'data_loaded':
        return <Database size={16} />;
      case 'forecast_updated':
        return <TrendingUp size={16} />;
      case 'inventory_synced':
        return <RefreshCw size={16} />;
      case 'analysis_completed':
        return <CheckCircle size={16} />;
      case 'system_update':
        return <FileText size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'var(--chart-5)';
      case 'warning':
        return 'var(--accent)';
      case 'error':
        return 'var(--destructive)';
      case 'info':
        return 'var(--primary)';
      default:
        return 'var(--muted-foreground)';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div>
      <h3 style={{ 
        fontSize: '1.125rem', 
        fontWeight: '600', 
        margin: 0,
        marginBottom: 'var(--spacing-md)',
        color: 'var(--foreground)'
      }}>
        Recent Activity
      </h3>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(--spacing-sm)',
        maxHeight: '300px',
        overflowY: 'auto'
      }}>
        {activities.length === 0 ? (
          <div style={{
            padding: 'var(--spacing-lg)',
            textAlign: 'center',
            color: 'var(--muted-foreground)',
            fontSize: '0.875rem'
          }}>
            No recent activity
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-sm)',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ 
                color: getStatusColor(activity.status),
                marginTop: '2px',
                flexShrink: 0
              }}>
                {getActivityIcon(activity.type)}
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.8125rem', 
                  color: 'var(--foreground)',
                  lineHeight: '1.4',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  {activity.message}
                </p>
                
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--muted-foreground)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-xs)'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: getStatusColor(activity.status)
                  }} />
                  {formatTimestamp(activity.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
