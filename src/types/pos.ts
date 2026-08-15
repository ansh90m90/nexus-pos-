export type ItemType = 'standard' | 'weighted' | 'open_price';

export interface ItemVariant {
  id: string;
  name: string; // e.g. "Large", "Small", "500g Pack", "1kg Box", "Red", "XL"
  item_number: string; // Variant barcode/SKU
  cost_price: number;
  unit_price: number;
  quantity: number;
}

export interface Item {
  id: string;
  item_number: string; // Barcode / SKU
  name: string;
  category: string;
  cost_price: number;
  unit_price: number;
  quantity: number;
  reorder_level: number;
  item_type?: ItemType; // 'standard' | 'weighted' (rashan/loose in grams/kg) | 'open_price'
  unit_name?: string; // 'unit', 'kg', 'g', 'ltr', 'ml', 'pack', 'meter', etc.
  variants?: ItemVariant[];
  tax_category_id?: string;
  description?: string;
  image?: string;
  is_deleted?: boolean;
}

export interface CreditLedgerEntry {
  id: string;
  date: string;
  type: 'sale_credit' | 'payment_received' | 'credit_adjustment';
  amount: number;
  balance_after: number;
  note?: string;
  sale_id?: string;
  payment_method?: string;
  recorded_by?: string;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address_1: string;
  city: string;
  company_name?: string;
  account_number?: string;
  points: number;
  total_spent: number;
  credit_balance?: number; // Outstanding balance owed to store
  credit_limit?: number;   // Maximum allowed credit
  credit_ledger?: CreditLedgerEntry[];
  comments?: string;
}

export interface Supplier {
  id: string;
  company_name: string;
  agency_name?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address_1: string;
  city: string;
  account_number: string;
}

export interface SaleItem {
  item_id: string;
  item_number: string;
  name: string;
  category: string;
  cost_price: number;
  unit_price: number;
  quantity: number;
  discount_percent: number;
  tax_percent: number;
  total: number;
  variant_id?: string;
  variant_name?: string;
  unit_name?: string;
  item_type?: ItemType;
  weight_in_grams?: number;
  target_price_requested?: number;
}

export type PaymentType = 'Cash' | 'UPI / QR Code' | 'Check' | 'Gift Card' | 'Customer Credit';

export interface Payment {
  payment_type: PaymentType;
  payment_amount: number;
  transaction_ref?: string;
}

export interface Sale {
  id: string;
  sale_time: string;
  customer_id?: string;
  customer_name?: string;
  employee_id: string;
  employee_name: string;
  items: SaleItem[];
  subtotal: number;
  tax_total: number;
  discount_total: number;
  total: number;
  payments: Payment[];
  change_due: number;
  comment?: string;
  suspended?: boolean;
  status: 'completed' | 'suspended' | 'refunded';
}

export interface ReceivingItem {
  item_id: string;
  item_number: string;
  name: string;
  cost_price: number;
  quantity: number;
  total: number;
}

export interface Receiving {
  id: string;
  receiving_time: string;
  supplier_id?: string;
  supplier_name?: string;
  employee_id: string;
  employee_name: string;
  items: ReceivingItem[];
  total: number;
  payment_type: string;
  comment?: string;
}

export interface Cashup {
  id: string;
  open_time: string;
  close_time?: string;
  open_employee_id: string;
  open_employee_name: string;
  close_employee_id?: string;
  close_employee_name?: string;
  opening_amount: number;
  cash_sales: number;
  cash_in: number;
  cash_out: number;
  counted_cash: number;
  difference: number;
  notes?: string;
  status: 'open' | 'closed';
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  employee_name: string;
  recipient?: string;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  role: 'admin' | 'manager' | 'cashier';
  pin: string;
  email: string;
  phone_number: string;
  is_active: boolean;
}

export interface StoreConfig {
  company_name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  currency_symbol: string;
  default_tax_rate: number;
  receipt_header: string;
  receipt_footer: string;
  barcode_format: 'CODE128' | 'EAN13' | 'UPC';
  enable_sound: boolean;
  enable_loyalty?: boolean;
  loyalty_points_ratio?: number;
  theme: 'light' | 'dark';
  accent_color?: 'sky' | 'emerald' | 'indigo' | 'amber' | 'slate';
  upi_id?: string;
  upi_payee_name?: string;
  upi_qr_note?: string;
}

export interface UserAccount {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  storeId?: string;
  role?: 'admin' | 'manager' | 'cashier';
}

export type SyncState = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

export interface CloudSyncState {
  isCloudEnabled: boolean;
  syncState: SyncState;
  lastSyncedAt: string | null;
  pendingChangesCount: number;
  syncError: string | null;
}

