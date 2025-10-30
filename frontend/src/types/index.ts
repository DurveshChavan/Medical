/* ========================================
   TYPE DEFINITIONS
   ======================================== */

export interface Medicine {
  id: number;
  name: string;
  category: string;
  stock: number;
  price: number;
  seasonal_demand?: string;
  recommended_stock?: number;
  reorder_point?: number;
}

export interface SalesData {
  date: string;
  sales: number;
  revenue: number;
  transactions: number;
}

export interface KPIMetric {
  label: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: string;
  color?: string;
}

export interface SeasonalAnalysis {
  season: 'Summer' | 'Monsoon' | 'Winter' | 'All Season';
  medicines: Medicine[];
  demand_score: number;
  recommendations: string[];
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface InventoryItem extends Medicine {
  last_restocked?: string;
  expiry_date?: string;
  supplier?: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface DashboardStats {
  total_revenue: number;
  total_sales: number;
  total_medicines: number;
  low_stock_items: number;
  revenue_change?: number;
  sales_change?: number;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  records_processed?: number;
}

export type Season = 'Summer' | 'Monsoon' | 'Winter' | 'All Season';

export type ThemeMode = 'light' | 'dark';

export interface User {
  name: string;
  email: string;
  role: string;
}

// ========================================
// BILLING & POS TYPES
// ========================================

export interface MedicineWithStock {
  medicine_id: number;
  medicine_name: string;
  generic_name: string;
  brand: string;
  category: string;
  dosage_form: string;
  strength: string;
  prescription_required: boolean;
  total_stock: number;
  avg_selling_price: number;
  nearest_expiry?: string;
}

export interface CartItem {
  medicine_id: number;
  medicine_name: string;
  generic_name: string;
  brand: string;
  dosage_form: string;
  strength: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

export interface InvoiceCreateRequest {
  customer_id?: number;
  payment_method: 'Cash' | 'Card' | 'UPI' | 'Credit';
  payment_status: 'Paid' | 'Pending';
  outstanding_credit?: number;
  cart_items: CartItem[];
  totals?: InvoiceTotals;
}

export interface Invoice {
  invoice_id: number;
  sale_date: string;
  total_amount: number;
  total_gst: number;
  payment_method: string;
  payment_status: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  sale_id: number;
  medicine_name: string;
  dosage_form: string;
  strength: string;
  quantity_sold: number;
  unit_price: number;
  total_amount: number;
}

export interface InvoiceDetails {
  invoice_id: number;
  sale_date: string;
  total_amount: number;
  total_gst: number;
  payment_method: string;
  payment_status: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  items: InvoiceItem[];
}

export interface PendingInvoice {
  invoice_id: number;
  sale_date: string;
  total_amount: number;
  payment_method: string;
  customer_name: string;
  item_count: number;
}

export interface InvoiceTotals {
  subtotal: number;
  gst_percentage: number;
  gst_amount: number;
  total: number;
}

// ========================================
// CUSTOMER TYPES
// ========================================

export interface Customer {
  customer_id: number;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city?: string;
  state?: string;
  zip_code?: string;
  date_of_birth?: string;
  gender?: string;
  is_active_customer: boolean;
  outstanding_credit: number;
  payment_status: string;
  created_at: string;
  updated_at?: string;
}

export interface CustomerStats {
  total_purchases: number;
  total_spent: number;
  average_order_value: number;
  last_purchase_date: string;
  outstanding_credit: number;
  total_returns: number;
}

export interface CustomerUpdateRequest {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  date_of_birth?: string;
  gender?: string;
}

export interface CreditPaymentRequest {
  amount_paid: number;
  payment_method: string;
}

export interface CreditSummary {
  total_outstanding: number;
  overdue_amount: number;
  last_payment_date?: string;
  payment_history: CreditTransaction[];
}

export interface CreditTransaction {
  transaction_id: number;
  amount: number;
  payment_method: string;
  transaction_date: string;
  description: string;
}

export interface CustomerCreateRequest {
  name: string;
  phone: string;
  email?: string;
  address: string;
  city?: string;
  state?: string;
  zip_code?: string;
  date_of_birth?: string;
  gender?: string;
}

export interface CreditPaymentRequest {
  amount_paid: number;
  payment_method: string;
}

export interface CreditSummary {
  customer_name: string;
  outstanding_credit: number;
  payment_status: string;
  customer_since: string;
  recent_transactions: CreditTransaction[];
}

export interface CreditTransaction {
  type: 'Sale' | 'Return';
  reference_id: string;
  date: string;
  amount: number;
  payment_method: string;
}

// ========================================
// RETURN & REFUND TYPES
// ========================================

export interface ReturnableItem {
  sale_id: number;
  medicine_id: number;
  medicine_name: string;
  dosage_form: string;
  strength: string;
  quantity_sold: number;
  unit_price: number;
  total_amount: number;
  already_returned: number;
  available_for_return: number;
}

export interface InvoiceWithItems {
  invoice_id: number;
  sale_date: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  items: ReturnableItem[];
}

export interface ReturnRequest {
  sale_id: number;
  customer_id?: number;
  medicine_id: number;
  quantity_returned: number;
  reason_for_return: string;
  refund_amount: number;
  refund_method: string;
}

export interface Return {
  return_id: number;
  sale_id: number;
  return_date: string;
  quantity_returned: number;
  reason_for_return: string;
  refund_amount: number;
  payment_method: string;
  refund_date: string;
  medicine_name: string;
  dosage_form: string;
  strength: string;
  customer_name: string;
  customer_phone?: string;
  invoice_id: number;
}

export interface Refund {
  refund_id: number;
  return_id: number;
  customer_id?: number;
  payment_method: string;
  refund_amount: number;
  refund_date: string;
  approved_by: string;
  refund_reason: string;
}

// ========================================
// API RESPONSE TYPES
// ========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  count: number;
  page: number;
  total_pages: number;
}

// ========================================
// SUPPLIER TYPES
// ========================================

export interface Supplier {
  supplier_id: number;
  supplier_name: string;
  contact_person_name: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  gstin?: string;
  pan_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface SupplierStats {
  total_purchases: number;
  total_spent: number;
  average_order_value: number;
  last_purchase_date: string;
  total_medicines_supplied: number;
  delivery_performance_score: number;
}

export interface SuppliedMedicine {
  medicine_id: number;
  medicine_name: string;
  generic_name: string;
  brand: string;
  category: string;
  quantity_in_stock: number;
  default_purchase_price: number;
  gst_percentage: number;
}

// ========================================
// MANUFACTURER TYPES
// ========================================

export interface Manufacturer {
  manufacturer_id: number;
  manufacturer_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ManufacturerStats {
  total_medicines_produced: number;
  active_medicines_count: number;
  total_inventory_value: number;
  medicines_by_category: Record<string, number>;
}

export interface ManufacturerMedicine {
  medicine_id: number;
  medicine_name: string;
  generic_name: string;
  brand: string;
  dosage_form: string;
  strength: string;
  category: string;
  prescription_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ManufacturerInventory {
  inventory_id: number;
  medicine_id: number;
  medicine_name: string;
  generic_name: string;
  brand: string;
  category: string;
  batch_number: string;
  expiry_date: string;
  quantity_in_stock: number;
  purchase_price_per_unit: number;
  selling_price_per_unit: number;
  reorder_level: number;
  last_restocked_date: string;
  supplier_name: string;
}

// ========================================
// PURCHASE ORDER TYPES
// ========================================

export interface PurchaseOrder {
  purchase_invoice_id: number;
  supplier_id: number;
  supplier_name?: string;
  invoice_number: string;
  purchase_date: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  updated_at?: string;
  item_count?: number;
}

export interface PurchaseOrderItem {
  purchase_item_id: number;
  purchase_invoice_id: number;
  medicine_id: number;
  medicine_name: string;
  generic_name: string;
  brand: string;
  category: string;
  supplier_id: number;
  batch_number: string;
  expiry_date: string;
  quantity_purchased: number;
  cost_per_unit: number;
  total_cost: number;
  created_at: string;
}

export interface PurchaseOrderDetails extends PurchaseOrder {
  items: PurchaseOrderItem[];
}

export interface CreatePurchaseOrderRequest {
  supplier_id: number;
  items: {
    medicine_id: number;
    quantity_purchased: number;
    cost_per_unit: number;
    total_cost: number;
    batch_number?: string;
    expiry_date?: string;
  }[];
  total_amount: number;
}

