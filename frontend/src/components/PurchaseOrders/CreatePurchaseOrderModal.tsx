import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Save, Package, IndianRupee, Calendar } from 'lucide-react';
import { Supplier, Medicine, CreatePurchaseOrderRequest } from '@/types';
import { suppliersAPI } from '@/api/suppliers';
import { purchaseOrdersAPI } from '@/api/purchaseOrders';

interface CreatePurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplier?: Supplier;
}

interface OrderItem {
  medicine_id: number;
  medicine_name: string;
  quantity: number;
  cost_per_unit: number;
  total_cost: number;
  batch_number: string;
  expiry_date: string;
}

const CreatePurchaseOrderModal: React.FC<CreatePurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  supplier
}) => {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(supplier || null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
      if (supplier) {
        setSelectedSupplier(supplier);
        loadSupplierMedicines(supplier.supplier_id);
      }
    }
  }, [isOpen, supplier]);

  const loadSuppliers = async () => {
    try {
      const suppliersData = await suppliersAPI.getAllSuppliers();
      setSuppliers(suppliersData);
    } catch (err) {
      setError('Failed to load suppliers');
    }
  };

  const loadSupplierMedicines = async (supplierId: number) => {
    try {
      const medicinesData = await suppliersAPI.getSupplierMedicines(supplierId);
      setMedicines(medicinesData);
    } catch (err) {
      setError('Failed to load medicines');
    }
  };

  const handleSupplierChange = (supplierId: number) => {
    const supplier = suppliers.find(s => s.supplier_id === supplierId);
    setSelectedSupplier(supplier || null);
    if (supplier) {
      loadSupplierMedicines(supplier.supplier_id);
    }
    setOrderItems([]);
  };

  const addOrderItem = (medicine: Medicine) => {
    const existingItem = orderItems.find(item => item.medicine_id === medicine.medicine_id);
    if (existingItem) {
      setOrderItems(prev => prev.map(item =>
        item.medicine_id === medicine.medicine_id
          ? { ...item, quantity: item.quantity + 1, total_cost: (item.quantity + 1) * item.cost_per_unit }
          : item
      ));
    } else {
      const newItem: OrderItem = {
        medicine_id: medicine.medicine_id,
        medicine_name: medicine.medicine_name,
        quantity: 1,
        cost_per_unit: medicine.default_purchase_price || 0,
        total_cost: medicine.default_purchase_price || 0,
        batch_number: '',
        expiry_date: ''
      };
      setOrderItems(prev => [...prev, newItem]);
    }
  };

  const updateOrderItem = (medicineId: number, field: keyof OrderItem, value: any) => {
    setOrderItems(prev => prev.map(item => {
      if (item.medicine_id === medicineId) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'cost_per_unit') {
          updatedItem.total_cost = updatedItem.quantity * updatedItem.cost_per_unit;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const removeOrderItem = (medicineId: number) => {
    setOrderItems(prev => prev.filter(item => item.medicine_id !== medicineId));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total_cost, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || orderItems.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const orderData: CreatePurchaseOrderRequest = {
        supplier_id: selectedSupplier.supplier_id,
        items: orderItems.map(item => ({
          medicine_id: item.medicine_id,
          quantity_purchased: item.quantity,
          cost_per_unit: item.cost_per_unit,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date
        }))
      };

      await purchaseOrdersAPI.createPurchaseOrder(orderData);
      onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content create-purchase-order-modal">
        <div className="modal-header">
          <h3>Create Purchase Order</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="purchase-order-form">
          <div className="form-section">
            <h4>Supplier Selection</h4>
            <div className="form-group">
              <label htmlFor="supplier">Select Supplier *</label>
              <select
                id="supplier"
                value={selectedSupplier?.supplier_id || ''}
                onChange={(e) => handleSupplierChange(Number(e.target.value))}
                required
              >
                <option value="">Choose a supplier...</option>
                {suppliers.map(supplier => (
                  <option key={supplier.supplier_id} value={supplier.supplier_id}>
                    {supplier.supplier_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedSupplier && (
            <div className="form-section">
              <h4>Add Medicines</h4>
              <div className="medicines-grid">
                {medicines.map(medicine => (
                  <div key={medicine.medicine_id} className="medicine-card">
                    <div className="medicine-info">
                      <h5>{medicine.medicine_name}</h5>
                      <p>{medicine.generic_name}</p>
                      <p className="price">₹{medicine.default_purchase_price}</p>
                    </div>
                    <button
                      type="button"
                      className="add-btn"
                      onClick={() => addOrderItem(medicine)}
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {orderItems.length > 0 && (
            <div className="form-section">
              <h4>Order Items</h4>
              <div className="order-items">
                {orderItems.map(item => (
                  <div key={item.medicine_id} className="order-item">
                    <div className="item-info">
                      <h5>{item.medicine_name}</h5>
                      <div className="item-controls">
                        <div className="quantity-control">
                          <button
                            type="button"
                            onClick={() => updateOrderItem(item.medicine_id, 'quantity', Math.max(1, item.quantity - 1))}
                          >
                            <Minus size={14} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateOrderItem(item.medicine_id, 'quantity', item.quantity + 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <div className="cost-control">
                          <label>Cost per unit:</label>
                          <input
                            type="number"
                            value={item.cost_per_unit}
                            onChange={(e) => updateOrderItem(item.medicine_id, 'cost_per_unit', Number(e.target.value))}
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="batch-control">
                          <label>Batch Number:</label>
                          <input
                            type="text"
                            value={item.batch_number}
                            onChange={(e) => updateOrderItem(item.medicine_id, 'batch_number', e.target.value)}
                            placeholder="Enter batch number"
                          />
                        </div>
                        <div className="expiry-control">
                          <label>Expiry Date:</label>
                          <input
                            type="date"
                            value={item.expiry_date}
                            onChange={(e) => updateOrderItem(item.medicine_id, 'expiry_date', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="item-total">
                      <span>Total: ₹{item.total_cost.toLocaleString()}</span>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeOrderItem(item.medicine_id)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="order-total">
                <h4>Total Amount: ₹{calculateTotal().toLocaleString()}</h4>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading || !selectedSupplier || orderItems.length === 0}
            >
              {loading ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePurchaseOrderModal;
