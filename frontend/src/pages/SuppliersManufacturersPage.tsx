import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Building2, 
  Search, 
  Plus, 
  Filter,
  RefreshCw,
  AlertCircle,
  Users,
  Package,
  TrendingUp,
  IndianRupee,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  Eye,
  ShoppingCart,
  FileText,
  BarChart3
} from 'lucide-react';
import { 
  Supplier, 
  Manufacturer, 
  SupplierStats, 
  ManufacturerStats,
  SuppliedMedicine,
  ManufacturerMedicine,
  PurchaseOrder
} from '@/types';
import { suppliersAPI } from '@/api/suppliers';
import { manufacturersAPI } from '@/api/manufacturers';
import { purchaseOrdersAPI } from '@/api/purchaseOrders';
import '@/styles/suppliers-manufacturers.css';

type ViewMode = 'suppliers' | 'manufacturers';

const SuppliersManufacturersPage: React.FC = () => {
  // State for view mode
  const [viewMode, setViewMode] = useState<ViewMode>('suppliers');
  
  // State for suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierStats, setSupplierStats] = useState<SupplierStats | null>(null);
  const [supplierMedicines, setSupplierMedicines] = useState<SuppliedMedicine[]>([]);
  const [supplierPurchaseHistory, setSupplierPurchaseHistory] = useState<PurchaseOrder[]>([]);
  
  // State for manufacturers
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);
  const [manufacturerStats, setManufacturerStats] = useState<ManufacturerStats | null>(null);
  const [manufacturerMedicines, setManufacturerMedicines] = useState<ManufacturerMedicine[]>([]);
  
  // Common state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'medicines' | 'purchases' | 'inventory'>('overview');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load data on component mount and when view mode changes
  useEffect(() => {
    loadData();
  }, [viewMode]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (viewMode === 'suppliers') {
        const response = await suppliersAPI.searchSuppliers('');
        if (response.success && response.data) {
          setSuppliers(response.data);
        } else {
          setError(response.error || 'Failed to load suppliers');
        }
      } else {
        const response = await manufacturersAPI.searchManufacturers('');
        if (response.success && response.data) {
          setManufacturers(response.data);
        } else {
          setError(response.error || 'Failed to load manufacturers');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setLoading(true);
    try {
      if (viewMode === 'suppliers') {
        const response = await suppliersAPI.searchSuppliers(query);
        if (response.success && response.data) {
          setSuppliers(response.data);
        } else {
          setError(response.error || 'Search failed');
        }
      } else {
        const response = await manufacturersAPI.searchManufacturers(query);
        if (response.success && response.data) {
          setManufacturers(response.data);
        } else {
          setError(response.error || 'Search failed');
        }
      }
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierSelect = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setActiveTab('overview');
    
    try {
      const [statsResponse, medicinesResponse, historyResponse] = await Promise.all([
        suppliersAPI.getSupplierStatistics(supplier.supplier_id),
        suppliersAPI.getSupplierMedicines(supplier.supplier_id),
        suppliersAPI.getSupplierPurchaseHistory(supplier.supplier_id)
      ]);
      
      if (statsResponse.success && statsResponse.data) {
        setSupplierStats(statsResponse.data);
      }
      
      if (medicinesResponse.success && medicinesResponse.data) {
        setSupplierMedicines(medicinesResponse.data);
      }
      
      if (historyResponse.success && historyResponse.data) {
        setSupplierPurchaseHistory(historyResponse.data);
      }
    } catch (err) {
      console.error('Failed to load supplier data:', err);
    }
  };

  const handleManufacturerSelect = async (manufacturer: Manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setActiveTab('overview');
    
    try {
      const [statsResponse, medicinesResponse] = await Promise.all([
        manufacturersAPI.getManufacturerStatistics(manufacturer.manufacturer_id),
        manufacturersAPI.getManufacturerMedicines(manufacturer.manufacturer_id)
      ]);
      
      if (statsResponse.success && statsResponse.data) {
        setManufacturerStats(statsResponse.data);
      }
      
      if (medicinesResponse.success && medicinesResponse.data) {
        setManufacturerMedicines(medicinesResponse.data);
      }
    } catch (err) {
      console.error('Failed to load manufacturer data:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (selectedSupplier && viewMode === 'suppliers') {
      await handleSupplierSelect(selectedSupplier);
    } else if (selectedManufacturer && viewMode === 'manufacturers') {
      await handleManufacturerSelect(selectedManufacturer);
    }
    setRefreshing(false);
  };

  const handleEdit = (item: Supplier | Manufacturer) => {
    console.log('Edit:', item);
  };

  const handleDelete = async (item: Supplier | Manufacturer) => {
    if (window.confirm(`Are you sure you want to delete this ${viewMode === 'suppliers' ? 'supplier' : 'manufacturer'}?`)) {
      try {
        let response;
        if (viewMode === 'suppliers') {
          response = await suppliersAPI.deleteSupplier((item as Supplier).supplier_id);
        } else {
          response = await manufacturersAPI.deleteManufacturer((item as Manufacturer).manufacturer_id);
        }
        
        if (response.success) {
          await loadData();
          if (viewMode === 'suppliers') {
            setSelectedSupplier(null);
          } else {
            setSelectedManufacturer(null);
          }
        } else {
          setError(response.error || 'Failed to delete');
        }
      } catch (err) {
        setError('Failed to delete');
      }
    }
  };

  const filteredItems = (viewMode === 'suppliers' ? suppliers : manufacturers)
    .filter(item => {
      const matchesSearch = item[viewMode === 'suppliers' ? 'supplier_name' : 'manufacturer_name']
        .toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.email && item.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.phone && item.phone.includes(searchQuery));
      
      const matchesFilter = filterStatus === 'all' || 
        (filterStatus === 'active' && item.is_active) ||
        (filterStatus === 'inactive' && !item.is_active);
      
      return matchesSearch && matchesFilter;
    });

  return (
    <div className="suppliers-manufacturers-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <h1>
              <Truck size={24} />
              Suppliers & Manufacturers
            </h1>
            <p>Manage suppliers, manufacturers, and purchase orders</p>
          </div>
          <div className="header-actions">
            <button
              className="action-btn secondary"
              onClick={() => setShowFilters(!showFilters)}
              title="Toggle Filters"
            >
              <Filter size={16} />
              Filters
            </button>
            <button
              className="action-btn primary"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh Data"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="view-toggle">
        <button
          className={`toggle-btn ${viewMode === 'suppliers' ? 'active' : ''}`}
          onClick={() => setViewMode('suppliers')}
        >
          <Truck size={20} />
          Suppliers
        </button>
        <button
          className={`toggle-btn ${viewMode === 'manufacturers' ? 'active' : ''}`}
          onClick={() => setViewMode('manufacturers')}
        >
          <Building2 size={20} />
          Manufacturers
        </button>
      </div>

      <div className="suppliers-manufacturers-container">
        {/* Left Panel - List */}
        <div className="left-panel">
          {/* Search and Filter */}
          <div className="search-section">
            <div className="search-bar">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder={`Search ${viewMode} by name, email, or phone...`}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-tabs">
              <button
                className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                All ({filteredItems.length})
              </button>
              <button
                className={`filter-tab ${filterStatus === 'active' ? 'active' : ''}`}
                onClick={() => setFilterStatus('active')}
              >
                Active ({filteredItems.filter(item => item.is_active).length})
              </button>
              <button
                className={`filter-tab ${filterStatus === 'inactive' ? 'active' : ''}`}
                onClick={() => setFilterStatus('inactive')}
              >
                Inactive ({filteredItems.filter(item => !item.is_active).length})
              </button>
            </div>
          </div>

          {/* Add Button */}
          <div className="add-section">
            <button className="add-btn" onClick={() => console.log(`Add new ${viewMode.slice(0, -1)}`)}>
              <Plus size={20} />
              Add New {viewMode === 'suppliers' ? 'Supplier' : 'Manufacturer'}
            </button>
          </div>

          {/* List */}
          <div className="items-list">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading {viewMode}...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <AlertCircle size={24} />
                <p>{error}</p>
                <button onClick={loadData} className="retry-btn">Retry</button>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="empty-state">
                <Users size={48} />
                <p>No {viewMode} found</p>
                <p>Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredItems.map(item => (
                <div
                  key={item[viewMode === 'suppliers' ? 'supplier_id' : 'manufacturer_id']}
                  className={`item-card ${
                    (viewMode === 'suppliers' && selectedSupplier?.supplier_id === (item as Supplier).supplier_id) ||
                    (viewMode === 'manufacturers' && selectedManufacturer?.manufacturer_id === (item as Manufacturer).manufacturer_id)
                      ? 'selected' : ''
                  }`}
                  onClick={() => viewMode === 'suppliers' 
                    ? handleSupplierSelect(item as Supplier)
                    : handleManufacturerSelect(item as Manufacturer)
                  }
                >
                  <div className="item-header">
                    <div className="item-name">
                      <h4>{item[viewMode === 'suppliers' ? 'supplier_name' : 'manufacturer_name']}</h4>
                      <div className="item-status">
                        {item.is_active ? (
                          <span className="status-badge active">Active</span>
                        ) : (
                          <span className="status-badge inactive">Inactive</span>
                        )}
                      </div>
                    </div>
                    <div className="item-actions">
                      <button
                        className="action-btn edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item);
                        }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="item-details">
                    {item.phone && (
                      <div className="detail-item">
                        <Phone size={14} />
                        <span>{item.phone}</span>
                      </div>
                    )}
                    {item.email && (
                      <div className="detail-item">
                        <Mail size={14} />
                        <span>{item.email}</span>
                      </div>
                    )}
                    {item.address && (
                      <div className="detail-item">
                        <MapPin size={14} />
                        <span>{item.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Details */}
        <div className="right-panel">
          {((viewMode === 'suppliers' && selectedSupplier) || (viewMode === 'manufacturers' && selectedManufacturer)) ? (
            <div className="details-view">
              {/* Header */}
              <div className="details-header">
                <div className="details-info">
                  <h2>
                    {viewMode === 'suppliers' 
                      ? selectedSupplier?.supplier_name 
                      : selectedManufacturer?.manufacturer_name
                    }
                  </h2>
                  <div className="details-meta">
                    {viewMode === 'suppliers' && selectedSupplier?.contact_person_name && (
                      <div className="meta-item">
                        <Users size={16} />
                        <span>{selectedSupplier.contact_person_name}</span>
                      </div>
                    )}
                    {viewMode === 'manufacturers' && selectedManufacturer?.contact_person && (
                      <div className="meta-item">
                        <Users size={16} />
                        <span>{selectedManufacturer.contact_person}</span>
                      </div>
                    )}
                    {((viewMode === 'suppliers' && selectedSupplier?.phone) || (viewMode === 'manufacturers' && selectedManufacturer?.phone)) && (
                      <div className="meta-item">
                        <Phone size={16} />
                        <span>{viewMode === 'suppliers' ? selectedSupplier?.phone : selectedManufacturer?.phone}</span>
                      </div>
                    )}
                    {((viewMode === 'suppliers' && selectedSupplier?.email) || (viewMode === 'manufacturers' && selectedManufacturer?.email)) && (
                      <div className="meta-item">
                        <Mail size={16} />
                        <span>{viewMode === 'suppliers' ? selectedSupplier?.email : selectedManufacturer?.email}</span>
                      </div>
                    )}
                    {((viewMode === 'suppliers' && selectedSupplier?.address) || (viewMode === 'manufacturers' && selectedManufacturer?.address)) && (
                      <div className="meta-item">
                        <MapPin size={16} />
                        <span>{viewMode === 'suppliers' ? selectedSupplier?.address : selectedManufacturer?.address}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="details-actions">
                  <button
                    className="action-btn primary"
                    onClick={() => handleEdit(viewMode === 'suppliers' ? selectedSupplier! : selectedManufacturer!)}
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="details-tabs">
                <button
                  className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <BarChart3 size={16} />
                  Overview
                </button>
                <button
                  className={`tab-btn ${activeTab === 'medicines' ? 'active' : ''}`}
                  onClick={() => setActiveTab('medicines')}
                >
                  <Package size={16} />
                  {viewMode === 'suppliers' ? 'Supplied Medicines' : 'Manufactured Medicines'}
                </button>
                {viewMode === 'suppliers' && (
                  <button
                    className={`tab-btn ${activeTab === 'purchases' ? 'active' : ''}`}
                    onClick={() => setActiveTab('purchases')}
                  >
                    <ShoppingCart size={16} />
                    Purchase History
                  </button>
                )}
                {viewMode === 'manufacturers' && (
                  <button
                    className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
                    onClick={() => setActiveTab('inventory')}
                  >
                    <TrendingUp size={16} />
                    Inventory
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'overview' && (
                  <div className="overview-tab">
                    {((viewMode === 'suppliers' && supplierStats) || (viewMode === 'manufacturers' && manufacturerStats)) && (
                      <div className="stats-grid">
                        {viewMode === 'suppliers' && supplierStats && (
                          <>
                            <div className="stat-card">
                              <div className="stat-icon">
                                <ShoppingCart size={24} />
                              </div>
                              <div className="stat-content">
                                <h4>{supplierStats.total_purchases}</h4>
                                <p>Total Purchases</p>
                              </div>
                            </div>
                            <div className="stat-card">
                              <div className="stat-icon">
                                <IndianRupee size={24} />
                              </div>
                              <div className="stat-content">
                                <h4>₹{supplierStats.total_spent.toLocaleString()}</h4>
                                <p>Total Spent</p>
                              </div>
                            </div>
                            <div className="stat-card">
                              <div className="stat-icon">
                                <TrendingUp size={24} />
                              </div>
                              <div className="stat-content">
                                <h4>₹{supplierStats.average_order_value.toLocaleString()}</h4>
                                <p>Average Order</p>
                              </div>
                            </div>
                            <div className="stat-card">
                              <div className="stat-icon">
                                <Package size={24} />
                              </div>
                              <div className="stat-content">
                                <h4>{supplierStats.total_medicines_supplied}</h4>
                                <p>Medicines Supplied</p>
                              </div>
                            </div>
                          </>
                        )}
                        {viewMode === 'manufacturers' && manufacturerStats && (
                          <>
                            <div className="stat-card">
                              <div className="stat-icon">
                                <Package size={24} />
                              </div>
                              <div className="stat-content">
                                <h4>{manufacturerStats.total_medicines_produced}</h4>
                                <p>Total Medicines</p>
                              </div>
                            </div>
                            <div className="stat-card">
                              <div className="stat-icon">
                                <TrendingUp size={24} />
                              </div>
                              <div className="stat-content">
                                <h4>{manufacturerStats.active_medicines_count}</h4>
                                <p>Active Medicines</p>
                              </div>
                            </div>
                            <div className="stat-card">
                              <div className="stat-icon">
                                <IndianRupee size={24} />
                              </div>
                              <div className="stat-content">
                                <h4>₹{manufacturerStats.total_inventory_value.toLocaleString()}</h4>
                                <p>Inventory Value</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'medicines' && (
                  <div className="medicines-tab">
                    <div className="tab-header">
                      <h3>{viewMode === 'suppliers' ? 'Supplied Medicines' : 'Manufactured Medicines'}</h3>
                    </div>
                    
                    {((viewMode === 'suppliers' && supplierMedicines.length > 0) || (viewMode === 'manufacturers' && manufacturerMedicines.length > 0)) ? (
                      <div className="medicines-list">
                        {(viewMode === 'suppliers' ? supplierMedicines : manufacturerMedicines).map((medicine, index) => (
                          <div key={index} className="medicine-item">
                            <div className="medicine-header">
                              <h4>{medicine.medicine_name}</h4>
                              <span className="category">{medicine.category}</span>
                            </div>
                            <div className="medicine-details">
                              <div className="detail">
                                <span className="label">Generic:</span>
                                <span>{medicine.generic_name}</span>
                              </div>
                              <div className="detail">
                                <span className="label">Brand:</span>
                                <span>{medicine.brand}</span>
                              </div>
                              {viewMode === 'suppliers' && 'quantity_in_stock' in medicine && (
                                <div className="detail">
                                  <span className="label">Stock:</span>
                                  <span>{medicine.quantity_in_stock}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <Package size={48} />
                        <p>No medicines found</p>
                        <p>This {viewMode.slice(0, -1)} has no associated medicines</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'purchases' && viewMode === 'suppliers' && (
                  <div className="purchases-tab">
                    <div className="tab-header">
                      <h3>Purchase History</h3>
                    </div>
                    
                    {supplierPurchaseHistory.length > 0 ? (
                      <div className="purchases-list">
                        {supplierPurchaseHistory.map((purchase) => (
                          <div key={purchase.purchase_invoice_id} className="purchase-item">
                            <div className="purchase-header">
                              <div className="purchase-info">
                                <h4>Invoice #{purchase.invoice_number}</h4>
                                <span className="purchase-date">{new Date(purchase.purchase_date).toLocaleDateString()}</span>
                              </div>
                              <div className="purchase-amount">
                                <span className="amount">₹{purchase.total_amount.toFixed(2)}</span>
                                <span className={`payment-status ${purchase.payment_status.toLowerCase()}`}>
                                  {purchase.payment_status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <ShoppingCart size={48} />
                        <p>No purchase history found</p>
                        <p>No purchases have been made yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'inventory' && viewMode === 'manufacturers' && (
                  <div className="inventory-tab">
                    <div className="tab-header">
                      <h3>Inventory Levels</h3>
                    </div>
                    
                    <div className="empty-state">
                      <TrendingUp size={48} />
                      <p>Inventory data not available</p>
                      <p>This feature will be implemented in the next phase</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <Users size={64} />
              <h3>Select a {viewMode === 'suppliers' ? 'Supplier' : 'Manufacturer'}</h3>
              <p>Choose a {viewMode.slice(0, -1)} from the list to view their details and manage their account.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuppliersManufacturersPage;