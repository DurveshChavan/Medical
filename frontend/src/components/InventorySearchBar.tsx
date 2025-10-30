import React from 'react';
import { Search, Filter, X } from 'lucide-react';

interface InventorySearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  stockFilter: string;
  onStockFilterChange: (value: string) => void;
  categories: string[];
}

const InventorySearchBar: React.FC<InventorySearchBarProps> = ({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  stockFilter,
  onStockFilterChange,
  categories
}) => {
  return (
    <div style={{ 
      display: 'flex', 
      gap: 'var(1rem)',
      marginBottom: 'var(2rem)',
      flexWrap: 'wrap'
    }}>
      {/* Search Input */}
      <div style={{ 
        flex: '1',
        minWidth: '250px',
        position: 'relative'
      }}>
        <Search 
          size={18} 
          style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: 'var(--muted-foreground)'
          }} 
        />
        <input
          type="text"
          placeholder="Search by medicine name or brand..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 2.5rem 0.75rem 2.75rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--card)',
            color: 'var(--foreground)',
            fontSize: '0.9375rem',
            fontFamily: 'DM Sans, sans-serif',
            outline: 'none',
            transition: 'border-color var(150ms ease-in-out)'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted-foreground)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(150ms ease-in-out)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--card-hover)';
              e.currentTarget.style.color = 'var(--foreground)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'var(--muted-foreground)';
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(0.5rem)' }}>
        <Filter size={18} style={{ color: 'var(--muted-foreground)' }} />
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          style={{
            padding: '0.75rem 2.5rem 0.75rem 0.75rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--card)',
            color: 'var(--foreground)',
            fontSize: '0.9375rem',
            fontFamily: 'DM Sans, sans-serif',
            outline: 'none',
            cursor: 'pointer',
            minWidth: '150px'
          }}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Stock Status Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(0.5rem)' }}>
        <select
          value={stockFilter}
          onChange={(e) => onStockFilterChange(e.target.value)}
          style={{
            padding: '0.75rem 2.5rem 0.75rem 0.75rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--card)',
            color: 'var(--foreground)',
            fontSize: '0.9375rem',
            fontFamily: 'DM Sans, sans-serif',
            outline: 'none',
            cursor: 'pointer',
            minWidth: '150px'
          }}
        >
          <option value="all">All Stock Status</option>
          <option value="in-stock">In Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
          <option value="expiring-soon">Expiring Soon</option>
        </select>
      </div>
    </div>
  );
};

export default InventorySearchBar;

