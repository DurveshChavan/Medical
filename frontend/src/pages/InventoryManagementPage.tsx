import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Edit, 
  Search, 
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  TrendingUp,
  Calendar,
  IndianRupee,
  Hash,
  Building2,
  Tag
} from 'lucide-react';
import { analysisAPI } from '@/api/analysis';
import '@/styles/inventory.css';

interface InventoryItem {
  inventory_id: number;
  medicine_id: number;
  medicine_name: string;
  category: string;
  supplier_name: string;
  batch_number: string;
  expiry_date: string;
  quantity_in_stock: number;
  purchase_price_per_unit: number;
  selling_price_per_unit: number;
  reorder_level: number;
  last_restocked_date: string;
  created_at: string;
  updated_at: string;
  stock_status: 'out_of_stock' | 'low_stock' | 'medium_stock' | 'adequate_stock';
}

interface Medicine {
  medicine_id: number;
  medicine_name: string;
  category: string;
}

interface Supplier {
  supplier_id: number;
  supplier_name: string;
  contact_person: string;
  phone: string;
}

const InventoryManagementPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    medicine_id: '',
    supplier_id: '',
    batch_number: '',
    expiry_date: '',
    quantity_in_stock: '',
    purchase_price_per_unit: '',
    selling_price_per_unit: '',
    reorder_level: '10'
  });

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
    setLoading(true);
    setError(null);
      
      const [inventoryData, medicinesData, suppliersData] = await Promise.all([
        analysisAPI.getInventory(),
        analysisAPI.getMedicinesForInventory(),
        analysisAPI.getSuppliersForInventory()
      ]);
      
      setInventory(inventoryData.data);
      setMedicines(medicinesData);
      setSuppliers(suppliersData);
      
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    try {
      const itemData = {
        medicine_id: parseInt(formData.medicine_id),
        supplier_id: parseInt(formData.supplier_id),
        batch_number: formData.batch_number,
        expiry_date: formData.expiry_date,
        quantity_in_stock: parseInt(formData.quantity_in_stock),
        purchase_price_per_unit: parseFloat(formData.purchase_price_per_unit),
        selling_price_per_unit: parseFloat(formData.selling_price_per_unit),
        reorder_level: parseInt(formData.reorder_level)
      };

      await analysisAPI.addInventoryItem(itemData);
      setShowAddModal(false);
      resetForm();
      fetchInventoryData();
    } catch (err) {
      console.error('Error adding inventory item:', err);
      setError('Failed to add inventory item');
    }
  };

  const handleEditItem = async () => {
    if (!editingItem) return;

    try {
      const updates = {
        quantity_in_stock: parseInt(formData.quantity_in_stock),
        purchase_price_per_unit: parseFloat(formData.purchase_price_per_unit),
        selling_price_per_unit: parseFloat(formData.selling_price_per_unit),
        reorder_level: parseInt(formData.reorder_level)
      };

      await analysisAPI.updateInventoryItem(editingItem.inventory_id, updates);
      setShowEditModal(false);
      setEditingItem(null);
      resetForm();
      fetchInventoryData();
    } catch (err) {
      console.error('Error updating inventory item:', err);
      setError('Failed to update inventory item');
    }
  };


  const resetForm = () => {
    setFormData({
      medicine_id: '',
      supplier_id: '',
      batch_number: '',
      expiry_date: '',
      quantity_in_stock: '',
      purchase_price_per_unit: '',
      selling_price_per_unit: '',
      reorder_level: '10'
    });
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      medicine_id: item.medicine_id.toString(),
      supplier_id: '',
      batch_number: item.batch_number,
      expiry_date: item.expiry_date,
      quantity_in_stock: item.quantity_in_stock.toString(),
      purchase_price_per_unit: item.purchase_price_per_unit.toString(),
      selling_price_per_unit: item.selling_price_per_unit.toString(),
      reorder_level: item.reorder_level.toString()
    });
    setShowEditModal(true);
  };

  const getStockStatusIcon = (status: string) => {
    switch (status) {
      case 'out_of_stock':
        return <X className="w-4 h-4 text-red-500" />;
      case 'low_stock':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'medium_stock':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'adequate_stock':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };


  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.batch_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || item.stock_status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-state">
          <AlertTriangle className="error-icon" />
          <h3 className="error-title">Failed to load inventory data</h3>
          <p className="error-message">{error}</p>
          <button 
            onClick={fetchInventoryData}
            className="btn btn-primary"
          >
            <Package className="btn-icon" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <Package className="header-icon" />
            <div>
        <h1 className="page-title">Inventory Management</h1>
              <p className="page-subtitle">Manage your pharmacy inventory with real-time stock levels and analytics</p>
      </div>
            </div>
          <div className="header-actions">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <Plus className="btn-icon" />
              Add New Item
            </button>
              </div>
            </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">
            <Package />
          </div>
          <div className="stat-content">
            <div className="stat-value">{inventory.length}</div>
            <div className="stat-label">Total Items</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-warning">
            <AlertTriangle />
            </div>
          <div className="stat-content">
            <div className="stat-value">{inventory.filter(item => item.stock_status === 'out_of_stock' || item.stock_status === 'low_stock').length}</div>
            <div className="stat-label">Low Stock Items</div>
              </div>
            </div>
        
        <div className="stat-card">
          <div className="stat-icon stat-icon-success">
            <CheckCircle />
          </div>
          <div className="stat-content">
            <div className="stat-value">{inventory.filter(item => item.stock_status === 'adequate_stock').length}</div>
            <div className="stat-label">Adequate Stock</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-info">
            <Building2 />
            </div>
          <div className="stat-content">
            <div className="stat-value">{new Set(inventory.map(item => item.supplier_name)).size}</div>
            <div className="stat-label">Suppliers</div>
            </div>
          </div>
        </div>

      {/* Controls Section */}
      <div className="controls-section">
        <div className="search-control">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search medicines, suppliers, or batch numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
              </div>
            </div>
        
        <div className="filter-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Stock Levels</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="medium_stock">Medium Stock</option>
            <option value="adequate_stock">Adequate Stock</option>
          </select>
        </div>
      </div>

        {/* Inventory Table */}
      <div className="data-table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">
                  <div className="header-cell-content">
                    <Package className="header-cell-icon" />
                    Medicine
                  </div>
                </th>
                <th className="table-header-cell">
                  <div className="header-cell-content">
                    <Building2 className="header-cell-icon" />
                    Supplier
                  </div>
                  </th>
                <th className="table-header-cell">
                  <div className="header-cell-content">
                    <Hash className="header-cell-icon" />
                    Batch
                  </div>
                  </th>
                <th className="table-header-cell">
                  <div className="header-cell-content">
                    <TrendingUp className="header-cell-icon" />
                    Stock
                  </div>
                  </th>
                <th className="table-header-cell">
                  <div className="header-cell-content">
                    <AlertTriangle className="header-cell-icon" />
                    Status
                  </div>
                  </th>
                <th className="table-header-cell">
                  <div className="header-cell-content">
                    <Calendar className="header-cell-icon" />
                    Expiry
                  </div>
                  </th>
                <th className="table-header-cell">
                  <div className="header-cell-content">
                    Actions
                  </div>
                  </th>
                </tr>
              </thead>
            <tbody className="table-body">
              {filteredInventory.map((item) => (
                <tr key={item.inventory_id} className="table-row">
                  <td className="table-cell">
                    <div className="medicine-info">
                      <div className="medicine-name">{item.medicine_name}</div>
                      <div className="medicine-category">
                        <Tag className="category-icon" />
                        {item.category}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="supplier-info">
                      <Building2 className="supplier-icon" />
                      {item.supplier_name}
                    </div>
                      </td>
                  <td className="table-cell">
                    <div className="batch-info">
                      <Hash className="batch-icon" />
                      {item.batch_number}
                    </div>
                      </td>
                  <td className="table-cell">
                    <div className="stock-info">
                      <div className="stock-quantity">
                        <TrendingUp className="stock-icon" />
                        {item.quantity_in_stock} units
                      </div>
                      <div className="reorder-level">
                        Reorder at: {item.reorder_level}
                      </div>
                    </div>
                      </td>
                  <td className="table-cell">
                    <div className={`status-badge status-${item.stock_status}`}>
                      {getStockStatusIcon(item.stock_status)}
                      {item.stock_status.replace('_', ' ')}
                    </div>
                      </td>
                  <td className="table-cell">
                    <div className="expiry-info">
                      <Calendar className="expiry-icon" />
                      {new Date(item.expiry_date).toLocaleDateString()}
                        </div>
                      </td>
                  <td className="table-cell">
                    <div className="action-buttons">
                      <button
                        onClick={() => openEditModal(item)}
                        className="action-btn action-btn-edit"
                        title="Edit Item"
                      >
                        <Edit className="action-icon" />
                      </button>
                    </div>
                      </td>
                    </tr>
              ))}
              </tbody>
            </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div className="modal-title">
                <Plus className="modal-title-icon" />
                Add New Inventory Item
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="modal-close-btn"
              >
                <X className="modal-close-icon" />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label className="form-label">
                  <Package className="form-label-icon" />
                  Medicine
                </label>
                <select
                  value={formData.medicine_id}
                  onChange={(e) => setFormData({...formData, medicine_id: e.target.value})}
                  className="form-select"
                >
                  <option value="">Select Medicine</option>
                  {medicines.map(med => (
                    <option key={med.medicine_id} value={med.medicine_id}>
                      {med.medicine_name} ({med.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Building2 className="form-label-icon" />
                  Supplier
                </label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                  className="form-select"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(supp => (
                    <option key={supp.supplier_id} value={supp.supplier_id}>
                      {supp.supplier_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Hash className="form-label-icon" />
                  Batch Number
                </label>
                <input
                  type="text"
                  value={formData.batch_number}
                  onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                  className="form-input"
                  placeholder="Enter batch number"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Calendar className="form-label-icon" />
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <TrendingUp className="form-label-icon" />
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.quantity_in_stock}
                    onChange={(e) => setFormData({...formData, quantity_in_stock: e.target.value})}
                    className="form-input"
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <AlertTriangle className="form-label-icon" />
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({...formData, reorder_level: e.target.value})}
                    className="form-input"
                    placeholder="Enter reorder level"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <IndianRupee className="form-label-icon" />
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_price_per_unit}
                    onChange={(e) => setFormData({...formData, purchase_price_per_unit: e.target.value})}
                    className="form-input"
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <IndianRupee className="form-label-icon" />
                    Selling Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.selling_price_per_unit}
                    onChange={(e) => setFormData({...formData, selling_price_per_unit: e.target.value})}
                    className="form-input"
                    placeholder="0.00"
                  />
                </div>
              </div>
          </div>
          
            <div className="modal-footer">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="btn btn-primary"
              >
                <Plus className="btn-icon" />
                Add Item
              </button>
            </div>
          </div>
            </div>
          )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div className="modal-title">
                <Edit className="modal-title-icon" />
                Edit Inventory Item
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="modal-close-btn"
              >
                <X className="modal-close-icon" />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label className="form-label">
                  <Package className="form-label-icon" />
                  Medicine
                </label>
                <div className="form-display">
                  {editingItem.medicine_name}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Hash className="form-label-icon" />
                  Batch Number
                </label>
                <div className="form-display">
                  {editingItem.batch_number}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <TrendingUp className="form-label-icon" />
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.quantity_in_stock}
                    onChange={(e) => setFormData({...formData, quantity_in_stock: e.target.value})}
                    className="form-input"
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <AlertTriangle className="form-label-icon" />
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({...formData, reorder_level: e.target.value})}
                    className="form-input"
                    placeholder="Enter reorder level"
                  />
                </div>
        </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <IndianRupee className="form-label-icon" />
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_price_per_unit}
                    onChange={(e) => setFormData({...formData, purchase_price_per_unit: e.target.value})}
                    className="form-input"
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <IndianRupee className="form-label-icon" />
                    Selling Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.selling_price_per_unit}
                    onChange={(e) => setFormData({...formData, selling_price_per_unit: e.target.value})}
                    className="form-input"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleEditItem}
                className="btn btn-primary"
              >
                <Edit className="btn-icon" />
                Update Item
              </button>
            </div>
          </div>
          </div>
        )}
    </div>
  );
};

export default InventoryManagementPage;
