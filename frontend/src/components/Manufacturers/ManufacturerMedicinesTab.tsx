import React, { useState, useEffect } from 'react';
import { Package, Search, AlertCircle, CheckCircle, Pill } from 'lucide-react';
import { ManufacturerMedicine } from '@/types';
import { manufacturersAPI } from '@/api/manufacturers';

interface ManufacturerMedicinesTabProps {
  manufacturerId: number;
}

const ManufacturerMedicinesTab: React.FC<ManufacturerMedicinesTabProps> = ({
  manufacturerId
}) => {
  const [medicines, setMedicines] = useState<ManufacturerMedicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMedicines();
  }, [manufacturerId]);

  const loadMedicines = async () => {
    setLoading(true);
    setError(null);
    try {
      const medicines = await manufacturersAPI.getManufacturerMedicines(manufacturerId);
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

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
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
    <div className="manufacturer-medicines-tab">
      <div className="tab-header">
        <h3>Manufactured Medicines</h3>
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
          <p>This manufacturer doesn't produce any medicines yet</p>
        </div>
      ) : (
        <div className="medicines-grid">
          {filteredMedicines.map((medicine) => (
            <div key={medicine.medicine_id} className="medicine-card">
              <div className="medicine-header">
                <div className="medicine-info">
                  <h4>{medicine.medicine_name}</h4>
                  <p className="generic-name">{medicine.generic_name}</p>
                  <p className="brand">{medicine.brand}</p>
                </div>
                <div className="medicine-status">
                  <span className={`status-badge ${getStatusColor(medicine.is_active)}`}>
                    {getStatusText(medicine.is_active)}
                  </span>
                </div>
              </div>
              
              <div className="medicine-details">
                <div className="detail-row">
                  <span className="label">Category:</span>
                  <span>{medicine.category}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Dosage Form:</span>
                  <span>{medicine.dosage_form}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Strength:</span>
                  <span>{medicine.strength}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Prescription Required:</span>
                  <span className={medicine.prescription_required ? 'warning' : 'success'}>
                    {medicine.prescription_required ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              <div className="medicine-actions">
                <button className="action-btn secondary">
                  <Pill size={16} />
                  View Details
                </button>
                <button className="action-btn primary">
                  Edit Medicine
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManufacturerMedicinesTab;
