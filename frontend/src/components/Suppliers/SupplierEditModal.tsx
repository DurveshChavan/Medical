import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, Mail, MapPin, Building } from 'lucide-react';
import { Supplier } from '@/types';
import { suppliersAPI } from '@/api/suppliers';

interface SupplierEditModalProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: Supplier) => void;
}

const SupplierEditModal: React.FC<SupplierEditModalProps> = ({
  supplier,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    supplier_name: '',
    contact_person_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    gstin: '',
    pan_number: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (supplier) {
      setFormData({
        supplier_name: supplier.supplier_name,
        contact_person_name: supplier.contact_person_name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        city: supplier.city || '',
        state: supplier.state || '',
        zip_code: supplier.zip_code || '',
        country: supplier.country || '',
        gstin: supplier.gstin || '',
        pan_number: supplier.pan_number || '',
        is_active: supplier.is_active
      });
    }
  }, [supplier]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;

    setLoading(true);
    setError(null);

    try {
      const updatedSupplier = await suppliersAPI.updateSupplier(supplier.supplier_id, formData);
      if (updatedSupplier) {
        onSave(updatedSupplier);
        onClose();
      } else {
        setError('Failed to update supplier');
      }
    } catch (err) {
      setError('Error updating supplier');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content supplier-edit-modal">
        <div className="modal-header">
          <h3>{supplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="supplier-form">
          <div className="form-section">
            <h4>Basic Information</h4>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="supplier_name">Company Name *</label>
                <input
                  type="text"
                  id="supplier_name"
                  name="supplier_name"
                  value={formData.supplier_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="contact_person_name">Contact Person *</label>
                <input
                  type="text"
                  id="contact_person_name"
                  name="contact_person_name"
                  value={formData.contact_person_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Contact Information</h4>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Address Information</h4>
            <div className="form-group">
              <label htmlFor="address">Address *</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="state">State</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="zip_code">ZIP Code</label>
                <input
                  type="text"
                  id="zip_code"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Business Information</h4>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gstin">GSTIN</label>
                <input
                  type="text"
                  id="gstin"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="pan_number">PAN Number</label>
                <input
                  type="text"
                  id="pan_number"
                  name="pan_number"
                  value={formData.pan_number}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                />
                <span>Active Supplier</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierEditModal;
