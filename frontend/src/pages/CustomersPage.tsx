import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  CreditCard, 
  History, 
  TrendingUp, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  AlertCircle,
  Filter,
  Download,
  RefreshCw,
  Clock,
  ShoppingBag,
  Receipt,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Customer, CustomerStats } from '@/types';
import { customersAPI } from '@/api/customers';
import { returnsAPI } from '@/api/returns';
import '@/styles/customers.css';

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [customerReturns, setCustomerReturns] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'credit' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'credit' | 'last_purchase' | 'total_spent'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'purchases' | 'outstanding' | 'returns'>('overview');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPayCreditModal, setShowPayCreditModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    date_of_birth: '',
    gender: ''
  });

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  // Create new customer
  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone || !newCustomer.address) {
      setError('Name, phone, and address are required');
      return;
    }

    setLoading(true);
    try {
      const response = await customersAPI.createCustomer(newCustomer);
      if (response.success) {
        setShowCreateModal(false);
        setNewCustomer({
          name: '',
          phone: '',
          email: '',
          address: '',
          city: '',
          state: '',
          zip_code: '',
          date_of_birth: '',
          gender: ''
        });
        loadCustomers(); // Refresh the list
        setError(null);
      } else {
        setError(response.error || 'Failed to create customer');
      }
    } catch (err) {
      setError('Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customersAPI.searchCustomers('');
      if (response.success && response.data) {
        setCustomers(response.data);
      } else {
        setError(response.error || 'Failed to load customers');
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
      const response = await customersAPI.searchCustomers(query);
      if (response.success && response.data) {
        setCustomers(response.data);
      } else {
        setError(response.error || 'Search failed');
      }
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setActiveTab('overview');
    
    // Load customer data
    try {
      const [statsResponse, returnsResponse] = await Promise.all([
        customersAPI.getCustomerStatistics(customer.customer_id),
        returnsAPI.getReturnHistory(customer.customer_id)
      ]);
      
      if (statsResponse.success && statsResponse.data) {
        setCustomerStats(statsResponse.data);
      }
      
      if (returnsResponse.success && returnsResponse.data) {
        setCustomerReturns(returnsResponse.data);
      }
    } catch (err) {
      console.error('Failed to load customer data:', err);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    // setShowEditModal(true);
    console.log('Edit customer:', customer);
  };

  const handlePayCredit = (customer: Customer) => {
    setSelectedCustomer(customer);
    // setShowPayCreditModal(true);
    console.log('Pay credit for customer:', customer);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCustomers();
    if (selectedCustomer) {
      await handleCustomerSelect(selectedCustomer);
    }
    setRefreshing(false);
  };

  // const handleSort = (field: 'name' | 'credit' | 'last_purchase' | 'total_spent') => {
  //   if (sortBy === field) {
  //     setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  //   } else {
  //     setSortBy(field);
  //     setSortOrder('asc');
  //   }
  // };

  const handleExportCustomers = () => {
    // TODO: Implement export functionality
    console.log('Export customers');
  };

  const handleDeleteCustomer = async (customerId: number) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        const response = await customersAPI.deleteCustomer(customerId);
        if (response.success) {
          setCustomers(customers.filter(c => c.customer_id !== customerId));
          if (selectedCustomer?.customer_id === customerId) {
            setSelectedCustomer(null);
          }
        } else {
          setError(response.error || 'Failed to delete customer');
        }
      } catch (err) {
        setError('Failed to delete customer');
      }
    }
  };

  const filteredCustomers = customers
    .filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           customer.phone.includes(searchQuery) ||
                           (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesFilter = filterStatus === 'all' || 
                           (filterStatus === 'active' && customer.is_active_customer) ||
                           (filterStatus === 'credit' && customer.outstanding_credit > 0) ||
                           (filterStatus === 'inactive' && !customer.is_active_customer);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'credit':
          comparison = a.outstanding_credit - b.outstanding_credit;
          break;
        case 'last_purchase':
          // This would need to be implemented with actual purchase data
          comparison = 0;
          break;
        case 'total_spent':
          // This would need to be implemented with actual spending data
          comparison = 0;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="customers-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <h1>
              <Users size={24} />
              Customer Management
            </h1>
            <p>Manage customer relationships, track purchases, and handle credit</p>
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
              className="action-btn secondary"
              onClick={handleExportCustomers}
              title="Export Customers"
            >
              <Download size={16} />
              Export
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

      <div className="customers-container">
        {/* Left Panel - Customer List */}
        <div className="customers-left-panel">
          {/* Search and Filter */}
          <div className="search-section">
            <div className="search-bar">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search customers by name, phone, or email..."
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
                All ({customers.length})
              </button>
              <button
                className={`filter-tab ${filterStatus === 'active' ? 'active' : ''}`}
                onClick={() => setFilterStatus('active')}
              >
                Active ({customers.filter(c => c.is_active_customer).length})
              </button>
              <button
                className={`filter-tab ${filterStatus === 'credit' ? 'active' : ''}`}
                onClick={() => setFilterStatus('credit')}
              >
                With Credit ({customers.filter(c => c.outstanding_credit > 0).length})
              </button>
              <button
                className={`filter-tab ${filterStatus === 'inactive' ? 'active' : ''}`}
                onClick={() => setFilterStatus('inactive')}
              >
                Inactive ({customers.filter(c => !c.is_active_customer).length})
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="advanced-filters">
                <div className="filter-group">
                  <label>Sort by:</label>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="filter-select"
                  >
                    <option value="name">Name</option>
                    <option value="credit">Outstanding Credit</option>
                    <option value="last_purchase">Last Purchase</option>
                    <option value="total_spent">Total Spent</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Order:</label>
                  <button
                    className={`sort-btn ${sortOrder === 'asc' ? 'active' : ''}`}
                    onClick={() => setSortOrder('asc')}
                  >
                    <ArrowUpRight size={14} />
                    Asc
                  </button>
                  <button
                    className={`sort-btn ${sortOrder === 'desc' ? 'active' : ''}`}
                    onClick={() => setSortOrder('desc')}
                  >
                    <ArrowDownRight size={14} />
                    Desc
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add Customer Button */}
          <div className="add-customer-section">
            <button className="add-customer-btn" onClick={() => setShowCreateModal(true)}>
              <Plus size={20} />
              Add New Customer
            </button>
          </div>

          {/* Customer List */}
          <div className="customer-list">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading customers...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <AlertCircle size={24} />
                <p>{error}</p>
                <button onClick={loadCustomers} className="retry-btn">Retry</button>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="empty-state">
                <Users size={48} />
                <p>No customers found</p>
                <p>Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredCustomers.map(customer => (
                <div
                  key={customer.customer_id}
                  className={`customer-card ${selectedCustomer?.customer_id === customer.customer_id ? 'selected' : ''}`}
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <div className="customer-header">
                    <div className="customer-name">
                      <h4>{customer.name}</h4>
                      <div className="customer-status">
                        {customer.is_active_customer ? (
                          <span className="status-badge active">Active</span>
                        ) : (
                          <span className="status-badge inactive">Inactive</span>
                        )}
                        {customer.outstanding_credit > 0 && (
                          <span className="status-badge credit">₹{customer.outstanding_credit}</span>
                        )}
                      </div>
                    </div>
                    <div className="customer-actions">
                      <button
                        className="action-btn edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCustomer(customer);
                        }}
                        title="Edit Customer"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomer(customer.customer_id);
                        }}
                        title="Delete Customer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="customer-details">
                    <div className="detail-item">
                      <Phone size={14} />
                      <span>{customer.phone}</span>
                    </div>
                    {customer.email && (
                      <div className="detail-item">
                        <Mail size={14} />
                        <span>{customer.email}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <MapPin size={14} />
                      <span>{customer.address}</span>
                    </div>
                  </div>

                  {/* Customer Metrics */}
                  <div className="customer-metrics">
                    <div className="metric-item">
                      <ShoppingBag size={14} />
                      <span>0 purchases</span>
                    </div>
                    <div className="metric-item">
                      <IndianRupee size={14} />
                      <span>₹0 spent</span>
                    </div>
                    <div className="metric-item">
                      <Clock size={14} />
                      <span>Never</span>
                    </div>
                  </div>

                  {customer.outstanding_credit > 0 && (
                    <div className="credit-warning">
                      <AlertCircle size={16} />
                      <span>Outstanding: ₹{customer.outstanding_credit}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Customer Details */}
        <div className="customers-right-panel">
          {selectedCustomer ? (
            <div className="customer-details-view">
              {/* Customer Header */}
              <div className="customer-header">
                <div className="customer-info">
                  <h2>{selectedCustomer.name}</h2>
                  <div className="customer-meta">
                    <div className="meta-item">
                      <Phone size={16} />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    {selectedCustomer.email && (
                      <div className="meta-item">
                        <Mail size={16} />
                        <span>{selectedCustomer.email}</span>
                      </div>
                    )}
                    <div className="meta-item">
                      <MapPin size={16} />
                      <span>{selectedCustomer.address}</span>
                    </div>
                  </div>
                </div>
                
                <div className="customer-actions">
                  <button
                    className="action-btn primary"
                    onClick={() => handleEditCustomer(selectedCustomer)}
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  {selectedCustomer.outstanding_credit > 0 && (
                    <button
                      className="action-btn success"
                      onClick={() => handlePayCredit(selectedCustomer)}
                    >
                      <CreditCard size={16} />
                      Pay Credit
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="customer-tabs">
                <button
                  className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <TrendingUp size={16} />
                  Overview
                </button>
                <button
                  className={`tab-btn ${activeTab === 'purchases' ? 'active' : ''}`}
                  onClick={() => setActiveTab('purchases')}
                >
                  <History size={16} />
                  Purchase History
                </button>
                <button
                  className={`tab-btn ${activeTab === 'outstanding' ? 'active' : ''}`}
                  onClick={() => setActiveTab('outstanding')}
                >
                  <IndianRupee size={16} />
                  Outstanding
                </button>
                <button
                  className={`tab-btn ${activeTab === 'returns' ? 'active' : ''}`}
                  onClick={() => setActiveTab('returns')}
                >
                  <AlertCircle size={16} />
                  Returns
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'overview' && (
                  <div className="overview-tab">
                    {customerStats && (
                      <div className="stats-grid">
                        <div className="stat-card">
                          <div className="stat-icon">
                            <History size={24} />
                          </div>
                          <div className="stat-content">
                            <h4>{customerStats.total_purchases}</h4>
                            <p>Total Purchases</p>
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-icon">
                            <IndianRupee size={24} />
                          </div>
                          <div className="stat-content">
                            <h4>₹{customerStats.total_spent.toLocaleString()}</h4>
                            <p>Total Spent</p>
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-icon">
                            <TrendingUp size={24} />
                          </div>
                          <div className="stat-content">
                            <h4>₹{customerStats.average_order_value.toLocaleString()}</h4>
                            <p>Average Order</p>
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-icon">
                            <Calendar size={24} />
                          </div>
                          <div className="stat-content">
                            <h4>{new Date(customerStats.last_purchase_date).toLocaleDateString()}</h4>
                            <p>Last Purchase</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="customer-info-card">
                      <h3>Personal Information</h3>
                      <div className="info-grid">
                        <div className="info-item">
                          <label>Name:</label>
                          <span>{selectedCustomer.name}</span>
                        </div>
                        <div className="info-item">
                          <label>Phone:</label>
                          <span>{selectedCustomer.phone}</span>
                        </div>
                        {selectedCustomer.email && (
                          <div className="info-item">
                            <label>Email:</label>
                            <span>{selectedCustomer.email}</span>
                          </div>
                        )}
                        <div className="info-item">
                          <label>Address:</label>
                          <span>{selectedCustomer.address}</span>
                        </div>
                        {selectedCustomer.city && (
                          <div className="info-item">
                            <label>City:</label>
                            <span>{selectedCustomer.city}</span>
                          </div>
                        )}
                        {selectedCustomer.state && (
                          <div className="info-item">
                            <label>State:</label>
                            <span>{selectedCustomer.state}</span>
                          </div>
                        )}
                        {selectedCustomer.date_of_birth && (
                          <div className="info-item">
                            <label>Date of Birth:</label>
                            <span>{new Date(selectedCustomer.date_of_birth).toLocaleDateString()}</span>
                          </div>
                        )}
                        {selectedCustomer.gender && (
                          <div className="info-item">
                            <label>Gender:</label>
                            <span>{selectedCustomer.gender}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'purchases' && (
                  <div className="purchases-tab">
                    <div className="tab-header">
                      <h3>Purchase History</h3>
                      <div className="tab-actions">
                        <button className="action-btn secondary">
                          <Download size={16} />
                          Export
                        </button>
                      </div>
                    </div>
                    
                    {customerReturns.length > 0 ? (
                      <div className="purchases-list">
                        {customerReturns.map((invoice: any) => (
                          <div key={invoice.invoice_id} className="purchase-item">
                            <div className="purchase-header">
                              <div className="purchase-info">
                                <h4>Invoice #{invoice.invoice_id}</h4>
                                <span className="purchase-date">{new Date(invoice.sale_date).toLocaleDateString()}</span>
                              </div>
                              <div className="purchase-amount">
                                <span className="amount">₹{invoice.total_amount.toFixed(2)}</span>
                                <span className={`payment-method ${invoice.payment_method.toLowerCase()}`}>
                                  {invoice.payment_method}
                                </span>
                              </div>
                            </div>
                            <div className="purchase-details">
                              <div className="detail">
                                <span className="label">Status:</span>
                                <span className={`status ${invoice.payment_status.toLowerCase()}`}>
                                  {invoice.payment_status}
                                </span>
                              </div>
                              <div className="detail">
                                <span className="label">GST:</span>
                                <span>₹{invoice.total_gst.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <Receipt size={48} />
                        <p>No purchase history found</p>
                        <p>This customer hasn't made any purchases yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'outstanding' && (
                  <div className="outstanding-tab">
                    <div className="tab-header">
                      <h3>Outstanding Payments</h3>
                      {selectedCustomer?.outstanding_credit > 0 && (
                        <button 
                          className="action-btn success"
                          onClick={() => handlePayCredit(selectedCustomer)}
                        >
                          <CreditCard size={16} />
                          Pay Credit
                        </button>
                      )}
                    </div>
                    
                    {selectedCustomer?.outstanding_credit > 0 ? (
                      <div className="outstanding-content">
                        <div className="credit-summary">
                          <div className="credit-amount">
                            <h4>₹{selectedCustomer.outstanding_credit.toFixed(2)}</h4>
                            <p>Outstanding Credit</p>
                          </div>
                          <div className="credit-actions">
                            <button className="action-btn primary">
                              <CreditCard size={16} />
                              Make Payment
                            </button>
                            <button className="action-btn secondary">
                              <History size={16} />
                              View History
                            </button>
                          </div>
                        </div>
                        
                        <div className="credit-details">
                          <h4>Credit Details</h4>
                          <div className="detail-grid">
                            <div className="detail-item">
                              <span className="label">Total Outstanding:</span>
                              <span className="value">₹{selectedCustomer.outstanding_credit.toFixed(2)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Payment Status:</span>
                              <span className={`status ${selectedCustomer.payment_status.toLowerCase()}`}>
                                {selectedCustomer.payment_status}
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Customer Since:</span>
                              <span className="value">{new Date(selectedCustomer.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="empty-state">
                        <IndianRupee size={48} />
                        <p>No outstanding payments</p>
                        <p>This customer has no outstanding credit</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'returns' && (
                  <div className="returns-tab">
                    <div className="tab-header">
                      <h3>Return History</h3>
                      <div className="tab-actions">
                        <button className="action-btn secondary">
                          <Download size={16} />
                          Export
                        </button>
                      </div>
                    </div>
                    
                    {customerReturns.length > 0 ? (
                      <div className="returns-list">
                        {customerReturns.map((returnItem) => (
                          <div key={returnItem.return_id} className="return-item">
                            <div className="return-header">
                              <div className="return-info">
                                <h4>Return #{returnItem.return_id}</h4>
                                <span className="return-date">{new Date(returnItem.return_date).toLocaleDateString()}</span>
                              </div>
                              <div className="return-amount">
                                <span className="amount">₹{returnItem.refund_amount.toFixed(2)}</span>
                                <span className="status processed">Processed</span>
                              </div>
                            </div>
                            <div className="return-details">
                              <div className="detail">
                                <span className="label">Reason:</span>
                                <span>{returnItem.reason_for_return}</span>
                              </div>
                              <div className="detail">
                                <span className="label">Quantity:</span>
                                <span>{returnItem.quantity_returned}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <AlertCircle size={48} />
                        <p>No return history found</p>
                        <p>This customer hasn't made any returns yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <Users size={64} />
              <h3>Select a Customer</h3>
              <p>Choose a customer from the list to view their details and manage their account.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Customer</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="text"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label>Address *</label>
                <textarea
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                  placeholder="Enter full address"
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer({...newCustomer, city: e.target.value})}
                    placeholder="Enter city"
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    value={newCustomer.state}
                    onChange={(e) => setNewCustomer({...newCustomer, state: e.target.value})}
                    placeholder="Enter state"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>ZIP Code</label>
                  <input
                    type="text"
                    value={newCustomer.zip_code}
                    onChange={(e) => setNewCustomer({...newCustomer, zip_code: e.target.value})}
                    placeholder="Enter ZIP code"
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={newCustomer.gender}
                    onChange={(e) => setNewCustomer({...newCustomer, gender: e.target.value})}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={newCustomer.date_of_birth}
                  onChange={(e) => setNewCustomer({...newCustomer, date_of_birth: e.target.value})}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleCreateCustomer}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
