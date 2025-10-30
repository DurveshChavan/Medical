import React from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import type { InventoryItem } from '@/types';

interface InventoryTableProps {
  items: InventoryItem[];
  onItemClick?: (item: InventoryItem) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ items, onItemClick }) => {
  const getStatusBadge = (status: string) => {
    const badges = {
      'In Stock': { class: 'badge-success', icon: <CheckCircle size={14} /> },
      'Low Stock': { class: 'badge-warning', icon: <AlertCircle size={14} /> },
      'Out of Stock': { class: 'badge-error', icon: <XCircle size={14} /> }
    };
    
    const badge = badges[status as keyof typeof badges] || badges['In Stock'];
    
    return (
      <span className={`badge ${badge.class}`} style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
        {badge.icon}
        {status}
      </span>
    );
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.875rem'
      }}>
        <thead>
          <tr style={{
            borderBottom: '2px solid var(--border)',
            textAlign: 'left'
          }}>
            <th style={{ padding: 'var(1rem)', fontWeight: '600', color: 'var(--muted-foreground)' }}>
              Medicine Name
            </th>
            <th style={{ padding: 'var(1rem)', fontWeight: '600', color: 'var(--muted-foreground)' }}>
              Category
            </th>
            <th style={{ padding: 'var(1rem)', fontWeight: '600', color: 'var(--muted-foreground)' }}>
              Stock
            </th>
            <th style={{ padding: 'var(1rem)', fontWeight: '600', color: 'var(--muted-foreground)' }}>
              Price
            </th>
            <th style={{ padding: 'var(1rem)', fontWeight: '600', color: 'var(--muted-foreground)' }}>
              Status
            </th>
            <th style={{ padding: 'var(1rem)', fontWeight: '600', color: 'var(--muted-foreground)' }}>
              Supplier
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              onClick={() => onItemClick?.(item)}
              style={{
                borderBottom: '1px solid var(--border)',
                transition: 'background-color var(150ms ease-in-out)',
                cursor: onItemClick ? 'pointer' : 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--card-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <td style={{ padding: 'var(1rem)', fontWeight: '500', color: 'var(--foreground)' }}>
                {item.name}
              </td>
              <td style={{ padding: 'var(1rem)', color: 'var(--muted-foreground)' }}>
                {item.category}
              </td>
              <td style={{ padding: 'var(1rem)', color: 'var(--foreground)', fontWeight: '500' }}>
                {item.stock.toLocaleString()}
              </td>
              <td style={{ padding: 'var(1rem)', color: 'var(--foreground)' }}>
                ₹{item.price.toLocaleString()}
              </td>
              <td style={{ padding: 'var(1rem)' }}>
                {getStatusBadge(item.status)}
              </td>
              <td style={{ padding: 'var(1rem)', color: 'var(--muted-foreground)' }}>
                {item.supplier || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;

