import React from 'react';
import { Building2, Phone, Mail, MapPin, Edit, Trash2 } from 'lucide-react';
import { Manufacturer } from '@/types';

interface ManufacturerListItemProps {
  manufacturer: Manufacturer;
  isSelected: boolean;
  onSelect: (manufacturer: Manufacturer) => void;
  onEdit: (manufacturer: Manufacturer) => void;
  onDelete: (manufacturerId: number) => void;
}

const ManufacturerListItem: React.FC<ManufacturerListItemProps> = ({
  manufacturer,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}) => {
  return (
    <div
      className={`manufacturer-list-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(manufacturer)}
    >
      <div className="manufacturer-header">
        <div className="manufacturer-info">
          <h4>{manufacturer.manufacturer_name}</h4>
          <div className="manufacturer-status">
            {manufacturer.is_active ? (
              <span className="status-badge active">Active</span>
            ) : (
              <span className="status-badge inactive">Inactive</span>
            )}
          </div>
        </div>
        <div className="manufacturer-actions">
          <button
            className="action-btn edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(manufacturer);
            }}
            title="Edit Manufacturer"
          >
            <Edit size={16} />
          </button>
          <button
            className="action-btn delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(manufacturer.manufacturer_id);
            }}
            title="Delete Manufacturer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="manufacturer-details">
        <div className="detail-item">
          <Phone size={14} />
          <span>{manufacturer.phone}</span>
        </div>
        <div className="detail-item">
          <Mail size={14} />
          <span>{manufacturer.email}</span>
        </div>
        <div className="detail-item">
          <MapPin size={14} />
          <span>{manufacturer.address}</span>
        </div>
        <div className="detail-item">
          <Building2 size={14} />
          <span>Contact: {manufacturer.contact_person}</span>
        </div>
      </div>
    </div>
  );
};

export default ManufacturerListItem;
