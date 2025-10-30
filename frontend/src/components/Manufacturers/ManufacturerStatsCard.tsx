import React from 'react';
import { TrendingUp, Package, BarChart3, Building2, IndianRupee, Activity } from 'lucide-react';
import { ManufacturerStats } from '@/types';

interface ManufacturerStatsCardProps {
  stats: ManufacturerStats;
  title?: string;
}

const ManufacturerStatsCard: React.FC<ManufacturerStatsCardProps> = ({
  stats,
  title = "Manufacturer Performance"
}) => {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const getCategoryColor = (index: number) => {
    const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info'];
    return colors[index % colors.length];
  };

  return (
    <div className="manufacturer-stats-card">
      <div className="stats-header">
        <h3>{title}</h3>
      </div>
      
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-icon">
            <Package size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_medicines_produced}</div>
            <div className="stat-label">Total Medicines</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <TrendingUp size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.active_medicines_count}</div>
            <div className="stat-label">Active Medicines</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <IndianRupee size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.total_inventory_value)}</div>
            <div className="stat-label">Inventory Value</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <BarChart3 size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{Object.keys(stats.medicines_by_category).length}</div>
            <div className="stat-label">Categories</div>
          </div>
        </div>
      </div>

      {Object.keys(stats.medicines_by_category).length > 0 && (
        <div className="category-breakdown">
          <h4>Medicines by Category</h4>
          <div className="category-list">
            {Object.entries(stats.medicines_by_category).map(([category, count], index) => (
              <div key={category} className="category-item">
                <div className="category-info">
                  <span className="category-name">{category}</span>
                  <span className="category-count">{count} medicines</span>
                </div>
                <div className="category-bar">
                  <div 
                    className={`category-fill ${getCategoryColor(index)}`}
                    style={{ 
                      width: `${(count / Math.max(...Object.values(stats.medicines_by_category))) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="performance-summary">
        <div className="summary-item">
          <Building2 size={16} />
          <span>Manufactures {stats.total_medicines_produced} medicines</span>
        </div>
        <div className="summary-item">
          <Activity size={16} />
          <span>{stats.active_medicines_count} currently active</span>
        </div>
        <div className="summary-item">
          <IndianRupee size={16} />
          <span>Total inventory value: {formatCurrency(stats.total_inventory_value)}</span>
        </div>
      </div>
    </div>
  );
};

export default ManufacturerStatsCard;
