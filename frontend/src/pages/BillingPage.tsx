import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  X, 
  ShoppingCart, 
  CreditCard, 
  Smartphone, 
  Banknote,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Receipt,
  Trash2,
  Users
} from 'lucide-react';
import { billingAPI } from '@/api/billing';
import { customersAPI } from '@/api/customers';
import { 
  MedicineWithStock, 
  CartItem, 
  Customer, 
  InvoiceCreateRequest,
  InvoiceTotals,
  PendingInvoice 
} from '@/types';
import CustomerModal from '@/components/Billing/CustomerModal';
import CustomerSelector from '@/components/Billing/CustomerSelector';
import '@/styles/billing.css';

const BillingPage: React.FC = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MedicineWithStock[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Credit'>('Cash');
  const [totals, setTotals] = useState<InvoiceTotals>({
    subtotal: 0,
    gst_percentage: 18,
    gst_amount: 0,
    total: 0
  });
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Load initial data
  useEffect(() => {
    loadPendingInvoices();
    loadCustomers();
  }, []);

  // Calculate totals when cart changes
  useEffect(() => {
    calculateTotals();
  }, [cart]);

  const loadPendingInvoices = async () => {
    try {
      const response = await billingAPI.getPendingInvoices();
      if (response.success && response.data) {
        setPendingInvoices(response.data);
      }
    } catch (err) {
      console.error('Error loading pending invoices:', err);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await customersAPI.getAllCustomers();
      if (response.success && response.data) {
        setCustomers(response.data);
      }
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const searchMedicines = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await billingAPI.searchMedicines(query);
      if (response.success && response.data) {
        setSearchResults(response.data);
      } else {
        setError(response.error || 'Failed to search medicines');
      }
    } catch (err) {
      setError('Error searching medicines');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (medicine: MedicineWithStock) => {
    const existingItem = cart.find(item => item.medicine_id === medicine.medicine_id);
    
    if (existingItem) {
      // Update quantity
      setCart(cart.map(item => 
        item.medicine_id === medicine.medicine_id
          ? { ...item, quantity: item.quantity + 1, total_amount: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      // Add new item
      const newItem: CartItem = {
        medicine_id: medicine.medicine_id,
        medicine_name: medicine.medicine_name,
        generic_name: medicine.generic_name,
        brand: medicine.brand,
        dosage_form: medicine.dosage_form,
        strength: medicine.strength,
        quantity: 1,
        unit_price: medicine.avg_selling_price,
        total_amount: medicine.avg_selling_price
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartQuantity = (medicineId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(medicineId);
      return;
    }

    setCart(cart.map(item => 
      item.medicine_id === medicineId
        ? { ...item, quantity: newQuantity, total_amount: newQuantity * item.unit_price }
        : item
    ));
  };

  const removeFromCart = (medicineId: number) => {
    setCart(cart.filter(item => item.medicine_id !== medicineId));
  };

  const calculateTotals = () => {
    if (cart.length === 0) {
      setTotals({
        subtotal: 0,
        gst_percentage: 18,
        gst_amount: 0,
        total: 0
      });
      return;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.total_amount, 0);
    const gst_amount = subtotal * 0.18;
    const total = subtotal + gst_amount;

    setTotals({
      subtotal,
      gst_percentage: 18,
      gst_amount,
      total
    });
  };

  const createInvoice = async (paymentStatus: 'Paid' | 'Pending') => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const invoiceData: InvoiceCreateRequest = {
        customer_id: selectedCustomer?.customer_id,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        outstanding_credit: paymentMethod === 'Credit' ? totals.total : 0,
        cart_items: cart,
        totals: totals
      } as InvoiceCreateRequest;

      const response = await billingAPI.createInvoice(invoiceData);
      
      if (response.success && response.data) {
        setSuccess(`Invoice ${response.data.invoice_id} created successfully!`);
        setCart([]);
        setSelectedCustomer(null);
        loadPendingInvoices();
        
        // Auto-print if paid
        if (paymentStatus === 'Paid' && response.data) {
          const invoiceId = response.data.invoice_id;
          setTimeout(() => {
            billingAPI.printInvoice(parseInt(invoiceId.toString()));
          }, 1000);
        }
      } else {
        setError(response.error || 'Failed to create invoice');
      }
    } catch (err) {
      setError('Error creating invoice');
    } finally {
      setLoading(false);
    }
  };

  const finalizePendingInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      const response = await billingAPI.finalizeInvoice(parseInt(invoiceId), paymentMethod);
      
      if (response.success) {
        setSuccess(`Invoice ${invoiceId} finalized successfully!`);
        loadPendingInvoices();
        billingAPI.printInvoice(parseInt(invoiceId));
      } else {
        setError(response.error || 'Failed to finalize invoice');
      }
    } catch (err) {
      setError('Error finalizing invoice');
    } finally {
      setLoading(false);
    }
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="billing-page">
      <div className="billing-container">
        {/* Left Panel - Medicine Search and Cart */}
        <div className="billing-left-panel">
          {/* Medicine Search */}
          <div className="search-section">
            <div className="search-bar">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search medicines by name, brand, or category..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchMedicines(e.target.value);
                }}
                className="search-input"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((medicine) => (
                  <div key={medicine.medicine_id} className="medicine-item">
                    <div className="medicine-info">
                      <h4>{medicine.medicine_name}</h4>
                      <p className="medicine-details">
                        {medicine.dosage_form} {medicine.strength} | {medicine.category}
                      </p>
                      <p className="medicine-stock">
                        Stock: {medicine.total_stock} | Price: ₹{medicine.avg_selling_price.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => addToCart(medicine)}
                      className="add-to-cart-btn"
                      disabled={medicine.total_stock === 0}
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="cart-section">
            <div className="cart-header">
              <ShoppingCart size={20} />
              <h3>Cart ({cart.length} items)</h3>
              {cart.length > 0 && (
                <button onClick={clearCart} className="clear-cart-btn">
                  <Trash2 size={16} />
                  Clear
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart">
                <ShoppingCart size={48} />
                <p>Your cart is empty</p>
                <p>Search and add medicines to get started</p>
              </div>
            ) : (
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={item.medicine_id} className="cart-item">
                    <div className="item-info">
                      <h4>{item.medicine_name}</h4>
                      <p>{item.dosage_form} {item.strength}</p>
                      <p className="item-price">₹{item.unit_price.toFixed(2)} each</p>
                    </div>
                    <div className="item-controls">
                      <button
                        onClick={() => updateCartQuantity(item.medicine_id, item.quantity - 1)}
                        className="quantity-btn"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.medicine_id, item.quantity + 1)}
                        className="quantity-btn"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="item-total">
                      <span>₹{item.total_amount.toFixed(2)}</span>
                      <button
                        onClick={() => removeFromCart(item.medicine_id)}
                        className="remove-btn"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Billing Summary and Actions */}
        <div className="billing-right-panel">
          {/* Customer Selection */}
          <div className="customer-section">
            <h3>Customer</h3>
            <CustomerSelector
              selectedCustomer={selectedCustomer}
              onCustomerSelect={setSelectedCustomer}
              onCustomerCreate={(customer) => {
                setSelectedCustomer(customer);
                setCustomers([...customers, customer]);
              }}
            />
            <button
              className="manage-customers-btn"
              onClick={() => setShowCustomerModal(true)}
            >
              <Users size={16} />
              Manage
            </button>
          </div>

          {/* Payment Method */}
          <div className="payment-section">
            <h3>Payment Method</h3>
            <div className="payment-methods">
              <button
                onClick={() => setPaymentMethod('Cash')}
                className={`payment-btn ${paymentMethod === 'Cash' ? 'active' : ''}`}
              >
                <Banknote size={20} />
                Cash
              </button>
              <button
                onClick={() => setPaymentMethod('Card')}
                className={`payment-btn ${paymentMethod === 'Card' ? 'active' : ''}`}
              >
                <CreditCard size={20} />
                Card
              </button>
              <button
                onClick={() => setPaymentMethod('UPI')}
                className={`payment-btn ${paymentMethod === 'UPI' ? 'active' : ''}`}
              >
                <Smartphone size={20} />
                UPI
              </button>
              <button
                onClick={() => setPaymentMethod('Credit')}
                className={`payment-btn ${paymentMethod === 'Credit' ? 'active' : ''}`}
              >
                <User size={20} />
                Credit
              </button>
            </div>
          </div>

          {/* Totals */}
          <div className="totals-section">
            <div className="totals-row">
              <span>Subtotal:</span>
              <span>₹{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="totals-row">
              <span>GST ({totals.gst_percentage}%):</span>
              <span>₹{totals.gst_amount.toFixed(2)}</span>
            </div>
            <div className="totals-row total-final">
              <span><strong>Total:</strong></span>
              <span><strong>₹{totals.total.toFixed(2)}</strong></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              onClick={() => createInvoice('Pending')}
              disabled={cart.length === 0 || loading}
              className="pending-btn"
            >
              <Clock size={20} />
              Save as Pending
            </button>
            <button
              onClick={() => createInvoice('Paid')}
              disabled={cart.length === 0 || loading}
              className="complete-btn"
            >
              <CheckCircle size={20} />
              Complete Sale
            </button>
          </div>

          {/* Pending Invoices */}
          {pendingInvoices.length > 0 && (
            <div className="pending-invoices">
              <h3>Pending Bills</h3>
              <div className="pending-list">
                {pendingInvoices.map((invoice) => (
                  <div key={invoice.invoice_id} className="pending-item">
                    <div className="pending-info">
                      <p><strong>{invoice.invoice_id}</strong></p>
                      <p>{invoice.customer_name}</p>
                      <p>₹{invoice.total_amount.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => finalizePendingInvoice(invoice.invoice_id.toString())}
                      className="resume-btn"
                    >
                      <Receipt size={16} />
                      Resume
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="message error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          {success && (
            <div className="message success">
              <CheckCircle size={16} />
              {success}
            </div>
          )}
        </div>
      </div>

      {/* Customer Modal */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onCustomerCreated={(customer) => {
          setSelectedCustomer(customer);
          setCustomers([...customers, customer]);
          setShowCustomerModal(false);
        }}
      />
    </div>
  );
};

export default BillingPage;
