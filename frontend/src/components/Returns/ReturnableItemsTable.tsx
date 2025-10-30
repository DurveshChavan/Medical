import React, { useState } from 'react';
import { Package, AlertCircle, RotateCcw } from 'lucide-react';
import { InvoiceForReturn, ReturnRequest } from '@/api/returns';

interface ReturnableItemsTableProps {
  invoice: InvoiceForReturn;
  returnItems: ReturnRequest[];
  onReturnItem: (saleId: number, medicineId: number, quantity: number, reason: string) => void;
  onRemoveReturnItem: (saleId: number) => void;
}

const ReturnableItemsTable: React.FC<ReturnableItemsTableProps> = ({
  invoice,
  returnItems,
  onReturnItem,
  onRemoveReturnItem
}) => {
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [reasons, setReasons] = useState<{ [key: number]: string }>({});

  const handleQuantityChange = (saleId: number, quantity: number) => {
    setQuantities(prev => ({ ...prev, [saleId]: quantity }));
  };

  const handleReasonChange = (saleId: number, reason: string) => {
    setReasons(prev => ({ ...prev, [saleId]: reason }));
  };

  const handleAddReturn = (saleId: number, medicineId: number) => {
    const quantity = quantities[saleId] || 0;
    const reason = reasons[saleId] || 'No reason provided';
    
    if (quantity > 0) {
      onReturnItem(saleId, medicineId, quantity, reason);
      setQuantities(prev => ({ ...prev, [saleId]: 0 }));
      setReasons(prev => ({ ...prev, [saleId]: '' }));
    }
  };

  const formatPrice = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const getReturnedQuantity = (saleId: number) => {
    const returnItem = returnItems.find(item => item.sale_id === saleId);
    return returnItem ? returnItem.quantity_returned : 0;
  };

  const getRemainingQuantity = (saleId: number, totalSold: number) => {
    const returned = getReturnedQuantity(saleId);
    return totalSold - returned;
  };

  return (
    <div className="returnable-items-table">
      <div className="table-header">
        <h3>
          <Package size={20} />
          Returnable Items
        </h3>
        <p>Select items to return from Invoice #{invoice.invoice_id}</p>
      </div>

      <div className="items-table">
        <div className="table-header-row">
          <div className="col-medicine">Medicine</div>
          <div className="col-quantity">Sold</div>
          <div className="col-returned">Returned</div>
          <div className="col-remaining">Remaining</div>
          <div className="col-price">Price</div>
          <div className="col-actions">Actions</div>
        </div>

        {invoice.items.map((item) => {
          const returnedQty = getReturnedQuantity(item.sale_id);
          const remainingQty = getRemainingQuantity(item.sale_id, item.quantity_sold);
          const isFullyReturned = remainingQty === 0;
          const isPartiallyReturned = returnedQty > 0;

          return (
            <div
              key={item.sale_id}
              className={`item-row ${isFullyReturned ? 'fully-returned' : ''} ${isPartiallyReturned ? 'partially-returned' : ''}`}
            >
              <div className="col-medicine">
                <div className="medicine-info">
                  <h4>{item.medicine_name}</h4>
                  <p className="generic-name">{item.generic_name}</p>
                  <p className="brand">{item.brand}</p>
                </div>
              </div>

              <div className="col-quantity">
                <span className="quantity-badge">{item.quantity_sold}</span>
              </div>

              <div className="col-returned">
                {returnedQty > 0 ? (
                  <span className="returned-badge">{returnedQty}</span>
                ) : (
                  <span className="no-returns">-</span>
                )}
              </div>

              <div className="col-remaining">
                <span className={`remaining-badge ${remainingQty === 0 ? 'zero' : ''}`}>
                  {remainingQty}
                </span>
              </div>

              <div className="col-price">
                <span className="unit-price">{formatPrice(item.unit_price_at_sale)}</span>
                <span className="total-price">{formatPrice(item.total_amount)}</span>
              </div>

              <div className="col-actions">
                {!isFullyReturned ? (
                  <div className="return-controls">
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      max={remainingQty}
                      value={quantities[item.sale_id] || ''}
                      onChange={(e) => handleQuantityChange(item.sale_id, parseInt(e.target.value) || 0)}
                      className="quantity-input"
                    />
                    <input
                      type="text"
                      placeholder="Reason"
                      value={reasons[item.sale_id] || ''}
                      onChange={(e) => handleReasonChange(item.sale_id, e.target.value)}
                      className="reason-input"
                    />
                    <button
                      className="add-return-btn"
                      onClick={() => handleAddReturn(item.sale_id, item.medicine_id)}
                      disabled={!quantities[item.sale_id] || quantities[item.sale_id] <= 0}
                    >
                      <RotateCcw size={14} />
                      Add Return
                    </button>
                  </div>
                ) : (
                  <div className="fully-returned-status">
                    <AlertCircle size={16} />
                    <span>Fully Returned</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
                  onClick={() => onRemoveReturnItem(item.sale_id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnableItemsTable;
