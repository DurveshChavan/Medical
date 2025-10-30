import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CloudRain,
  Package,
  Upload,
  Activity,
  Settings,
  BarChart3,
  ShoppingCart,
  RotateCcw,
  Users,
  Truck
} from 'lucide-react';
import { useSidebar } from '@/hooks/useSidebar';

const Sidebar: React.FC = () => {
  const { isCollapsed } = useSidebar();
  
const navItems = [
  {
    section: 'Main',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/billing', label: 'Billing', icon: ShoppingCart },
      { path: '/returns', label: 'Returns', icon: RotateCcw },
      { path: '/customers', label: 'Customers', icon: Users },
      { path: '/suppliers-manufacturers', label: 'Suppliers & Manufacturers', icon: Truck },
      { path: '/seasonal', label: 'Seasonal Analysis', icon: CloudRain },
      { path: '/inventory', label: 'Inventory', icon: Package },
      { path: '/advanced-analytics', label: 'Advanced Analytics', icon: BarChart3 }
    ]
  },
    {
      section: 'Management',
      items: [
        { path: '/data-upload', label: 'Data Management', icon: Upload },
        { path: '/settings', label: 'Settings', icon: Settings }
      ]
    }
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Activity size={24} />
          </div>
          {!isCollapsed && (
            <div>
              <div className="sidebar-logo-text">MedStore</div>
              <div className="sidebar-subtitle">Six Sigma DMAIC</div>
            </div>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section} className="nav-section">
            {!isCollapsed && <div className="nav-section-title">{section.section}</div>}
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'active' : ''}`
                  }
                  end={item.path === '/'}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="nav-item-icon" size={20} />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {!isCollapsed && (
        <div className="sidebar-footer">
          <div style={{ 
            fontSize: '0.75rem', 
            color: 'var(--text-muted)',
            textAlign: 'center' 
          }}>
            Improve Phase - DMAIC
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

