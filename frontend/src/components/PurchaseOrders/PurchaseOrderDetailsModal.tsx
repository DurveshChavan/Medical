import React, { useState, useEffect } from 'react';
import { X, Package, Calendar, IndianRupee, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { PurchaseOrderDetails } from '@/types';
import { purchaseOrdersAPI } from '@/api/purchaseOrders';

interface PurchaseOrderDetailsModalProps {
  orderId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onFinalize?: () => void;
}

const PurchaseOrderDetailsModal: React.FC<PurchaseOrderDetailsModalProps> = ({
  orderId,
  isOpen,
  onClose,
  onFinalize
}) => {
  const [orderDetails, setOrderDetails] = useState<PurchaseOrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderDetails();
    }
  }, [isOpen, orderId]);

  const loadOrderDetails = async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);
    try {
      const details = await purchaseOrdersAPI.getPurchaseOrderDetails(orderId);
      setOrderDetails(details);
    } catch (err) {
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!orderId) return;
    
    setFinalizing(true);
    setError(null);
    try {
      await purchaseOrdersAPI.finalizePurchaseOrder(orderId);
      if (onFinalize) onFinalize();
      onClose();
    } catch (err) {
      setError('Failed to finalize order');
    } finally {
      setFinalizing(false);
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

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content purchase-order-details-modal">
        <div className="modal-header">
          <h3>Purchase Order Details</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading order details...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={loadOrderDetails} className="retry-btn">
              Retry
            </button>
          </div>
        ) : orderDetails ? (
          <div className="order-details">
            <div className="order-header">
              <div className="order-info">
                <h4>{orderDetails.invoice_number}</h4>
                <span className={`status-badge ${getStatusColor(orderDetails.payment_status)}`}>
                  {orderDetails.payment_status}
                </span>
              </div>
              <div className="order-amount">
                <IndianRupee size={20} />
                <span>{formatCurrency(orderDetails.total_amount)}</span>
              </div>
            </div>

            <div className="order-meta">
              <div className="meta-item">
                <Truck size={16} />
                <span>Supplier: {orderDetails.supplier_name}</span>
              </div>
              <div className="meta-item">
                <Calendar size={16} />
                <span>Order Date: {formatDate(orderDetails.purchase_date)}</span>
              </div>
              <div className="meta-item">
                <Package size={16} />
                <span>Items: {orderDetails.items.length}</span>
              </div>
            </div>

            <div className="order-items-section">
              <h4>Order Items</h4>
              <div className="items-list">
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="item-row">
                    <div className="item-info">
                      <h5>{item.medicine_name}</h5>
                      <div className="item-details">
                        <span>Batch: {item.batch_number}</span>
                        <span>Expiry: {formatDate(item.expiry_date)}</span>
                      </div>
                    </div>
                    <div className="item-quantity">
                      <span>{item.quantity_purchased} units</span>
                    </div>
                    <div className="item-cost">
                      <span>{formatCurrency(item.cost_per_unit)} per unit</span>
                      <span className="total-cost">{formatCurrency(item.total_cost)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-summary">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>{formatCurrency(orderDetails.total_amount)}</span>
              </div>
              <div className="summary-row total">
                <span>Total Amount:</span>
                <span>{formatCurrency(orderDetails.total_amount)}</span>
              </div>
            </div>

            {orderDetails.payment_status === 'pending' && (
              <div className="order-actions">
                <button
                  className="action-btn primary"
                  onClick={handleFinalize}
                  disabled={finalizing}
                >
                  {finalizing ? (
                    <>
                      <div className="loading-spinner small"></div>
                      Finalizing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Finalize Order
                    </>
                  )}
                </button>
                <button
                  className="action-btn secondary"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            )}

            {orderDetails.payment_status === 'completed' && (
              <div className="completed-notice">
                <CheckCircle size={20} />
                <span>This order has been completed and inventory has been updated.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <Package size={48} />
            <p>No order details found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderDetailsModal;
