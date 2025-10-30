import React from 'react';
import { Plus, Minus, Trash2, Package } from 'lucide-react';
import { CartItem as CartItemType } from '@/types';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (medicineId: number, quantity: number) => void;
  onRemoveItem: (medicineId: number) => void;
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemoveItem
}) => {
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemoveItem(item.medicine_id);
    } else {
      onUpdateQuantity(item.medicine_id, newQuantity);
    }
  };

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`;
  };

  return (
    <div className="cart-item">
      <div className="item-info">
        <div className="medicine-details">
          <h4>{item.medicine_name}</h4>
          <p className="dosage-form">{item.dosage_form}</p>
          <p className="strength">{item.strength}</p>
        </div>
        <div className="item-price">
          <span className="unit-price">{formatPrice(item.unit_price)}</span>
          <span className="per-unit">per unit</span>
        </div>
      </div>

      <div className="item-controls">
        <div className="quantity-controls">
          <button
            className="quantity-btn"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Minus size={14} />
          </button>
          <span className="quantity">{item.quantity}</span>
          <button
            className="quantity-btn"
            onClick={() => handleQuantityChange(item.quantity + 1)}
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="item-total">
          <span className="total-amount">{formatPrice(item.total_amount)}</span>
        </div>

        <button
          className="remove-btn"
          onClick={() => onRemoveItem(item.medicine_id)}
          title="Remove from cart"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default CartItem;
