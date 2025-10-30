import React, { useState, useEffect } from 'react';
import { Truck, Calendar, IndianRupee, Package, Search } from 'lucide-react';
import { PurchaseOrder } from '@/types';
import { suppliersAPI } from '@/api/suppliers';

interface SupplierPurchaseHistoryTabProps {
  supplierId: number;
}

const SupplierPurchaseHistoryTab: React.FC<SupplierPurchaseHistoryTabProps> = ({
  supplierId
}) => {
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPurchaseHistory();
  }, [supplierId]);

  const loadPurchaseHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const history = await suppliersAPI.getSupplierPurchaseHistory(supplierId);
      setPurchaseHistory(history);
    } catch (err) {
      setError('Failed to load purchase history');
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = purchaseHistory.filter(order =>
    order.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.purchase_date.includes(searchQuery)
  );

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

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading purchase history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button onClick={loadPurchaseHistory} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="supplier-purchase-history-tab">
      <div className="tab-header">
        <h3>Purchase History</h3>
        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by invoice number or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="empty-state">
          <Truck size={48} />
          <p>No purchase history found</p>
          <p>This supplier hasn't made any purchases yet</p>
        </div>
      ) : (
        <div className="purchase-history-list">
          {filteredHistory.map((order) => (
            <div key={order.purchase_invoice_id} className="purchase-order-card">
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
                  <span>Date: {formatDate(order.purchase_date)}</span>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupplierPurchaseHistoryTab;
