import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, Mail, MapPin, Building2 } from 'lucide-react';
import { Manufacturer } from '@/types';
import { manufacturersAPI } from '@/api/manufacturers';

interface ManufacturerEditModalProps {
  manufacturer: Manufacturer | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (manufacturer: Manufacturer) => void;
}

const ManufacturerEditModal: React.FC<ManufacturerEditModalProps> = ({
  manufacturer,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    manufacturer_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (manufacturer) {
      setFormData({
        manufacturer_name: manufacturer.manufacturer_name,
        contact_person: manufacturer.contact_person,
        email: manufacturer.email,
        phone: manufacturer.phone,
        address: manufacturer.address,
        city: manufacturer.city || '',
        state: manufacturer.state || '',
        zip_code: manufacturer.zip_code || '',
        country: manufacturer.country || '',
        is_active: manufacturer.is_active
      });
    }
  }, [manufacturer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manufacturer) return;

    setLoading(true);
    setError(null);

    try {
      const updatedManufacturer = await manufacturersAPI.updateManufacturer(manufacturer.manufacturer_id, formData);
      if (updatedManufacturer) {
        onSave(updatedManufacturer);
        onClose();
      } else {
        setError('Failed to update manufacturer');
      }
    } catch (err) {
      setError('Error updating manufacturer');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content manufacturer-edit-modal">
        <div className="modal-header">
          <h3>{manufacturer ? 'Edit Manufacturer' : 'Add New Manufacturer'}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="manufacturer-form">
          <div className="form-section">
            <h4>Basic Information</h4>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="manufacturer_name">Company Name *</label>
                <input
                  type="text"
                  id="manufacturer_name"
                  name="manufacturer_name"
                  value={formData.manufacturer_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="contact_person">Contact Person *</label>
                <input
                  type="text"
                  id="contact_person"
                  name="contact_person"
                  value={formData.contact_person}
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
            <h4>Status</h4>
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                />
                <span>Active Manufacturer</span>
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
              {loading ? 'Saving...' : 'Save Manufacturer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManufacturerEditModal;
