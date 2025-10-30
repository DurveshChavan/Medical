import React from 'react';
import { Truck, Phone, Mail, MapPin, Edit, Trash2 } from 'lucide-react';
import { Supplier } from '@/types';

interface SupplierListItemProps {
  supplier: Supplier;
  isSelected: boolean;
  onSelect: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplierId: number) => void;
}

const SupplierListItem: React.FC<SupplierListItemProps> = ({
  supplier,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}) => {
  return (
    <div
      className={`supplier-list-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(supplier)}
    >
      <div className="supplier-header">
        <div className="supplier-info">
          <h4>{supplier.supplier_name}</h4>
          <div className="supplier-status">
            {supplier.is_active ? (
              <span className="status-badge active">Active</span>
            ) : (
              <span className="status-badge inactive">Inactive</span>
            )}
          </div>
        </div>
        <div className="supplier-actions">
          <button
            className="action-btn edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(supplier);
            }}
            title="Edit Supplier"
          >
            <Edit size={16} />
          </button>
          <button
            className="action-btn delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(supplier.supplier_id);
            }}
            title="Delete Supplier"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="supplier-details">
        <div className="detail-item">
          <Phone size={14} />
          <span>{supplier.phone}</span>
        </div>
        <div className="detail-item">
          <Mail size={14} />
          <span>{supplier.email}</span>
        </div>
        <div className="detail-item">
          <MapPin size={14} />
          <span>{supplier.address}</span>
        </div>
        {supplier.gstin && (
          <div className="detail-item">
            <Truck size={14} />
            <span>GSTIN: {supplier.gstin}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierListItem;
