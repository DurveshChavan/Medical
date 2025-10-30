import React from 'react';
import { ShoppingCart, IndianRupee, Receipt } from 'lucide-react';
import { CartItem } from '@/types';

interface CartSummaryProps {
  items: CartItem[];
  onClearCart: () => void;
  onCheckout: () => void;
  isProcessing: boolean;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  items,
  onClearCart,
  onCheckout,
  isProcessing
}) => {
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total_amount, 0);
  };

  const calculateGST = (subtotal: number) => {
    return subtotal * 0.18; // 18% GST
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const gst = calculateGST(subtotal);
    return subtotal + gst;
  };

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`;
  };

  const subtotal = calculateSubtotal();
  const gst = calculateGST(subtotal);
  const total = calculateTotal();

  return (
    <div className="cart-summary">
      <div className="summary-header">
        <ShoppingCart size={20} />
        <h3>Cart Summary</h3>
        <span className="item-count">{items.length} items</span>
      </div>

      {items.length === 0 ? (
        <div className="empty-cart">
          <ShoppingCart size={48} />
          <p>Your cart is empty</p>
          <p>Add medicines to get started</p>
        </div>
      ) : (
        <>
          <div className="summary-details">
            <div className="detail-row">
              <span>Subtotal:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="detail-row">
              <span>GST (18%):</span>
              <span>{formatPrice(gst)}</span>
            </div>
            <div className="detail-row total">
              <span>Total:</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <div className="summary-actions">
            <button
              className="action-btn secondary"
              onClick={onClearCart}
              disabled={isProcessing}
            >
              Clear Cart
            </button>
            <button
              className="action-btn primary"
              onClick={onCheckout}
              disabled={isProcessing || items.length === 0}
            >
              {isProcessing ? (
                <>
                  <div className="loading-spinner small"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Receipt size={16} />
                  Checkout
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartSummary;
