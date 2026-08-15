import { Item, Customer, Supplier, Sale, Receiving, Cashup, Expense, Employee, StoreConfig } from '../types/pos';
import { sound } from './audio';

const STORAGE_KEYS = {
  ITEMS: 'ospos_items',
  CUSTOMERS: 'ospos_customers',
  SUPPLIERS: 'ospos_suppliers',
  SALES: 'ospos_sales',
  RECEIVINGS: 'ospos_receivings',
  CASHUPS: 'ospos_cashups',
  EXPENSES: 'ospos_expenses',
  EMPLOYEES: 'ospos_employees',
  CURRENT_USER: 'ospos_current_user',
  DEVICE_AUTH: 'ospos_device_auth',
  CONFIG: 'ospos_config',
  FIRST_TIME_SETUP: 'ospos_first_time_setup_done',
};

const DEFAULT_CONFIG: StoreConfig = {
  company_name: 'Nexus POS Retail',
  address: '100 Market Street, Suite 400, San Francisco, CA 94105',
  phone: '(415) 555-0199',
  email: 'store@nexuspos.io',
  website: 'https://nexuspos.io',
  currency_symbol: '$',
  default_tax_rate: 8.5,
  receipt_header: 'Welcome to Nexus POS!\nThank you for supporting local business.',
  receipt_footer: 'Return policy: 30 days with receipt.\nHave a wonderful day!',
  barcode_format: 'CODE128',
  enable_sound: true,
  enable_loyalty: true,
  theme: 'light',
  accent_color: 'sky',
  upi_id: 'nexuspos@okhdfcbank',
  upi_payee_name: 'Nexus POS Retail',
  upi_qr_note: 'POS Order Payment',
};

const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 'emp-admin',
    first_name: 'Admin',
    last_name: '',
    username: 'admin',
    role: 'admin',
    pin: '1234',
    email: '',
    phone_number: '',
    is_active: true,
  },
];

const DEFAULT_CUSTOMERS: Customer[] = [];

const DEFAULT_SUPPLIERS: Supplier[] = [];

const DEFAULT_ITEMS: Item[] = [
  {
    id: 'item-chips-1',
    item_number: 'SKU-CHIPS-101',
    name: 'Classic Crispy Potato Chips',
    category: 'Snacks & Packaged',
    cost_price: 1.20,
    unit_price: 2.00,
    quantity: 45,
    reorder_level: 10,
    item_type: 'standard',
    unit_name: 'pack',
    variants: [
      { id: 'var-chips-s', name: 'Small (35g)', item_number: 'SKU-CHIPS-S', cost_price: 0.60, unit_price: 1.00, quantity: 15 },
      { id: 'var-chips-m', name: 'Medium (90g)', item_number: 'SKU-CHIPS-M', cost_price: 1.20, unit_price: 2.00, quantity: 20 },
      { id: 'var-chips-l', name: 'Party Pack (200g)', item_number: 'SKU-CHIPS-L', cost_price: 2.30, unit_price: 3.80, quantity: 10 },
    ],
    description: 'Golden fried crispy potato chips with savory seasoning',
  },
  {
    id: 'item-rahul-rice',
    item_number: 'SKU-RICE-202',
    name: 'Rahul Special Royal Basmati Rice',
    category: 'Grocery & Rashan',
    cost_price: 5.50,
    unit_price: 8.50,
    quantity: 30,
    reorder_level: 8,
    item_type: 'standard',
    unit_name: 'pack',
    variants: [
      { id: 'var-rice-1k', name: '1kg Bag', item_number: 'SKU-RICE-1KG', cost_price: 5.50, unit_price: 8.50, quantity: 15 },
      { id: 'var-rice-5k', name: '5kg Family Pack', item_number: 'SKU-RICE-5KG', cost_price: 24.00, unit_price: 38.00, quantity: 15 },
    ],
    description: 'Aromatic extra long grain Basmati rice',
  },
  {
    id: 'item-rashan-sugar',
    item_number: 'SKU-SUGAR-303',
    name: 'Pure White Sugar (Loose Rashan)',
    category: 'Grocery & Rashan',
    cost_price: 0.80,
    unit_price: 1.40,
    quantity: 100,
    reorder_level: 20,
    item_type: 'weighted',
    unit_name: 'kg',
    description: 'Open value weighed loose sugar for retail customers',
  },
  {
    id: 'item-rashan-flour',
    item_number: 'SKU-ATTA-404',
    name: 'Fresh Whole Wheat Atta / Flour',
    category: 'Grocery & Rashan',
    cost_price: 0.65,
    unit_price: 1.10,
    quantity: 150,
    reorder_level: 25,
    item_type: 'weighted',
    unit_name: 'kg',
    description: 'Stone ground whole wheat flour in loose kilograms',
  },
  {
    id: 'item-choc-biscuit',
    item_number: 'SKU-BISC-505',
    name: 'Chocolate Cream Crunch Biscuits',
    category: 'Snacks & Packaged',
    cost_price: 0.90,
    unit_price: 1.75,
    quantity: 50,
    reorder_level: 12,
    item_type: 'standard',
    unit_name: 'pack',
    description: 'Double chocolate layered cream biscuits',
  },
];

const DEFAULT_SALES: Sale[] = [];

const DEFAULT_EXPENSES: Expense[] = [];

const DEFAULT_CASHUPS: Cashup[] = [];

class StorageService {
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  // Items
  public getItems(): Item[] {
    return this.getItem<Item[]>(STORAGE_KEYS.ITEMS, DEFAULT_ITEMS);
  }

  public saveItems(items: Item[]): void {
    this.setItem(STORAGE_KEYS.ITEMS, items);
  }

  public addItem(item: Omit<Item, 'id'>): Item {
    const items = this.getItems();
    const newItem: Item = {
      ...item,
      id: 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    };
    items.unshift(newItem);
    this.saveItems(items);
    return newItem;
  }

  public updateItem(id: string, updates: Partial<Item>): Item | null {
    const items = this.getItems();
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updates };
    this.saveItems(items);
    return items[index];
  }

  public deleteItem(id: string): void {
    const items = this.getItems().filter(i => i.id !== id);
    this.saveItems(items);
  }

  // Customers
  public getCustomers(): Customer[] {
    const raw = this.getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
    return (raw || []).filter(c => c.id !== 'cust-1' && c.id !== 'cust-2' && c.first_name !== 'Rahul' && c.first_name !== 'Priya');
  }

  public saveCustomers(customers: Customer[]): void {
    this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
  }

  public addCustomer(customer: Omit<Customer, 'id' | 'points' | 'total_spent'>): Customer {
    const customers = this.getCustomers();
    const newCustomer: Customer = {
      ...customer,
      id: 'cust-' + Date.now(),
      points: 0,
      total_spent: 0,
      credit_balance: (customer as any).credit_balance || 0,
      credit_limit: (customer as any).credit_limit || 500,
      credit_ledger: [],
    };
    customers.unshift(newCustomer);
    this.saveCustomers(customers);
    return newCustomer;
  }

  public updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    const customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) return null;
    customers[index] = { ...customers[index], ...updates };
    this.saveCustomers(customers);
    return customers[index];
  }

  public recordCustomerCreditPayment(
    customerId: string,
    amount: number,
    paymentMethod: string = 'Cash',
    note: string = 'Payment towards credit balance',
    employeeName: string = 'Staff'
  ): Customer | null {
    const customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === customerId);
    if (index === -1) return null;

    const cust = customers[index];
    const currentBalance = cust.credit_balance || 0;
    const newBalance = Math.max(0, currentBalance - amount);

    const ledgerEntry = {
      id: 'cld-' + Date.now(),
      date: new Date().toISOString(),
      type: 'payment_received' as const,
      amount,
      balance_after: newBalance,
      note,
      payment_method: paymentMethod,
      recorded_by: employeeName,
    };

    cust.credit_balance = newBalance;
    cust.credit_ledger = [ledgerEntry, ...(cust.credit_ledger || [])];
    this.saveCustomers(customers);
    return cust;
  }

  public adjustCustomerCredit(
    customerId: string,
    newBalance: number,
    creditLimit: number,
    note: string = 'Manual balance/limit adjustment',
    employeeName: string = 'Manager'
  ): Customer | null {
    const customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === customerId);
    if (index === -1) return null;

    const cust = customers[index];
    const oldBalance = cust.credit_balance || 0;
    const diff = newBalance - oldBalance;

    const ledgerEntry = {
      id: 'cld-' + Date.now(),
      date: new Date().toISOString(),
      type: 'credit_adjustment' as const,
      amount: Math.abs(diff),
      balance_after: newBalance,
      note: `${note} (${diff >= 0 ? '+' : '-'}${Math.abs(diff).toFixed(2)})`,
      recorded_by: employeeName,
    };

    cust.credit_balance = newBalance;
    cust.credit_limit = creditLimit;
    cust.credit_ledger = [ledgerEntry, ...(cust.credit_ledger || [])];
    this.saveCustomers(customers);
    return cust;
  }

  // Suppliers
  public getSuppliers(): Supplier[] {
    const raw = this.getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, DEFAULT_SUPPLIERS);
    return (raw || []).filter(s => s.id !== 'sup-1' && s.company_name !== 'National Groceries & Grains Ltd');
  }

  public saveSuppliers(suppliers: Supplier[]): void {
    this.setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
  }

  public addSupplier(supplier: Omit<Supplier, 'id'>): Supplier {
    const suppliers = this.getSuppliers();
    const newSupplier: Supplier = {
      ...supplier,
      id: 'supp-' + Date.now(),
    };
    suppliers.unshift(newSupplier);
    this.saveSuppliers(suppliers);
    return newSupplier;
  }

  public updateSupplier(id: string, updates: Partial<Supplier>): Supplier | null {
    const suppliers = this.getSuppliers();
    const index = suppliers.findIndex(s => s.id === id);
    if (index === -1) return null;
    suppliers[index] = { ...suppliers[index], ...updates };
    this.saveSuppliers(suppliers);
    return suppliers[index];
  }

  public deleteSupplier(id: string): void {
    const suppliers = this.getSuppliers().filter(s => s.id !== id);
    this.saveSuppliers(suppliers);
  }

  // Sales
  public getSales(): Sale[] {
    return this.getItem<Sale[]>(STORAGE_KEYS.SALES, DEFAULT_SALES);
  }

  public saveSales(sales: Sale[]): void {
    this.setItem(STORAGE_KEYS.SALES, sales);
  }

  public completeSale(sale: Omit<Sale, 'id' | 'sale_time' | 'status'>): Sale {
    const sales = this.getSales();
    const items = this.getItems();
    
    const newSale: Sale = {
      ...sale,
      id: 'POS-' + new Date().getFullYear() + '-' + String(sales.length + 1).padStart(4, '0'),
      sale_time: new Date().toISOString(),
      status: 'completed',
    };

    // Deduct inventory quantities
    for (const saleItem of sale.items) {
      let itemIdx = items.findIndex(i => i.id === saleItem.item_id);
      if (itemIdx === -1) {
        itemIdx = items.findIndex(i => saleItem.item_id.startsWith(i.id));
      }
      if (itemIdx === -1 && saleItem.variant_id) {
        itemIdx = items.findIndex(i => i.variants && i.variants.some(v => v.id === saleItem.variant_id));
      }
      if (itemIdx === -1 && saleItem.item_number) {
        itemIdx = items.findIndex(i => i.item_number === saleItem.item_number || (i.variants && i.variants.some(v => v.item_number === saleItem.item_number)));
      }

      if (itemIdx !== -1) {
        const currentItem = items[itemIdx];
        if (saleItem.variant_id && currentItem.variants && currentItem.variants.length > 0) {
          const varIdx = currentItem.variants.findIndex(v => v.id === saleItem.variant_id);
          if (varIdx !== -1) {
            currentItem.variants[varIdx].quantity = Math.max(0, (currentItem.variants[varIdx].quantity || 0) - saleItem.quantity);
          }
          currentItem.quantity = currentItem.variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
        } else {
          currentItem.quantity = Math.max(0, currentItem.quantity - saleItem.quantity);
        }
      }
    }
    this.saveItems(items);

    // Update customer spend, loyalty points, and credit balance if attached
    if (sale.customer_id) {
      const config = this.getConfig();
      const isLoyaltyActive = config.enable_loyalty !== false;
      const customers = this.getCustomers();
      const custIdx = customers.findIndex(c => c.id === sale.customer_id);
      if (custIdx !== -1) {
        const cust = customers[custIdx];
        cust.total_spent += sale.total;
        if (isLoyaltyActive) {
          const ratio = config.loyalty_points_ratio && config.loyalty_points_ratio > 0 ? config.loyalty_points_ratio : 1;
          cust.points += Math.floor(sale.total * ratio);
        }

        // Check if any payment was made using 'Customer Credit'
        const creditPayments = (sale.payments || []).filter(p => p.payment_type === 'Customer Credit');
        const creditAmt = creditPayments.reduce((acc, p) => acc + p.payment_amount, 0);

        if (creditAmt > 0) {
          const prevBal = cust.credit_balance || 0;
          const newBal = prevBal + creditAmt;
          cust.credit_balance = newBal;
          const ledgerEntry = {
            id: 'cld-' + Date.now(),
            date: newSale.sale_time,
            type: 'sale_credit' as const,
            amount: creditAmt,
            balance_after: newBal,
            note: `Invoice #${newSale.id} - On Account Store Credit`,
            sale_id: newSale.id,
            recorded_by: newSale.employee_name,
          };
          cust.credit_ledger = [ledgerEntry, ...(cust.credit_ledger || [])];
        }

        this.saveCustomers(customers);
      }
    }

    sales.unshift(newSale);
    this.saveSales(sales);
    return newSale;
  }

  public refundSale(saleId: string): Sale | null {
    const sales = this.getSales();
    const saleIdx = sales.findIndex(s => s.id === saleId);
    if (saleIdx === -1) return null;

    const sale = sales[saleIdx];
    if (sale.status === 'refunded') return sale;

    sale.status = 'refunded';

    // Restore inventory quantities
    const items = this.getItems();
    for (const saleItem of sale.items) {
      let itemIdx = items.findIndex(i => i.id === saleItem.item_id);
      if (itemIdx === -1) {
        itemIdx = items.findIndex(i => saleItem.item_id.startsWith(i.id));
      }
      if (itemIdx === -1 && saleItem.variant_id) {
        itemIdx = items.findIndex(i => i.variants && i.variants.some(v => v.id === saleItem.variant_id));
      }
      if (itemIdx === -1 && saleItem.item_number) {
        itemIdx = items.findIndex(i => i.item_number === saleItem.item_number || (i.variants && i.variants.some(v => v.item_number === saleItem.item_number)));
      }

      if (itemIdx !== -1) {
        const currentItem = items[itemIdx];
        if (saleItem.variant_id && currentItem.variants && currentItem.variants.length > 0) {
          const varIdx = currentItem.variants.findIndex(v => v.id === saleItem.variant_id);
          if (varIdx !== -1) {
            currentItem.variants[varIdx].quantity = (currentItem.variants[varIdx].quantity || 0) + saleItem.quantity;
          }
          currentItem.quantity = currentItem.variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
        } else {
          currentItem.quantity += saleItem.quantity;
        }
      }
    }
    this.saveItems(items);

    this.saveSales(sales);
    return sale;
  }

  // Receivings / Purchase Intake
  public getReceivings(): Receiving[] {
    return this.getItem<Receiving[]>(STORAGE_KEYS.RECEIVINGS, []);
  }

  public addReceiving(rec: Omit<Receiving, 'id' | 'receiving_time'>): Receiving {
    const receivings = this.getReceivings();
    const items = this.getItems();

    const newReceiving: Receiving = {
      ...rec,
      id: 'REC-' + Date.now().toString().slice(-6),
      receiving_time: new Date().toISOString(),
    };

    // Increment inventory stock and update cost price
    for (const rItem of rec.items) {
      let itemIdx = items.findIndex(i => i.id === rItem.item_id);
      if (itemIdx === -1) {
        itemIdx = items.findIndex(i => rItem.item_id.startsWith(i.id));
      }
      if (itemIdx === -1) {
        itemIdx = items.findIndex(i => i.item_number === rItem.item_number || (i.variants && i.variants.some(v => v.item_number === rItem.item_number)));
      }

      if (itemIdx !== -1) {
        const currentItem = items[itemIdx];
        const matchedVariant = currentItem.variants?.find(v => 
          v.id === (rItem as any).variant_id || 
          v.item_number === rItem.item_number ||
          rItem.item_id.includes(v.id)
        );

        if (matchedVariant) {
          matchedVariant.quantity = (matchedVariant.quantity || 0) + rItem.quantity;
          matchedVariant.cost_price = rItem.cost_price;
          currentItem.quantity = currentItem.variants!.reduce((sum, v) => sum + (v.quantity || 0), 0);
        } else {
          currentItem.quantity += rItem.quantity;
          currentItem.cost_price = rItem.cost_price;
        }
      }
    }
    this.saveItems(items);

    receivings.unshift(newReceiving);
    this.setItem(STORAGE_KEYS.RECEIVINGS, receivings);
    return newReceiving;
  }

  // Expenses
  public getExpenses(): Expense[] {
    return this.getItem<Expense[]>(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
  }

  public addExpense(exp: Omit<Expense, 'id'>): Expense {
    const expenses = this.getExpenses();
    const newExpense: Expense = {
      ...exp,
      id: 'exp-' + Date.now(),
    };
    expenses.unshift(newExpense);
    this.setItem(STORAGE_KEYS.EXPENSES, expenses);
    return newExpense;
  }

  public deleteExpense(id: string): void {
    const expenses = this.getExpenses().filter(e => e.id !== id);
    this.setItem(STORAGE_KEYS.EXPENSES, expenses);
  }

  // Cashups
  public getCashups(): Cashup[] {
    return this.getItem<Cashup[]>(STORAGE_KEYS.CASHUPS, DEFAULT_CASHUPS);
  }

  public saveCashups(cashups: Cashup[]): void {
    this.setItem(STORAGE_KEYS.CASHUPS, cashups);
  }

  public addCashup(cashup: Omit<Cashup, 'id'>): Cashup {
    const cashups = this.getCashups();
    const newCashup: Cashup = {
      ...cashup,
      id: 'CSH-' + Date.now().toString().slice(-6),
    };
    cashups.unshift(newCashup);
    this.saveCashups(cashups);
    return newCashup;
  }

  public updateCashup(id: string, updates: Partial<Cashup>): Cashup | null {
    const cashups = this.getCashups();
    const idx = cashups.findIndex(c => c.id === id);
    if (idx === -1) return null;
    cashups[idx] = { ...cashups[idx], ...updates };
    this.saveCashups(cashups);
    return cashups[idx];
  }

  // Employees & Auth & Device Recognition
  public getEmployees(): Employee[] {
    const raw = this.getItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
    const cleaned = (raw || []).filter(e => 
      e.id !== 'emp-2' && 
      e.id !== 'emp-3' && 
      e.last_name !== 'Connor' && 
      e.last_name !== 'Rivera' &&
      e.username !== 'manager' &&
      e.username !== 'cashier'
    );
    if (cleaned.length === 0) {
      return DEFAULT_EMPLOYEES;
    }
    return cleaned;
  }

  public saveEmployees(employees: Employee[]): void {
    this.setItem(STORAGE_KEYS.EMPLOYEES, employees);
  }

  public getDeviceId(): string {
    let devId = localStorage.getItem('ospos_device_id');
    if (!devId) {
      devId = 'TERM-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem('ospos_device_id', devId);
    }
    return devId;
  }

  public isDeviceRemembered(): boolean {
    const authData = this.getItem<{ isRemembered: boolean; userId?: string } | null>(STORAGE_KEYS.DEVICE_AUTH, null);
    if (authData && authData.isRemembered) {
      return true;
    }
    // Also check if CURRENT_USER exists in localStorage
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER) !== null;
  }

  public setDeviceRemembered(remember: boolean, user?: Employee | null): void {
    const deviceId = this.getDeviceId();
    if (remember && user) {
      this.setItem(STORAGE_KEYS.DEVICE_AUTH, {
        deviceId,
        isRemembered: true,
        userId: user.id,
        userRole: user.role,
        lastActive: new Date().toISOString(),
      });
      this.setItem(STORAGE_KEYS.CURRENT_USER, user);
    } else {
      this.setItem(STORAGE_KEYS.DEVICE_AUTH, {
        deviceId,
        isRemembered: false,
        lastActive: new Date().toISOString(),
      });
      this.setItem(STORAGE_KEYS.CURRENT_USER, null);
    }
  }

  public getRememberedUser(): Employee | null {
    const users = this.getEmployees();
    
    // First check CURRENT_USER key
    const saved = this.getItem<Employee | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (saved) {
      const match = users.find(u => u.id === saved.id && u.is_active !== false);
      if (match) return match;
    }

    // Next check DEVICE_AUTH key
    const devAuth = this.getItem<{ isRemembered: boolean; userId?: string } | null>(STORAGE_KEYS.DEVICE_AUTH, null);
    if (devAuth && devAuth.isRemembered && devAuth.userId) {
      const match = users.find(u => u.id === devAuth.userId && u.is_active !== false);
      if (match) {
        this.setItem(STORAGE_KEYS.CURRENT_USER, match);
        return match;
      }
    }

    // Default: If device is marked as remembered, fallback to first active admin/manager
    if (devAuth && devAuth.isRemembered) {
      const defaultUser = users.find(u => u.role === 'admin' && u.is_active !== false) || users[0];
      if (defaultUser) {
        this.setItem(STORAGE_KEYS.CURRENT_USER, defaultUser);
        return defaultUser;
      }
    }

    return null;
  }

  public getCurrentUser(): Employee | null {
    const users = this.getEmployees();
    const saved = this.getItem<Employee | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (saved) {
      const match = users.find(u => u.id === saved.id && u.is_active !== false);
      if (match) return match;
    }
    return this.getRememberedUser();
  }

  public setCurrentUser(user: Employee | null): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
    if (user) {
      // Auto-update device auth
      this.setDeviceRemembered(true, user);
    }
  }

  public forgetDevice(): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER, null);
    this.setItem(STORAGE_KEYS.DEVICE_AUTH, {
      deviceId: this.getDeviceId(),
      isRemembered: false,
      lastActive: new Date().toISOString(),
    });
  }

  public isFirstTimeSetup(): boolean {
    // If flag is explicitly set to true, return false
    const setupDone = localStorage.getItem(STORAGE_KEYS.FIRST_TIME_SETUP);
    if (setupDone === 'true') {
      return false;
    }
    // If not set yet, it is the first time
    return true;
  }

  public markFirstTimeSetupComplete(): void {
    localStorage.setItem(STORAGE_KEYS.FIRST_TIME_SETUP, 'true');
  }

  public resetFirstTimeSetup(): void {
    localStorage.removeItem(STORAGE_KEYS.FIRST_TIME_SETUP);
  }

  public hasStaff(): boolean {
    const employees = this.getEmployees();
    return employees.some(e => e.role !== 'admin' && e.is_active !== false);
  }

  public getStaffCount(): number {
    const employees = this.getEmployees();
    return employees.filter(e => e.role !== 'admin' && e.is_active !== false).length;
  }

  public deleteAllStaff(): Employee[] {
    const employees = this.getEmployees();
    // Keep only active admin accounts (or at least the primary admin)
    let admins = employees.filter(e => e.role === 'admin');
    if (admins.length === 0) {
      admins = [
        {
          id: 'emp-admin-owner',
          first_name: 'Store',
          last_name: 'Owner',
          username: 'admin',
          role: 'admin',
          pin: '1234',
          email: 'owner@nexuspos.io',
          phone_number: '555-0100',
          is_active: true,
        }
      ];
    }
    this.saveEmployees(admins);
    return admins;
  }

  public deleteEmployee(id: string): boolean {
    const employees = this.getEmployees();
    const updated = employees.filter(e => e.id !== id);
    
    // Ensure at least one admin exists if all were deleted
    if (updated.length === 0 || !updated.some(e => e.role === 'admin')) {
      const fallbackAdmin: Employee = {
        id: 'emp-admin-owner',
        first_name: 'Store',
        last_name: 'Owner',
        username: 'admin',
        role: 'admin',
        pin: '1234',
        email: 'owner@nexuspos.io',
        phone_number: '555-0100',
        is_active: true,
      };
      if (updated.length === 0) {
        updated.push(fallbackAdmin);
      } else {
        updated[0].role = 'admin';
      }
    }

    this.saveEmployees(updated);
    const curr = this.getItem<Employee | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (curr && curr.id === id) {
      this.forgetDevice();
    }
    return true;
  }

  // Store Configuration
  public getConfig(): StoreConfig {
    const config = this.getItem<StoreConfig>(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
    const merged = { ...DEFAULT_CONFIG, ...config };
    sound.setEnabled(merged.enable_sound ?? true);
    return merged;
  }

  public saveConfig(config: StoreConfig): void {
    this.setItem(STORAGE_KEYS.CONFIG, config);
    sound.setEnabled(config.enable_sound ?? true);
  }

  // Backup & Reset
  public exportAllData(): string {
    const data = {
      config: this.getConfig(),
      employees: this.getEmployees(),
      items: this.getItems(),
      customers: this.getCustomers(),
      suppliers: this.getSuppliers(),
      sales: this.getSales(),
      receivings: this.getReceivings(),
      cashups: this.getCashups(),
      expenses: this.getExpenses(),
      exportedAt: new Date().toISOString(),
      version: '3.4.0',
    };
    return JSON.stringify(data, null, 2);
  }

  public importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.items) this.saveItems(data.items);
      if (data.customers) this.saveCustomers(data.customers);
      if (data.suppliers) this.saveSuppliers(data.suppliers);
      if (data.sales) this.saveSales(data.sales);
      if (data.config) this.saveConfig(data.config);
      if (data.employees) this.saveEmployees(data.employees);
      if (data.expenses) this.setItem(STORAGE_KEYS.EXPENSES, data.expenses);
      if (data.receivings) this.setItem(STORAGE_KEYS.RECEIVINGS, data.receivings);
      if (data.cashups) this.saveCashups(data.cashups);
      return true;
    } catch {
      return false;
    }
  }

  public clearAllStoreData(): void {
    this.saveItems([]);
    this.saveCustomers([]);
    this.saveSuppliers([]);
    this.saveSales([]);
    this.setItem(STORAGE_KEYS.RECEIVINGS, []);
    this.setItem(STORAGE_KEYS.EXPENSES, []);
    this.saveCashups([]);
  }

  public resetDemoData(): void {
    this.clearAllStoreData();
    localStorage.removeItem(STORAGE_KEYS.FIRST_TIME_SETUP);
  }
}

export const storage = new StorageService();
