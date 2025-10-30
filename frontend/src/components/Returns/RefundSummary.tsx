import React, { useState } from 'react';
import { IndianRupee, CreditCard, Smartphone, Banknote, CheckCircle, AlertCircle } from 'lucide-react';
import { ReturnRequest, RefundRequest } from '@/api/returns';

interface RefundSummaryProps {
  returnItems: ReturnRequest[];
  onProcessRefunds: (refundData: RefundRequest[]) => void;
  isProcessing: boolean;
}

const RefundSummary: React.FC<RefundSummaryProps> = ({
  returnItems,
  onProcessRefunds,
  isProcessing
}) => {
  const [refundMethods, setRefundMethods] = useState<{ [key: number]: string }>({});
  const [refundReasons, setRefundReasons] = useState<{ [key: number]: string }>({});

  const calculateRefundAmount = (item: ReturnRequest) => {
    // This would typically be calculated based on the original sale price
    // For now, we'll use a simple calculation
    return item.quantity_returned * 100; // Placeholder calculation
  };

  const handleRefundMethodChange = (returnId: number, method: string) => {
    setRefundMethods(prev => ({ ...prev, [returnId]: method }));
  };

  const handleRefundReasonChange = (returnId: number, reason: string) => {
    setRefundReasons(prev => ({ ...prev, [returnId]: reason }));
  };

  const processRefunds = () => {
    const refundData: RefundRequest[] = returnItems.map(item => ({
      return_id: item.sale_id, // This would be the actual return_id after processing
      customer_id: item.customer_id,
      payment_method: refundMethods[item.sale_id] || 'Cash',
      refund_amount: calculateRefundAmount(item),
      refund_reason: refundReasons[item.sale_id] || 'Return processed'
    }));

    onProcessRefunds(refundData);
  };

  const formatPrice = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const totalRefundAmount = returnItems.reduce((sum, item) => sum + calculateRefundAmount(item), 0);

  const paymentMethods = [
    { value: 'Cash', label: 'Cash', icon: Banknote },
    { value: 'Card', label: 'Card', icon: CreditCard },
    { value: 'UPI', label: 'UPI', icon: Smartphone },
    { value: 'Bank Transfer', label: 'Bank Transfer', icon: IndianRupee }
  ];

  return (
    <div className="refund-summary">
      <div className="summary-header">
        <h3>
          <IndianRupee size={20} />
          Refund Summary
        </h3>
        <p>Process refunds for returned items</p>
      </div>

      {returnItems.length === 0 ? (
        <div className="empty-refunds">
          <AlertCircle size={48} />
          <p>No returns to process</p>
          <p>Add items to return first</p>
        </div>
      ) : (
        <>
          <div className="refund-items">
            <h4>Return Items ({returnItems.length})</h4>
            <div className="items-list">
              {returnItems.map((item) => {
                const refundAmount = calculateRefundAmount(item);
                const selectedMethod = refundMethods[item.sale_id] || 'Cash';
                const reason = refundReasons[item.sale_id] || '';

                return (
                  <div key={item.sale_id} className="refund-item">
                    <div className="item-info">
                      <h5>Sale ID: {item.sale_id}</h5>
                      <p>Quantity: {item.quantity_returned}</p>
                      <p>Reason: {item.reason_for_return}</p>
                    </div>

                    <div className="refund-details">
                      <div className="refund-amount">
                        <label>Refund Amount:</label>
                        <span className="amount">{formatPrice(refundAmount)}</span>
                      </div>

                      <div className="refund-method">
                        <label>Payment Method:</label>
                        <select
                          value={selectedMethod}
                          onChange={(e) => handleRefundMethodChange(item.sale_id, e.target.value)}
                          className="method-select"
                        >
                          {paymentMethods.map((method) => {
                            const Icon = method.icon;
                            return (
                              <option key={method.value} value={method.value}>
                                {method.label}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="refund-reason">
                        <label>Refund Reason:</label>
                        <input
                          type="text"
                          placeholder="Enter refund reason..."
                          value={reason}
                          onChange={(e) => handleRefundReasonChange(item.sale_id, e.target.value)}
                          className="reason-input"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="refund-totals">
            <div className="total-row">
              <span>Total Refund Amount:</span>
              <span className="total-amount">{formatPrice(totalRefundAmount)}</span>
            </div>
          </div>

          <div className="refund-actions">
            <button
              className="process-refunds-btn"
              onClick={processRefunds}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="loading-spinner small"></div>
                  Processing Refunds...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Process Refunds
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default RefundSummary;
