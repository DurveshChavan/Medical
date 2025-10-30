import React, { useState, useEffect } from 'react';
import { Truck, Calendar, IndianRupee, Package, AlertCircle, CheckCircle } from 'lucide-react';
import { PurchaseOrder } from '@/types';
import { suppliersAPI } from '@/api/suppliers';

interface SupplierPendingOrdersTabProps {
  supplierId: number;
}

const SupplierPendingOrdersTab: React.FC<SupplierPendingOrdersTabProps> = ({
  supplierId
}) => {
  const [pendingOrders, setPendingOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPendingOrders();
  }, [supplierId]);

  const loadPendingOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const orders = await suppliersAPI.getSupplierPendingOrders(supplierId);
      setPendingOrders(orders);
    } catch (err) {
      setError('Failed to load pending orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'partial':
        return 'status-partial';
      default:
        return 'status-unknown';
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading pending orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button onClick={loadPendingOrders} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="supplier-pending-orders-tab">
      <div className="tab-header">
        <h3>Pending Orders</h3>
        <div className="orders-summary">
          <span className="summary-item">
            <AlertCircle size={16} />
            {pendingOrders.length} pending orders
          </span>
        </div>
      </div>

      {pendingOrders.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={48} />
          <p>No pending orders</p>
          <p>All orders have been completed</p>
        </div>
      ) : (
        <div className="pending-orders-list">
          {pendingOrders.map((order) => (
            <div key={order.purchase_invoice_id} className="pending-order-card">
              <div className="order-header">
                <div className="order-info">
                  <h4>{order.invoice_number}</h4>
                  <span className={`status-badge ${getStatusColor(order.payment_status)}`}>
                    {order.payment_status}
                  </span>
                </div>
                <div className="order-amount">
                  <IndianRupee size={16} />
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
              
              <div className="order-details">
                <div className="detail-item">
                  <Calendar size={14} />
                  <span>Order Date: {formatDate(order.purchase_date)}</span>
                </div>
                <div className="detail-item">
                  <Package size={14} />
                  <span>Items: {order.item_count || 0}</span>
                </div>
                <div className="detail-item">
                  <Truck size={14} />
                  <span>Created: {formatDate(order.created_at)}</span>
                </div>
              </div>

              <div className="order-actions">
                <button className="action-btn primary">
                  <CheckCircle size={16} />
                  Finalize Order
                </button>
                <button className="action-btn secondary">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupplierPendingOrdersTab;
