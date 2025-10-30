import React from 'react';
import { Edit, Building2, Package, Phone, Mail, MapPin } from 'lucide-react';
import { Manufacturer } from '@/types';

interface ManufacturerDetailsHeaderProps {
  manufacturer: Manufacturer;
  onEdit: (manufacturer: Manufacturer) => void;
  onViewInventory: (manufacturer: Manufacturer) => void;
}

const ManufacturerDetailsHeader: React.FC<ManufacturerDetailsHeaderProps> = ({
  manufacturer,
  onEdit,
  onViewInventory
}) => {
  return (
    <div className="manufacturer-details-header">
      <div className="manufacturer-info">
        <div className="manufacturer-title">
          <Building2 size={24} />
          <h2>{manufacturer.manufacturer_name}</h2>
        </div>
        <div className="manufacturer-meta">
          <div className="meta-item">
            <Phone size={16} />
            <span>{manufacturer.phone}</span>
          </div>
          <div className="meta-item">
            <Mail size={16} />
            <span>{manufacturer.email}</span>
          </div>
          <div className="meta-item">
            <MapPin size={16} />
            <span>{manufacturer.address}</span>
          </div>
          <div className="meta-item">
            <Building2 size={16} />
            <span>Contact: {manufacturer.contact_person}</span>
          </div>
        </div>
      </div>
      
      <div className="manufacturer-actions">
        <button
          className="action-btn secondary"
          onClick={() => onViewInventory(manufacturer)}
        >
          <Package size={16} />
          View Inventory
        </button>
        <button
          className="action-btn primary"
          onClick={() => onEdit(manufacturer)}
        >
          <Edit size={16} />
          Edit Manufacturer
        </button>
      </div>
    </div>
  );
};

export default ManufacturerDetailsHeader;
