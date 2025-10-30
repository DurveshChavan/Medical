import React, { useState, useEffect } from 'react';
import { Package, Search, IndianRupee, TrendingUp, AlertCircle } from 'lucide-react';
import { SuppliedMedicine } from '@/types';
import { suppliersAPI } from '@/api/suppliers';

interface SupplierMedicinesTabProps {
  supplierId: number;
}

const SupplierMedicinesTab: React.FC<SupplierMedicinesTabProps> = ({
  supplierId
}) => {
  const [medicines, setMedicines] = useState<SuppliedMedicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMedicines();
  }, [supplierId]);

  const loadMedicines = async () => {
    setLoading(true);
    setError(null);
    try {
      const medicines = await suppliersAPI.getSupplierMedicines(supplierId);
      setMedicines(medicines);
    } catch (err) {
      setError('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicines = medicines.filter(medicine =>
    medicine.medicine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    medicine.generic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    medicine.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    medicine.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: 'out-of-stock', color: 'error' };
    if (quantity < 10) return { status: 'low-stock', color: 'warning' };
    return { status: 'in-stock', color: 'success' };
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading medicines...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button onClick={loadMedicines} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="supplier-medicines-tab">
      <div className="tab-header">
        <h3>Supplied Medicines</h3>
        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search medicines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredMedicines.length === 0 ? (
        <div className="empty-state">
          <Package size={48} />
          <p>No medicines found</p>
          <p>This supplier doesn't supply any medicines yet</p>
        </div>
      ) : (
        <div className="medicines-grid">
          {filteredMedicines.map((medicine) => {
            const stockStatus = getStockStatus(medicine.quantity_in_stock);
            return (
              <div key={medicine.medicine_id} className="medicine-card">
                <div className="medicine-header">
                  <div className="medicine-info">
                    <h4>{medicine.medicine_name}</h4>
                    <p className="generic-name">{medicine.generic_name}</p>
                    <p className="brand">{medicine.brand}</p>
                  </div>
                  <div className="medicine-status">
                    <span className={`stock-badge ${stockStatus.color}`}>
                      {stockStatus.status}
                    </span>
                  </div>
                </div>
                
                <div className="medicine-details">
                  <div className="detail-row">
                    <span className="label">Category:</span>
                    <span>{medicine.category}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Stock:</span>
                    <span className={stockStatus.color}>
                      {medicine.quantity_in_stock} units
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Purchase Price:</span>
                    <span>{formatCurrency(medicine.default_purchase_price)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">GST:</span>
                    <span>{medicine.gst_percentage}%</span>
                  </div>
                </div>

                {stockStatus.status === 'out-of-stock' && (
                  <div className="stock-alert">
                    <AlertCircle size={16} />
                    <span>Out of stock - reorder needed</span>
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

export default SupplierMedicinesTab;
