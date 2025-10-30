import React, { useState, useEffect, useRef } from 'react';
import { Search, User, X } from 'lucide-react';
import { Customer } from '@/types';
import { customersAPI } from '@/api/customers';

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
  onCustomerCreate: (customer: Customer) => void;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  selectedCustomer,
  onCustomerSelect,
  onCustomerCreate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load customers when dropdown opens
  useEffect(() => {
    if (isOpen && customers.length === 0) {
      loadCustomers();
    }
  }, [isOpen]);

  // Filter customers based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customersAPI.getAllCustomers();
      if (response.success && response.data) {
        setCustomers(response.data);
        setFilteredCustomers(response.data);
      } else {
        setError(response.error || 'Failed to load customers');
      }
    } catch (err) {
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect(customer);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClearSelection = () => {
    onCustomerSelect(null);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className="customer-selector" ref={dropdownRef}>
      <div className="customer-input-container">
        <div className="customer-input-wrapper">
          <Search className="search-icon" size={16} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search customers by name, phone, or email..."
            value={selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.phone})` : searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            className="customer-input"
          />
          {selectedCustomer && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="clear-button"
              title="Clear selection"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="customer-dropdown">
          {loading && (
            <div className="dropdown-loading">
              <div className="loading-spinner"></div>
              <span>Loading customers...</span>
            </div>
          )}

          {error && (
            <div className="dropdown-error">
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="dropdown-options">
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className={`dropdown-option ${!selectedCustomer ? 'selected' : ''}`}
                >
                  <User size={16} />
                  <span>Walk-in Customer</span>
                </button>

                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <button
                      key={customer.customer_id}
                      type="button"
                      onClick={() => handleCustomerSelect(customer)}
                      className={`dropdown-option ${selectedCustomer?.customer_id === customer.customer_id ? 'selected' : ''}`}
                    >
                      <div className="customer-info">
                        <div className="customer-name">{customer.name}</div>
                        <div className="customer-details">
                          <span className="customer-phone">{customer.phone}</span>
                          {customer.email && (
                            <span className="customer-email">{customer.email}</span>
                          )}
                        </div>
                        {customer.outstanding_credit > 0 && (
                          <div className="credit-warning">
                            Credit: ₹{customer.outstanding_credit.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="dropdown-empty">
                    {searchQuery ? 'No customers found' : 'No customers available'}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSelector;