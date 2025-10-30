import React from 'react';
import { Truck, Calendar, IndianRupee, Package, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { PurchaseOrder } from '@/types';

interface PurchaseOrderItemProps {
  order: PurchaseOrder;
  onViewDetails: (orderId: number) => void;
  onFinalize?: (orderId: number) => void;
}

const PurchaseOrderItem: React.FC<PurchaseOrderItemProps> = ({
  order,
  onViewDetails,
  onFinalize
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'status-completed';
      case 'pending':
        return 'status-pending';
      case 'partial':
        return 'status-partial';
      default:
        return 'status-unknown';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle size={16} />;
      case 'pending':
        return <AlertCircle size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  const isPending = order.payment_status.toLowerCase() === 'pending';

  return (
    <div className="purchase-order-item">
      <div className="order-header">
        <div className="order-info">
          <div className="order-title">
            <h4>{order.invoice_number}</h4>
            <div className="order-status">
              {getStatusIcon(order.payment_status)}
              <span className={`status-badge ${getStatusColor(order.payment_status)}`}>
                {order.payment_status}
              </span>
            </div>
          </div>
          <div className="order-meta">
            <div className="meta-item">
              <Truck size={14} />
              <span>Supplier ID: {order.supplier_id}</span>
            </div>
            <div className="meta-item">
              <Calendar size={14} />
              <span>{formatDate(order.purchase_date)}</span>
            </div>
            <div className="meta-item">
              <Package size={14} />
              <span>Items: {order.item_count || 0}</span>
            </div>
          </div>
        </div>
        
        <div className="order-amount">
          <IndianRupee size={20} />
          <span className="amount">{formatCurrency(order.total_amount)}</span>
        </div>
      </div>

      <div className="order-details">
        <div className="detail-row">
          <span className="label">Order Date:</span>
          <span>{formatDate(order.purchase_date)}</span>
        </div>
        <div className="detail-row">
          <span className="label">Created:</span>
          <span>{formatDate(order.created_at)}</span>
        </div>
        <div className="detail-row">
          <span className="label">Total Amount:</span>
          <span className="amount">{formatCurrency(order.total_amount)}</span>
        </div>
        <div className="detail-row">
          <span className="label">Status:</span>
          <span className={`status ${getStatusColor(order.payment_status)}`}>
            {order.payment_status}
          </span>
        </div>
      </div>

      <div className="order-actions">
        <button
          className="action-btn secondary"
          onClick={() => onViewDetails(order.purchase_invoice_id)}
        >
          <Eye size={16} />
          View Details
        </button>
        
        {isPending && onFinalize && (
          <button
            className="action-btn primary"
            onClick={() => onFinalize(order.purchase_invoice_id)}
          >
            <CheckCircle size={16} />
            Finalize
          </button>
        )}

        {!isPending && (
          <div className="completed-indicator">
            <CheckCircle size={16} />
            <span>Completed</span>
          </div>
        )}
      </div>

      {isPending && (
        <div className="pending-notice">
          <AlertCircle size={14} />
          <span>This order is pending finalization</span>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderItem;
