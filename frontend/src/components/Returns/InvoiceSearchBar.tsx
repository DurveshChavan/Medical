import React, { useState, useEffect } from 'react';
import { Search, Receipt, AlertCircle } from 'lucide-react';
import { InvoiceForReturn } from '@/api/returns';
import { returnsAPI } from '@/api/returns';

interface InvoiceSearchBarProps {
  onInvoiceSelect: (invoice: InvoiceForReturn) => void;
  onSearchResults: (invoices: InvoiceForReturn[]) => void;
}

const InvoiceSearchBar: React.FC<InvoiceSearchBarProps> = ({
  onInvoiceSelect,
  onSearchResults
}) => {
  const [query, setQuery] = useState('');
  const [invoices, setInvoices] = useState<InvoiceForReturn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchInvoices(query);
      } else {
        setInvoices([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const searchInvoices = async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await returnsAPI.searchInvoices(searchQuery);
      if (response.success && response.data) {
        setInvoices(response.data);
        onSearchResults(response.data);
        setShowResults(true);
      } else {
        setError(response.error || 'Search failed');
        setInvoices([]);
      }
    } catch (err) {
      setError('Search failed');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceClick = (invoice: InvoiceForReturn) => {
    onInvoiceSelect(invoice);
    setQuery('');
    setShowResults(false);
  };

  const formatPrice = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="invoice-search-bar">
      <div className="search-input-container">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          placeholder="Search by Invoice ID, Customer Name, or Phone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        {loading && <div className="loading-spinner small"></div>}
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {showResults && invoices.length > 0 && (
        <div className="search-results">
          <div className="results-header">
            <Receipt size={16} />
            <span>Found {invoices.length} invoices</span>
          </div>
          <div className="results-list">
            {invoices.map((invoice) => (
              <div
                key={invoice.invoice_id}
                className="invoice-result-item"
                onClick={() => handleInvoiceClick(invoice)}
              >
                <div className="invoice-info">
                  <h4>Invoice #{invoice.invoice_id}</h4>
                  <p className="invoice-date">{formatDate(invoice.sale_date)}</p>
                  <p className="customer-name">
                    {invoice.customer_name || 'Walk-in Customer'}
                  </p>
                  <p className="customer-phone">
                    {invoice.customer_phone || 'No phone'}
                  </p>
                </div>
                <div className="invoice-details">
                  <div className="amount">
                    <span className="total-amount">{formatPrice(invoice.total_amount)}</span>
                    <span className="payment-method">{invoice.payment_method}</span>
                  </div>
                  <div className="status">
                    <span className={`status-badge ${invoice.payment_status.toLowerCase()}`}>
                      {invoice.payment_status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showResults && invoices.length === 0 && query.length >= 2 && !loading && (
        <div className="no-results">
          <Receipt size={48} />
          <p>No invoices found</p>
          <p>Try a different search term</p>
        </div>
      )}
    </div>
  );
};

export default InvoiceSearchBar;
