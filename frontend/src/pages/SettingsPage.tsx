import React, { useState } from 'react';
import ChartCard from '@/components/ChartCard';
import { useTheme } from '@/hooks/useTheme';

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState({
    notifications: true,
    autoRefresh: true,
    refreshInterval: 30,
    emailAlerts: false,
    lowStockThreshold: 50
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-description">
          Configure application preferences
        </p>
      </div>

      <div className="grid grid-cols-1" style={{ gap: 'var(2rem)' }}>
        {/* Appearance Settings */}
        <ChartCard title="Appearance" subtitle="Customize the look and feel">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(1.5rem)' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: 'var(1rem)',
              background: 'var(--card-hover)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <div style={{ fontWeight: '500', color: 'var(--foreground)', marginBottom: '0.25rem' }}>
                  Theme Mode
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                  Choose between light and dark mode
                </div>
              </div>
              <button 
                className="btn btn-secondary"
                onClick={toggleTheme}
              >
                {theme === 'light' ? 'Light' : 'Dark'} Mode
              </button>
            </div>
          </div>
        </ChartCard>

        {/* Dashboard Settings */}
        <ChartCard title="Dashboard" subtitle="Configure dashboard behavior">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(1.5rem)' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: 'var(1rem)',
              background: 'var(--card-hover)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <div style={{ fontWeight: '500', color: 'var(--foreground)', marginBottom: '0.25rem' }}>
                  Auto Refresh
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                  Automatically refresh dashboard data
                </div>
              </div>
              <label style={{ 
                position: 'relative', 
                display: 'inline-block', 
                width: '50px', 
                height: '24px' 
              }}>
                <input
                  type="checkbox"
                  checked={settings.autoRefresh}
                  onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: settings.autoRefresh ? 'var(--primary)' : 'var(--border)',
                  borderRadius: '24px',
                  transition: 'var(150ms ease-in-out)'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '18px',
                    width: '18px',
                    left: settings.autoRefresh ? '28px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: 'var(150ms ease-in-out)'
                  }} />
                </span>
              </label>
            </div>

            {settings.autoRefresh && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: 'var(1rem)',
                background: 'var(--card-hover)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div>
                  <div style={{ fontWeight: '500', color: 'var(--foreground)', marginBottom: '0.25rem' }}>
                    Refresh Interval
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                    Data refresh frequency in seconds
                  </div>
                </div>
                <input
                  type="number"
                  value={settings.refreshInterval}
                  onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                  min="10"
                  max="300"
                  style={{
                    width: '80px',
                    padding: '0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--card)',
                    color: 'var(--foreground)',
                    textAlign: 'center'
                  }}
                />
              </div>
            )}
          </div>
        </ChartCard>

        {/* Notification Settings */}
        <ChartCard title="Notifications" subtitle="Manage alerts and notifications">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(1.5rem)' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: 'var(1rem)',
              background: 'var(--card-hover)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <div style={{ fontWeight: '500', color: 'var(--foreground)', marginBottom: '0.25rem' }}>
                  Push Notifications
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                  Receive browser notifications
                </div>
              </div>
              <label style={{ 
                position: 'relative', 
                display: 'inline-block', 
                width: '50px', 
                height: '24px' 
              }}>
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: settings.notifications ? 'var(--primary)' : 'var(--border)',
                  borderRadius: '24px',
                  transition: 'var(150ms ease-in-out)'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '18px',
                    width: '18px',
                    left: settings.notifications ? '28px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: 'var(150ms ease-in-out)'
                  }} />
                </span>
              </label>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: 'var(1rem)',
              background: 'var(--card-hover)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <div style={{ fontWeight: '500', color: 'var(--foreground)', marginBottom: '0.25rem' }}>
                  Email Alerts
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                  Send critical alerts via email
                </div>
              </div>
              <label style={{ 
                position: 'relative', 
                display: 'inline-block', 
                width: '50px', 
                height: '24px' 
              }}>
                <input
                  type="checkbox"
                  checked={settings.emailAlerts}
                  onChange={(e) => handleSettingChange('emailAlerts', e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: settings.emailAlerts ? 'var(--primary)' : 'var(--border)',
                  borderRadius: '24px',
                  transition: 'var(150ms ease-in-out)'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '18px',
                    width: '18px',
                    left: settings.emailAlerts ? '28px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: 'var(150ms ease-in-out)'
                  }} />
                </span>
              </label>
            </div>
          </div>
        </ChartCard>

        {/* Inventory Settings */}
        <ChartCard title="Inventory" subtitle="Configure inventory thresholds">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: 'var(1rem)',
            background: 'var(--card-hover)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div>
              <div style={{ fontWeight: '500', color: 'var(--foreground)', marginBottom: '0.25rem' }}>
                Low Stock Threshold
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Alert when stock falls below this value
              </div>
            </div>
            <input
              type="number"
              value={settings.lowStockThreshold}
              onChange={(e) => handleSettingChange('lowStockThreshold', parseInt(e.target.value))}
              min="1"
              max="1000"
              style={{
                width: '100px',
                padding: '0.5rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--card)',
                color: 'var(--foreground)',
                textAlign: 'center'
              }}
            />
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default SettingsPage;

