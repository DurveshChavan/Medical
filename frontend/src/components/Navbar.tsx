import React from 'react';
import { Sun, Moon, Bell, User, Menu, X } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useSidebar } from '@/hooks/useSidebar';

interface NavbarProps {
  title: string;
}

const Navbar: React.FC<NavbarProps> = ({ title }) => {
  const { theme, toggleTheme } = useTheme();
  const { isCollapsed, toggleSidebar, isMobile } = useSidebar();

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button 
          className="sidebar-toggle" 
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          title={isCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        >
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
        {isMobile && (
          <span className="mobile-indicator">Mobile</span>
        )}
        <h1 className="navbar-title">{title}</h1>
      </div>

      <div className="navbar-right">
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <button 
          className="theme-toggle"
          aria-label="Notifications"
          title="View notifications"
        >
          <Bell size={20} />
        </button>

        <button 
          className="theme-toggle"
          aria-label="User profile"
          title="View profile"
        >
          <User size={20} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

