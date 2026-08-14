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
  theme: 'light',
  accent_color: 'sky',
  upi_id: 'nexuspos@okhdfcbank',
  upi_payee_name: 'Nexus POS Retail',
  upi_qr_note: 'POS Order Payment',
};

const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    first_name: 'Admin',
    last_name: 'User',
    username: 'admin',
    role: 'admin',
    pin: '1234',
    email: 'admin@opensourcepos.org',
    phone_number: '555-0101',
    is_active: true,
  },
  {
    id: 'emp-2',
    first_name: 'Sarah',
    last_name: 'Connor',
    username: 'manager',
    role: 'manager',
    pin: '5678',
    email: 'sarah@opensourcepos.org',
    phone_number: '555-0102',
    is_active: true,
  },
  {
    id: 'emp-3',
    first_name: 'Alex',
    last_name: 'Rivera',
    username: 'cashier',
    role: 'cashier',
    pin: '0000',
    email: 'alex@opensourcepos.org',
    phone_number: '555-0103',
    is_active: true,
  },
];

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    first_name: 'Eleanor',
    last_name: 'Vance',
    email: 'eleanor.vance@example.com',
    phone_number: '555-234-5678',
    address_1: '742 Evergreen Terrace',
    city: 'Springfield',
    company_name: 'Vance Design Studio',
    account_number: 'ACC-8821',
    points: 120,
    total_spent: 485.50,
    credit_balance: 145.00,
    credit_limit: 500.00,
    credit_ledger: [
      {
        id: 'cld-1',
        date: new Date(Date.now() - 86400000 * 6).toISOString(),
        type: 'sale_credit',
        amount: 220.00,
        balance_after: 220.00,
        note: 'Invoice #POS-2026-0004 On Account Purchase',
        recorded_by: 'Admin User',
      },
      {
        id: 'cld-2',
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        type: 'payment_received',
        amount: 75.00,
        balance_after: 145.00,
        note: 'UPI Payment received against balance',
        payment_method: 'UPI / QR Code',
        recorded_by: 'Sarah Connor',
      }
    ],
    comments: 'VIP customer, monthly account statement via WhatsApp',
  },
  {
    id: 'cust-2',
    first_name: 'Marcus',
    last_name: 'Brody',
    email: 'marcus.brody@example.com',
    phone_number: '555-876-5432',
    address_1: '221B Baker Street',
    city: 'Seattle',
    company_name: 'Pacific Arts',
    account_number: 'ACC-9012',
    points: 45,
    total_spent: 190.20,
    credit_balance: 0.00,
    credit_limit: 300.00,
    credit_ledger: [],
    comments: 'Tax-exempt non-profit purchases',
  },
  {
    id: 'cust-3',
    first_name: 'Claire',
    last_name: 'Redfield',
    email: 'claire.r@example.com',
    phone_number: '555-432-1098',
    address_1: '456 Raccoon Way',
    city: 'Portland',
    points: 85,
    total_spent: 312.00,
    credit_balance: 68.50,
    credit_limit: 250.00,
    credit_ledger: [
      {
        id: 'cld-3',
        date: new Date(Date.now() - 86400000 * 3).toISOString(),
        type: 'sale_credit',
        amount: 68.50,
        balance_after: 68.50,
        note: 'Invoice #POS-2026-0008 Store Credit Purchase',
        recorded_by: 'Alex Rivera',
      }
    ],
  },
];

const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: 'supp-1',
    company_name: 'Global Beverage Wholesale',
    agency_name: 'Beverage Direct LLC',
    first_name: 'David',
    last_name: 'Kowalski',
    email: 'orders@globalbeverage.com',
    phone_number: '800-555-2244',
    address_1: '1200 Logistics Blvd',
    city: 'Oakland',
    account_number: 'SUP-GBW-001',
  },
  {
    id: 'supp-2',
    company_name: 'Artisan Roasters Supply Co.',
    agency_name: 'Specialty Coffee Network',
    first_name: 'Maria',
    last_name: 'Santos',
    email: 'maria@artisanroasters.com',
    phone_number: '888-555-9988',
    address_1: '45 Industrial Pkwy',
    city: 'San Francisco',
    account_number: 'SUP-ARS-002',
  },
  {
    id: 'supp-3',
    company_name: 'Metro Bakery Distributors',
    first_name: 'Paul',
    last_name: 'Boulanger',
    email: 'paul@metrobakery.com',
    phone_number: '877-555-1122',
    address_1: '890 Baker St',
    city: 'San Jose',
    account_number: 'SUP-MBD-003',
  },
];

const DEFAULT_ITEMS: Item[] = [
  {
    id: 'item-101',
    item_number: '10001',
    name: 'Artisan Espresso Blend 12oz',
    category: 'Coffee & Tea',
    cost_price: 6.50,
    unit_price: 14.99,
    quantity: 48,
    reorder_level: 15,
    description: 'Fresh whole bean organic roast coffee',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'item-102',
    item_number: '10002',
    name: 'Caramel Macchiato (Large)',
    category: 'Prepared Drinks',
    cost_price: 1.20,
    unit_price: 5.75,
    quantity: 150,
    reorder_level: 25,
    description: 'Handcrafted espresso with steamed milk and vanilla caramel',
  },
  {
    id: 'item-103',
    item_number: '10003',
    name: 'Matcha Green Tea Latte',
    category: 'Prepared Drinks',
    cost_price: 1.40,
    unit_price: 5.25,
    quantity: 85,
    reorder_level: 20,
    description: 'Ceremonial grade Uji matcha with oat milk',
  },
  {
    id: 'item-104',
    item_number: '10004',
    name: 'Butter Croissant Fresh Baked',
    category: 'Bakery',
    cost_price: 0.95,
    unit_price: 3.85,
    quantity: 24,
    reorder_level: 10,
    description: 'Flaky 100% French butter pastry',
  },
  {
    id: 'item-105',
    item_number: '10005',
    name: 'Organic Blueberry Muffin',
    category: 'Bakery',
    cost_price: 1.10,
    unit_price: 4.10,
    quantity: 18,
    reorder_level: 12,
    description: 'Loaded with wild organic Maine blueberries',
  },
  {
    id: 'item-106',
    item_number: '10006',
    name: 'Insulated Travel Tumbler 16oz',
    category: 'Merchandise',
    cost_price: 9.00,
    unit_price: 24.50,
    quantity: 32,
    reorder_level: 8,
    description: 'Double-wall stainless steel vacuum insulated',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'item-107',
    item_number: '10007',
    name: 'Sparkling Mineral Water 500ml',
    category: 'Beverages',
    cost_price: 0.70,
    unit_price: 2.50,
    quantity: 6, // Low stock on purpose
    reorder_level: 15,
    description: 'Crisp natural sparkling mountain water',
  },
  {
    id: 'item-108',
    item_number: '10008',
    name: 'Dark Chocolate Sea Salt Bar 85g',
    category: 'Snacks',
    cost_price: 1.50,
    unit_price: 4.50,
    quantity: 42,
    reorder_level: 15,
    description: '72% single-origin cacao with fleur de sel',
  },
  {
    id: 'item-109',
    item_number: '10009',
    name: 'Gourmet Avocado Toast',
    category: 'Food',
    cost_price: 2.80,
    unit_price: 8.95,
    quantity: 50,
    reorder_level: 10,
    description: 'Toasted sourdough with crushed avocado, radish and chili flakes',
  },
  {
    id: 'item-110',
    item_number: '10010',
    name: 'Pour-Over Glass Carafe 800ml',
    category: 'Merchandise',
    cost_price: 12.50,
    unit_price: 29.99,
    quantity: 3, // Low stock on purpose
    reorder_level: 5,
    description: 'Borosilicate heat-resistant coffee dripper server',
  },
];

const DEFAULT_SALES: Sale[] = [
  {
    id: 'POS-2026-001',
    sale_time: new Date(Date.now() - 3600000 * 4).toISOString(),
    customer_id: 'cust-1',
    customer_name: 'Eleanor Vance',
    employee_id: 'emp-1',
    employee_name: 'Admin User',
    items: [
      {
        item_id: 'item-101',
        item_number: '10001',
        name: 'Artisan Espresso Blend 12oz',
        category: 'Coffee & Tea',
        cost_price: 6.50,
        unit_price: 14.99,
        quantity: 2,
        discount_percent: 0,
        tax_percent: 8.5,
        total: 29.98,
      },
      {
        item_id: 'item-104',
        item_number: '10004',
        name: 'Butter Croissant Fresh Baked',
        category: 'Bakery',
        cost_price: 0.95,
        unit_price: 3.85,
        quantity: 2,
        discount_percent: 0,
        tax_percent: 8.5,
        total: 7.70,
      }
    ],
    subtotal: 37.68,
    tax_total: 3.20,
    discount_total: 0,
    total: 40.88,
    payments: [
      { payment_type: 'UPI / QR Code', payment_amount: 40.88, transaction_ref: 'UPI893420183' }
    ],
    change_due: 0,
    status: 'completed',
  },
  {
    id: 'POS-2026-002',
    sale_time: new Date(Date.now() - 3600000 * 2).toISOString(),
    customer_name: 'Walk-in Customer',
    employee_id: 'emp-3',
    employee_name: 'Alex Rivera',
    items: [
      {
        item_id: 'item-102',
        item_number: '10002',
        name: 'Caramel Macchiato (Large)',
        category: 'Prepared Drinks',
        cost_price: 1.20,
        unit_price: 5.75,
        quantity: 1,
        discount_percent: 0,
        tax_percent: 8.5,
        total: 5.75,
      },
      {
        item_id: 'item-105',
        item_number: '10005',
        name: 'Organic Blueberry Muffin',
        category: 'Bakery',
        cost_price: 1.10,
        unit_price: 4.10,
        quantity: 1,
        discount_percent: 0,
        tax_percent: 8.5,
        total: 4.10,
      }
    ],
    subtotal: 9.85,
    tax_total: 0.84,
    discount_total: 0,
    total: 10.69,
    payments: [
      { payment_type: 'Cash', payment_amount: 20.00 }
    ],
    change_due: 9.31,
    status: 'completed',
  }
];

const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
    amount: 85.00,
    category: 'Store Supplies',
    description: 'Receipt rolls and paper bags packaging',
    employee_name: 'Admin User',
    recipient: 'Office Depot',
  },
  {
    id: 'exp-2',
    date: new Date(Date.now() - 86400000 * 5).toISOString().slice(0, 10),
    amount: 140.00,
    category: 'Maintenance',
    description: 'Espresso machine water filter replacement & calibration',
    employee_name: 'Sarah Connor',
    recipient: 'Espresso Tech Pro',
  },
];

const DEFAULT_CASHUPS: Cashup[] = [
  {
    id: 'cashup-001',
    open_time: new Date(Date.now() - 86400000).toISOString(),
    close_time: new Date(Date.now() - 86400000 + 3600000 * 9).toISOString(),
    open_employee_id: 'emp-1',
    open_employee_name: 'Admin User',
    close_employee_id: 'emp-1',
    close_employee_name: 'Admin User',
    opening_amount: 200.00,
    cash_sales: 345.50,
    cash_in: 0,
    cash_out: 0,
    counted_cash: 545.50,
    difference: 0,
    notes: 'Register balanced perfectly at close.',
    status: 'closed',
  }
];

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
    return this.getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
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
    return this.getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, DEFAULT_SUPPLIERS);
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
      const itemIdx = items.findIndex(i => i.id === saleItem.item_id);
      if (itemIdx !== -1) {
        items[itemIdx].quantity = Math.max(0, items[itemIdx].quantity - saleItem.quantity);
      }
    }
    this.saveItems(items);

    // Update customer spend, loyalty points, and credit balance if attached
    if (sale.customer_id) {
      const customers = this.getCustomers();
      const custIdx = customers.findIndex(c => c.id === sale.customer_id);
      if (custIdx !== -1) {
        const cust = customers[custIdx];
        cust.total_spent += sale.total;
        cust.points += Math.floor(sale.total);

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
    for (const item of sale.items) {
      const itemIdx = items.findIndex(i => i.id === item.item_id);
      if (itemIdx !== -1) {
        items[itemIdx].quantity += item.quantity;
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
      const itemIdx = items.findIndex(i => i.id === rItem.item_id);
      if (itemIdx !== -1) {
        items[itemIdx].quantity += rItem.quantity;
        items[itemIdx].cost_price = rItem.cost_price;
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
    return this.getItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
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

  public deleteEmployee(id: string): boolean {
    const employees = this.getEmployees();
    const updated = employees.filter(e => e.id !== id);
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

  public resetDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.ITEMS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.SUPPLIERS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.RECEIVINGS);
    localStorage.removeItem(STORAGE_KEYS.CASHUPS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
  }
}

export const storage = new StorageService();
