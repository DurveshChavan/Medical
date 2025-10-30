import React from 'react';
import { Edit, Truck, Package, Phone, Mail, MapPin } from 'lucide-react';
import { Supplier } from '@/types';

interface SupplierDetailsHeaderProps {
  supplier: Supplier;
  onEdit: (supplier: Supplier) => void;
  onCreateOrder: (supplier: Supplier) => void;
}

const SupplierDetailsHeader: React.FC<SupplierDetailsHeaderProps> = ({
  supplier,
  onEdit,
  onCreateOrder
}) => {
  return (
    <div className="supplier-details-header">
      <div className="supplier-info">
        <div className="supplier-title">
          <Truck size={24} />
          <h2>{supplier.supplier_name}</h2>
        </div>
        <div className="supplier-meta">
          <div className="meta-item">
            <Phone size={16} />
            <span>{supplier.phone}</span>
          </div>
          <div className="meta-item">
            <Mail size={16} />
            <span>{supplier.email}</span>
          </div>
          <div className="meta-item">
            <MapPin size={16} />
            <span>{supplier.address}</span>
          </div>
          {supplier.gstin && (
            <div className="meta-item">
              <Truck size={16} />
              <span>GSTIN: {supplier.gstin}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="supplier-actions">
        <button
          className="action-btn secondary"
          onClick={() => onCreateOrder(supplier)}
        >
          <Package size={16} />
          New Order
        </button>
        <button
          className="action-btn primary"
          onClick={() => onEdit(supplier)}
        >
          <Edit size={16} />
          Edit Supplier
        </button>
      </div>
    </div>
  );
};

export default SupplierDetailsHeader;
