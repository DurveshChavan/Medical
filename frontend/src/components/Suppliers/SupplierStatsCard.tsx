import React from 'react';
import { TrendingUp, IndianRupee, Package, Calendar, Users, Truck } from 'lucide-react';
import { SupplierStats } from '@/types';

interface SupplierStatsCardProps {
  stats: SupplierStats;
  title?: string;
}

const SupplierStatsCard: React.FC<SupplierStatsCardProps> = ({
  stats,
  title = "Supplier Performance"
}) => {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    if (dateString === 'Never') return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <div className="supplier-stats-card">
      <div className="stats-header">
        <h3>{title}</h3>
      </div>
      
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-icon">
            <Truck size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_purchases}</div>
            <div className="stat-label">Total Purchases</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <IndianRupee size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.total_spent)}</div>
            <div className="stat-label">Total Spent</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <TrendingUp size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.average_order_value)}</div>
            <div className="stat-label">Average Order</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <Package size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_medicines_supplied}</div>
            <div className="stat-label">Medicines Supplied</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <Calendar size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatDate(stats.last_purchase_date)}</div>
            <div className="stat-label">Last Purchase</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <Users size={20} />
          </div>
          <div className="stat-content">
            <div className={`stat-value ${getPerformanceColor(stats.delivery_performance_score)}`}>
              {stats.delivery_performance_score}%
            </div>
            <div className="stat-label">Performance Score</div>
          </div>
        </div>
      </div>

      <div className="performance-indicator">
        <div className="performance-bar">
          <div 
            className={`performance-fill ${getPerformanceColor(stats.delivery_performance_score)}`}
            style={{ width: `${Math.min(stats.delivery_performance_score, 100)}%` }}
          ></div>
        </div>
        <div className="performance-text">
          {stats.delivery_performance_score >= 80 ? 'Excellent Performance' :
           stats.delivery_performance_score >= 60 ? 'Good Performance' :
           'Needs Improvement'}
        </div>
      </div>
    </div>
  );
};

export default SupplierStatsCard;
