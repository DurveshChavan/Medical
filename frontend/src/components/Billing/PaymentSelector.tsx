import React from 'react';
import { CreditCard, Smartphone, Banknote, IndianRupee } from 'lucide-react';

interface PaymentSelectorProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  disabled?: boolean;
}

const PaymentSelector: React.FC<PaymentSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  disabled = false
}) => {
  const paymentMethods = [
    {
      value: 'Cash',
      label: 'Cash',
      icon: Banknote,
      description: 'Cash payment'
    },
    {
      value: 'Card',
      label: 'Card',
      icon: CreditCard,
      description: 'Credit/Debit card'
    },
    {
      value: 'UPI',
      label: 'UPI',
      icon: Smartphone,
      description: 'UPI payment'
    },
    {
      value: 'Credit',
      label: 'Credit',
      icon: IndianRupee,
      description: 'Pay later'
    }
  ];

  return (
    <div className="payment-selector">
      <h4>Payment Method</h4>
      <div className="payment-methods">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          return (
            <label
              key={method.value}
              className={`payment-method ${selectedMethod === method.value ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.value}
                checked={selectedMethod === method.value}
                onChange={(e) => onMethodChange(e.target.value)}
                disabled={disabled}
              />
              <div className="method-content">
                <Icon size={20} />
                <div className="method-info">
                  <span className="method-label">{method.label}</span>
                  <span className="method-description">{method.description}</span>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {selectedMethod === 'Credit' && (
        <div className="credit-warning">
          <IndianRupee size={16} />
          <span>This will add to customer's outstanding credit</span>
        </div>
      )}
    </div>
  );
};

export default PaymentSelector;
