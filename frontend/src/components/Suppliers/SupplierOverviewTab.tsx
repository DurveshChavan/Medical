import React from 'react';
import { Truck, TrendingUp, Package, Users, IndianRupee, Calendar } from 'lucide-react';
import { Supplier, SupplierStats } from '@/types';

interface SupplierOverviewTabProps {
  supplier: Supplier;
  stats: SupplierStats | null;
}

const SupplierOverviewTab: React.FC<SupplierOverviewTabProps> = ({
  supplier,
  stats
}) => {
  return (
    <div className="supplier-overview-tab">
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Truck size={24} />
            </div>
            <div className="stat-content">
              <h4>{stats.total_purchases}</h4>
              <p>Total Purchases</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <IndianRupee size={24} />
            </div>
            <div className="stat-content">
              <h4>₹{stats.total_spent.toLocaleString()}</h4>
              <p>Total Spent</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <h4>₹{stats.average_order_value.toLocaleString()}</h4>
              <p>Average Order</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Package size={24} />
            </div>
            <div className="stat-content">
              <h4>{stats.total_medicines_supplied}</h4>
              <p>Medicines Supplied</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Calendar size={24} />
            </div>
            <div className="stat-content">
              <h4>{stats.last_purchase_date}</h4>
              <p>Last Purchase</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <h4>{stats.delivery_performance_score}%</h4>
              <p>Performance Score</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="supplier-info-card">
        <h3>Supplier Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Company Name:</label>
            <span>{supplier.supplier_name}</span>
          </div>
          <div className="info-item">
            <label>Contact Person:</label>
            <span>{supplier.contact_person_name}</span>
          </div>
          <div className="info-item">
            <label>Phone:</label>
            <span>{supplier.phone}</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{supplier.email}</span>
          </div>
          <div className="info-item">
            <label>Address:</label>
            <span>{supplier.address}</span>
          </div>
          {supplier.city && (
            <div className="info-item">
              <label>City:</label>
              <span>{supplier.city}</span>
            </div>
          )}
          {supplier.state && (
            <div className="info-item">
              <label>State:</label>
              <span>{supplier.state}</span>
            </div>
          )}
          {supplier.gstin && (
            <div className="info-item">
              <label>GSTIN:</label>
              <span>{supplier.gstin}</span>
            </div>
          )}
          {supplier.pan_number && (
            <div className="info-item">
              <label>PAN Number:</label>
              <span>{supplier.pan_number}</span>
            </div>
          )}
          <div className="info-item">
            <label>Status:</label>
            <span className={supplier.is_active ? 'status-active' : 'status-inactive'}>
              {supplier.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierOverviewTab;
