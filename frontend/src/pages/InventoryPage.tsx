import React, { useEffect, useState } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import ChartCard from '@/components/ChartCard';
import InventoryTable from '@/components/InventoryTable';
import { dummyInventory } from '@/services/dummyData';
import type { InventoryItem } from '@/types';

const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In production, replace with:
        // const data = await getInventory();
        
        setInventory(dummyInventory);
        setFilteredInventory(dummyInventory);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = inventory;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    setFilteredInventory(filtered);
  }, [searchTerm, statusFilter, inventory]);

  const handleItemClick = (item: InventoryItem) => {
    console.log('Item clicked:', item);
    // In production, open a modal or navigate to detail page
  };

  const handleExport = () => {
    console.log('Exporting inventory data...');
    // In production, trigger export functionality
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%' 
      }}>
        <div className="animate-pulse" style={{ 
          fontSize: '1.25rem', 
          color: 'var(--muted-foreground)' 
        }}>
          Loading inventory...
        </div>
      </div>
    );
  }

  const stats = {
    total: inventory.length,
    inStock: inventory.filter(i => i.status === 'In Stock').length,
    lowStock: inventory.filter(i => i.status === 'Low Stock').length,
    outOfStock: inventory.filter(i => i.status === 'Out of Stock').length
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Inventory Management</h1>
        <p className="page-description">
          Track and manage medicine stock levels
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4" style={{ marginBottom: 'var(2rem)' }}>
        <div className="card">
          <div className="card-subheader">Total Items</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>
            {stats.total}
          </div>
        </div>
        <div className="card">
          <div className="card-subheader">In Stock</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--chart-5)' }}>
            {stats.inStock}
          </div>
        </div>
        <div className="card">
          <div className="card-subheader">Low Stock</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent)' }}>
            {stats.lowStock}
          </div>
        </div>
        <div className="card">
          <div className="card-subheader">Out of Stock</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--destructive)' }}>
            {stats.outOfStock}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <ChartCard
        title="Inventory List"
        subtitle={`Showing ${filteredInventory.length} of ${inventory.length} items`}
        action={
          <button className="btn btn-primary" onClick={handleExport}>
            <Download size={16} />
            Export
          </button>
        }
      >
        {/* Filters */}
        <div style={{ 
          display: 'flex', 
          gap: 'var(1rem)',
          marginBottom: 'var(1.5rem)'
        }}>
          <div style={{ 
            flex: 1,
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
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--card)',
                color: 'var(--foreground)',
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'border-color var(150ms ease-in-out)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(0.5rem)' }}>
            <Filter size={18} style={{ color: 'var(--muted-foreground)' }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.625rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--card)',
                color: 'var(--foreground)',
                fontSize: '0.9375rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <InventoryTable 
          items={filteredInventory} 
          onItemClick={handleItemClick}
        />
      </ChartCard>
    </div>
  );
};

export default InventoryPage;

