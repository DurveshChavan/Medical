import React from 'react';
import { Building2, TrendingUp, Package, Users, IndianRupee, BarChart3 } from 'lucide-react';
import { Manufacturer, ManufacturerStats } from '@/types';

interface ManufacturerOverviewTabProps {
  manufacturer: Manufacturer;
  stats: ManufacturerStats | null;
}

const ManufacturerOverviewTab: React.FC<ManufacturerOverviewTabProps> = ({
  manufacturer,
  stats
}) => {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="manufacturer-overview-tab">
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Package size={24} />
            </div>
            <div className="stat-content">
              <h4>{stats.total_medicines_produced}</h4>
              <p>Total Medicines</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <h4>{stats.active_medicines_count}</h4>
              <p>Active Medicines</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <IndianRupee size={24} />
            </div>
            <div className="stat-content">
              <h4>{formatCurrency(stats.total_inventory_value)}</h4>
              <p>Inventory Value</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <BarChart3 size={24} />
            </div>
            <div className="stat-content">
              <h4>{Object.keys(stats.medicines_by_category).length}</h4>
              <p>Categories</p>
            </div>
          </div>
        </div>
      )}

      {stats && Object.keys(stats.medicines_by_category).length > 0 && (
        <div className="category-breakdown">
          <h3>Medicines by Category</h3>
          <div className="category-chart">
            {Object.entries(stats.medicines_by_category).map(([category, count]) => (
              <div key={category} className="category-item">
                <div className="category-info">
                  <span className="category-name">{category}</span>
                  <span className="category-count">{count} medicines</span>
                </div>
                <div className="category-bar">
                  <div 
                    className="category-fill"
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
      
      <div className="manufacturer-info-card">
        <h3>Manufacturer Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Company Name:</label>
            <span>{manufacturer.manufacturer_name}</span>
          </div>
          <div className="info-item">
            <label>Contact Person:</label>
            <span>{manufacturer.contact_person}</span>
          </div>
          <div className="info-item">
            <label>Phone:</label>
            <span>{manufacturer.phone}</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{manufacturer.email}</span>
          </div>
          <div className="info-item">
            <label>Address:</label>
            <span>{manufacturer.address}</span>
          </div>
          {manufacturer.city && (
            <div className="info-item">
              <label>City:</label>
              <span>{manufacturer.city}</span>
            </div>
          )}
          {manufacturer.state && (
            <div className="info-item">
              <label>State:</label>
              <span>{manufacturer.state}</span>
            </div>
          )}
          {manufacturer.country && (
            <div className="info-item">
              <label>Country:</label>
              <span>{manufacturer.country}</span>
            </div>
          )}
          <div className="info-item">
            <label>Status:</label>
            <span className={manufacturer.is_active ? 'status-active' : 'status-inactive'}>
              {manufacturer.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManufacturerOverviewTab;
