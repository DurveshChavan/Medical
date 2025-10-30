import React, { useState, useEffect } from 'react';
import { Package, Search, AlertCircle, Calendar, Building2, TrendingUp } from 'lucide-react';
import { ManufacturerInventory } from '@/types';
import { manufacturersAPI } from '@/api/manufacturers';

interface ManufacturerInventoryTabProps {
  manufacturerId: number;
}

const ManufacturerInventoryTab: React.FC<ManufacturerInventoryTabProps> = ({
  manufacturerId
}) => {
  const [inventory, setInventory] = useState<ManufacturerInventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadInventory();
  }, [manufacturerId]);

  const loadInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const inventory = await manufacturersAPI.getManufacturerInventory(manufacturerId);
      setInventory(inventory);
    } catch (err) {
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.medicine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.generic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStockStatus = (quantity: number, reorderLevel: number) => {
    if (quantity === 0) return { status: 'out-of-stock', color: 'error', text: 'Out of Stock' };
    if (quantity <= reorderLevel) return { status: 'low-stock', color: 'warning', text: 'Low Stock' };
    return { status: 'in-stock', color: 'success', text: 'In Stock' };
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30;
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading inventory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button onClick={loadInventory} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="manufacturer-inventory-tab">
      <div className="tab-header">
        <h3>Inventory Levels</h3>
        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredInventory.length === 0 ? (
        <div className="empty-state">
          <Package size={48} />
          <p>No inventory found</p>
          <p>No inventory records for this manufacturer's medicines</p>
        </div>
      ) : (
        <div className="inventory-list">
          {filteredInventory.map((item) => {
            const stockStatus = getStockStatus(item.quantity_in_stock, item.reorder_level);
            const expiringSoon = isExpiringSoon(item.expiry_date);
            
            return (
              <div key={item.inventory_id} className="inventory-card">
                <div className="inventory-header">
                  <div className="medicine-info">
                    <h4>{item.medicine_name}</h4>
                    <p className="generic-name">{item.generic_name}</p>
                    <p className="brand">{item.brand}</p>
                  </div>
                  <div className="inventory-status">
                    <span className={`stock-badge ${stockStatus.color}`}>
                      {stockStatus.text}
                    </span>
                    {expiringSoon && (
                      <span className="expiry-warning">
                        <AlertCircle size={14} />
                        Expiring Soon
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="inventory-details">
                  <div className="detail-row">
                    <span className="label">Category:</span>
                    <span>{item.category}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Batch Number:</span>
                    <span>{item.batch_number}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Expiry Date:</span>
                    <span className={expiringSoon ? 'warning' : ''}>
                      {formatDate(item.expiry_date)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Stock:</span>
                    <span className={stockStatus.color}>
                      {item.quantity_in_stock} units
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Reorder Level:</span>
                    <span>{item.reorder_level}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Purchase Price:</span>
                    <span>{formatCurrency(item.purchase_price_per_unit)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Selling Price:</span>
                    <span>{formatCurrency(item.selling_price_per_unit)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Supplier:</span>
                    <span>{item.supplier_name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Last Restocked:</span>
                    <span>{formatDate(item.last_restocked_date)}</span>
                  </div>
                </div>

                {stockStatus.status === 'out-of-stock' && (
                  <div className="stock-alert">
                    <AlertCircle size={16} />
                    <span>Out of stock - reorder needed</span>
                  </div>
                )}

                {stockStatus.status === 'low-stock' && (
                  <div className="stock-warning">
                    <AlertCircle size={16} />
                    <span>Low stock - consider reordering</span>
                  </div>
                )}

                {expiringSoon && (
                  <div className="expiry-alert">
                    <Calendar size={16} />
                    <span>Expires on {formatDate(item.expiry_date)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManufacturerInventoryTab;
