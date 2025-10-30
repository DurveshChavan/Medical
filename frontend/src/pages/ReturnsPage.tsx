import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, AlertCircle, Package, Receipt, CheckCircle } from 'lucide-react';
import { InvoiceForReturn, ReturnRequest, RefundRequest } from '@/api/returns';
import { returnsAPI } from '@/api/returns';

const ReturnsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [invoices, setInvoices] = useState<InvoiceForReturn[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceForReturn | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  // Search invoices
  const searchInvoices = async (query: string) => {
    if (query.length < 2) {
      setInvoices([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await returnsAPI.searchInvoices(query);
      if (response.success && response.data) {
        setInvoices(response.data);
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

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchInvoices(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleInvoiceSelect = async (invoice: InvoiceForReturn) => {
    setSelectedInvoice(invoice);
    setReturnItems([]);
    
    // Load invoice details for return
    try {
      const response = await returnsAPI.getInvoiceForReturn(invoice.invoice_id);
      if (response.success && response.data) {
        setSelectedInvoice(response.data);
      }
    } catch (err) {
      setError('Failed to load invoice details');
    }
  };

  const handleReturnItem = (saleId: number, medicineId: number, quantity: number, reason: string) => {
    const existingItem = returnItems.find(item => item.sale_id === saleId);
    
    if (existingItem) {
      setReturnItems(prev => prev.map(item => 
        item.sale_id === saleId 
          ? { ...item, quantity_returned: quantity, reason_for_return: reason }
          : item
      ));
    } else {
      const newReturnItem: ReturnRequest = {
        sale_id: saleId,
        customer_id: selectedInvoice?.customer_id || 0,
        medicine_id: medicineId,
        quantity_returned: quantity,
        reason_for_return: reason,
        refund_amount: 0, // Will be calculated
        refund_method: 'Cash'
      };
      setReturnItems(prev => [...prev, newReturnItem]);
    }
  };

  const removeReturnItem = (saleId: number) => {
    setReturnItems(prev => prev.filter(item => item.sale_id !== saleId));
  };

  const processReturns = async () => {
    if (returnItems.length === 0) return;

    setProcessing(true);
    setError(null);

    try {
      for (const item of returnItems) {
        const response = await returnsAPI.createReturn(item);
        if (!response.success) {
          setError(response.error || 'Failed to process return');
          return;
        }
      }

      // Clear return items and show success
      setReturnItems([]);
      setShowRefundModal(true);
    } catch (err) {
      setError('Failed to process returns');
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="returns-page">
      <div className="page-header">
        <h1>
          <RotateCcw size={24} />
          Returns & Refunds
        </h1>
        <p>Process medicine returns and refunds</p>
      </div>

      <div className="returns-container">
        {/* Search Section */}
        <div className="search-section">
          <div className="search-bar">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search by Invoice ID, Customer Name, or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
        </div>

        {/* Search Results */}
        {invoices.length > 0 && (
          <div className="search-results">
            <h3>Found {invoices.length} invoices</h3>
            <div className="invoices-list">
              {invoices.map((invoice) => (
                <div
                  key={invoice.invoice_id}
                  className={`invoice-card ${selectedInvoice?.invoice_id === invoice.invoice_id ? 'selected' : ''}`}
                  onClick={() => handleInvoiceSelect(invoice)}
                >
                  <div className="invoice-header">
                    <h4>Invoice #{invoice.invoice_id}</h4>
                    <span className="invoice-date">{formatDate(invoice.sale_date)}</span>
                  </div>
                  <div className="invoice-details">
                    <p><strong>Customer:</strong> {invoice.customer_name || 'Walk-in'}</p>
                    <p><strong>Amount:</strong> {formatPrice(invoice.total_amount)}</p>
                    <p><strong>Payment:</strong> {invoice.payment_method}</p>
                    <p><strong>Status:</strong> {invoice.payment_status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Invoice Details */}
        {selectedInvoice && (
          <div className="invoice-details-section">
            <div className="invoice-header">
              <h3>Invoice #{selectedInvoice.invoice_id}</h3>
              <div className="invoice-meta">
                <span>Date: {formatDate(selectedInvoice.sale_date)}</span>
                <span>Customer: {selectedInvoice.customer_name || 'Walk-in'}</span>
                <span>Total: {formatPrice(selectedInvoice.total_amount)}</span>
              </div>
            </div>

            <div className="return-items">
              <h4>Select Items to Return</h4>
              <div className="items-list">
                {selectedInvoice.items.map((item) => (
                  <div key={item.sale_id} className="return-item">
                    <div className="item-info">
                      <h5>{item.medicine_name}</h5>
                      <p>{item.generic_name}</p>
                      <p>Qty: {item.quantity_sold} | Price: {formatPrice(item.unit_price_at_sale)}</p>
                    </div>
                    <div className="return-controls">
                      <input
                        type="number"
                        placeholder="Return Qty"
                        min="1"
                        max={item.quantity_sold}
                        onChange={(e) => {
                          const quantity = parseInt(e.target.value) || 0;
                          const reason = prompt('Reason for return:') || 'No reason provided';
                          if (quantity > 0) {
                            handleReturnItem(item.sale_id, item.medicine_id, quantity, reason);
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Return Summary */}
            {returnItems.length > 0 && (
              <div className="return-summary">
                <h4>Return Summary</h4>
                <div className="summary-items">
                  {returnItems.map((item) => (
                    <div key={item.sale_id} className="summary-item">
                      <span>Sale ID: {item.sale_id}</span>
                      <span>Qty: {item.quantity_returned}</span>
                      <span>Reason: {item.reason_for_return}</span>
                      <button
                        className="remove-btn"
                        onClick={() => removeReturnItem(item.sale_id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="process-returns-btn"
                  onClick={processReturns}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Process Returns'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!selectedInvoice && invoices.length === 0 && searchQuery.length === 0 && (
          <div className="empty-state">
            <Package size={64} />
            <h3>No Returns to Process</h3>
            <p>Search for an invoice to process returns</p>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Process Refunds</h3>
              <button onClick={() => setShowRefundModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Returns have been processed successfully!</p>
              <p>You can now process refunds for the returned items.</p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowRefundModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsPage;