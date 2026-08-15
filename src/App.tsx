import React, { useState, useEffect, useCallback } from 'react';
import { Header, NavTab } from './components/Header';
import { POSRegister } from './components/POSRegister';
import { ItemsManager } from './components/ItemsManager';
import { ReceivingsManager } from './components/ReceivingsManager';
import { CustomersManager } from './components/CustomersManager';
import { SuppliersManager } from './components/SuppliersManager';
import { ExpensesManager } from './components/ExpensesManager';
import { CashupsManager } from './components/CashupsManager';
import { ReportsDashboard } from './components/ReportsDashboard';
import { EmployeesManager } from './components/EmployeesManager';
import { SettingsManager } from './components/SettingsManager';
import { ReceiptModal } from './components/ReceiptModal';
import { BarcodeLabelModal } from './components/BarcodeLabelModal';
import { LoginModal } from './components/LoginModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { AuthGateway } from './components/AuthGateway';
import { RoleOverrideModal } from './components/RoleOverrideModal';

import { storage } from './services/storage';
import { 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  pushLocalDataToCloud, 
  pullCloudData, 
  subscribeToCloudStore 
} from './services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  Item, 
  Customer, 
  Supplier, 
  Sale, 
  Receiving, 
  Cashup, 
  Expense, 
  Employee, 
  StoreConfig, 
  SaleItem, 
  SyncState, 
  UserAccount 
} from './types/pos';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('register');

  // Application Data States
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [receivings, setReceivings] = useState<Receiving[]>([]);
  const [cashups, setCashups] = useState<Cashup[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [isFirstTime, setIsFirstTime] = useState<boolean>(() => storage.isFirstTimeSetup());

  // Cloud Sync & Account States
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);

  // Held Sales in session
  const [heldSales, setHeldSales] = useState<{ id: string; time: string; customerName?: string; customerId?: string; items: SaleItem[]; total: number }[]>([]);

  // Modals
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);
  const [barcodePrintItems, setBarcodePrintItems] = useState<Item[] | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Load all initial data from storage
  const loadData = useCallback(() => {
    // Check if localStorage contains old demo items and purge them to keep clean store
    const existingRawItems = localStorage.getItem('ospos_items');
    if (existingRawItems && (
      existingRawItems.includes('item-chips') ||
      existingRawItems.includes('item-rahul') ||
      existingRawItems.includes('item-rashan') ||
      existingRawItems.includes('item-choc') ||
      existingRawItems.includes('item-101') ||
      existingRawItems.includes('item-102') ||
      existingRawItems.includes('Classic Crispy Potato Chips') ||
      existingRawItems.includes('Rahul Special Royal Basmati Rice') ||
      existingRawItems.includes('Pure White Sugar') ||
      existingRawItems.includes('Fresh Whole Wheat Atta') ||
      existingRawItems.includes('Chocolate Cream Crunch Biscuits') ||
      existingRawItems.includes('Artisan Espresso Blend')
    )) {
      const cleanItems = storage.getItems();
      storage.saveItems(cleanItems);
    }
    const existingRawCust = localStorage.getItem('ospos_customers');
    if (existingRawCust && (existingRawCust.includes('cust-1') || existingRawCust.includes('Eleanor') || existingRawCust.includes('Rahul') || existingRawCust.includes('Priya'))) {
      storage.saveCustomers([]);
    }

    // Check if localStorage contains old demo employees and purge them
    const existingRawEmployees = localStorage.getItem('ospos_employees');
    if (existingRawEmployees && (
      existingRawEmployees.includes('Connor') || 
      existingRawEmployees.includes('Rivera') || 
      existingRawEmployees.includes('"username":"manager"') || 
      existingRawEmployees.includes('"username":"cashier"') ||
      existingRawEmployees.includes('emp-2') || 
      existingRawEmployees.includes('emp-3')
    )) {
      const cleanEmps = storage.getEmployees();
      storage.saveEmployees(cleanEmps);
    }
    const loadedItems = storage.getItems();
    const loadedCustomers = storage.getCustomers();
    const loadedSuppliers = storage.getSuppliers();
    const loadedSales = storage.getSales();
    const loadedReceivings = storage.getReceivings();
    const loadedCashups = storage.getCashups();
    const loadedExpenses = storage.getExpenses();
    const loadedEmployees = storage.getEmployees();
    const loadedUser = storage.getCurrentUser();
    const loadedConfig = storage.getConfig();

    setItems(loadedItems);
    setCustomers(loadedCustomers);
    setSuppliers(loadedSuppliers);
    setSales(loadedSales);
    setReceivings(loadedReceivings);
    setCashups(loadedCashups);
    setExpenses(loadedExpenses);
    setEmployees(loadedEmployees);
    setCurrentUser(loadedUser);
    setConfig(loadedConfig);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        setUserAccount({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Manager',
          photoURL: user.photoURL,
          role: 'admin'
        });
        setSyncState('synced');
        setLastSyncedAt(new Date().toISOString());
      } else {
        setUserAccount(null);
        setSyncState('idle');
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Cloud Firestore snapshot subscription
  useEffect(() => {
    if (!firebaseUser || !autoSyncEnabled) return;

    const unsubscribe = subscribeToCloudStore(
      firebaseUser,
      (cloudItems) => {
        if (cloudItems.length > 0) {
          // Merge items safely preserving variants and metadata
          const currentLocalItems = storage.getItems();
          const merged = cloudItems.map(cItem => {
            const local = currentLocalItems.find(l => l.id === cItem.id);
            if (local) {
              return {
                ...local,
                ...cItem,
                variants: (cItem.variants && cItem.variants.length > 0) ? cItem.variants : (local.variants || []),
                item_type: cItem.item_type || local.item_type || 'standard',
                unit_name: cItem.unit_name || local.unit_name || 'unit',
              };
            }
            return cItem;
          });
          currentLocalItems.forEach(localItem => {
            if (!merged.some(m => m.id === localItem.id)) {
              merged.push(localItem);
            }
          });
          storage.saveItems(merged);
          setItems(merged);
          setLastSyncedAt(new Date().toISOString());
          setSyncState('synced');
        }
      },
      (cloudCustomers) => {
        if (cloudCustomers.length > 0) {
          storage.saveCustomers(cloudCustomers);
          setCustomers(cloudCustomers);
          setLastSyncedAt(new Date().toISOString());
        }
      },
      (err) => {
        setSyncError(err);
        setSyncState('error');
      }
    );

    return () => {
      unsubscribe();
    };
  }, [firebaseUser, autoSyncEnabled]);

  // Cloud Sync Actions
  const handleLoginGoogle = async () => {
    setSyncState('syncing');
    setSyncError(null);
    try {
      const account = await loginWithGoogle();
      setUserAccount(account);
      setSyncState('synced');
      setLastSyncedAt(new Date().toISOString());
    } catch (err: any) {
      setSyncError(err?.message || 'Login failed');
      setSyncState('error');
      throw err;
    }
  };

  const handleLogoutGoogle = async () => {
    try {
      await logoutUser();
      setFirebaseUser(null);
      setUserAccount(null);
      setSyncState('idle');
    } catch (err: any) {
      setSyncError(err?.message || 'Logout failed');
      throw err;
    }
  };

  const handlePushToCloud = async () => {
    if (!firebaseUser || !config) return;
    setSyncState('syncing');
    setSyncError(null);
    try {
      await pushLocalDataToCloud(firebaseUser, {
        items,
        customers,
        suppliers,
        sales,
        receivings,
        expenses,
        cashups,
        config
      });
      setSyncState('synced');
      setLastSyncedAt(new Date().toISOString());
    } catch (err: any) {
      setSyncError(err?.message || 'Failed to push to cloud');
      setSyncState('error');
      throw err;
    }
  };

  const handlePullFromCloud = async () => {
    if (!firebaseUser) return;
    setSyncState('syncing');
    setSyncError(null);
    try {
      const remoteData = await pullCloudData(firebaseUser);
      if (remoteData.items && remoteData.items.length > 0) {
        storage.saveItems(remoteData.items);
        setItems(remoteData.items);
      }
      if (remoteData.customers && remoteData.customers.length > 0) {
        storage.saveCustomers(remoteData.customers);
        setCustomers(remoteData.customers);
      }
      setSyncState('synced');
      setLastSyncedAt(new Date().toISOString());
    } catch (err: any) {
      setSyncError(err?.message || 'Failed to pull cloud data');
      setSyncState('error');
      throw err;
    }
  };

  const handleFullSync = async () => {
    await handlePushToCloud();
    await handlePullFromCloud();
  };

  // Synchronize dark mode class to HTML element
  useEffect(() => {
    if (config?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [config?.theme]);

  const handleToggleTheme = () => {
    if (!config) return;
    const nextTheme: 'light' | 'dark' = config.theme === 'dark' ? 'light' : 'dark';
    const updatedConfig = { ...config, theme: nextTheme };
    handleSaveConfig(updatedConfig);
  };

  // Operations
  const handleCompleteSale = (saleData: Omit<Sale, 'id' | 'sale_time' | 'status'>): Sale => {
    const completed = storage.completeSale(saleData);
    const updatedSales = storage.getSales();
    const updatedItems = storage.getItems();
    const updatedCustomers = storage.getCustomers();

    setSales(updatedSales);
    setItems(updatedItems);
    setCustomers(updatedCustomers);

    // Auto push sale to cloud if connected
    if (firebaseUser && autoSyncEnabled && config) {
      pushLocalDataToCloud(firebaseUser, {
        items: updatedItems,
        customers: updatedCustomers,
        suppliers,
        sales: updatedSales,
        receivings,
        expenses,
        cashups,
        config
      }).catch(err => console.warn('Background sync sale failed:', err));
    }

    return completed;
  };

  const handleRefundSale = (saleId: string) => {
    storage.refundSale(saleId);
    setSales(storage.getSales());
    setItems(storage.getItems());
  };

  const handleAddItem = (itemData: Omit<Item, 'id'>) => {
    const newItem = storage.addItem(itemData);
    const updatedItems = storage.getItems();
    setItems(updatedItems);

    if (firebaseUser && autoSyncEnabled && config) {
      pushLocalDataToCloud(firebaseUser, {
        items: updatedItems,
        customers,
        suppliers,
        sales,
        receivings,
        expenses,
        cashups,
        config
      }).catch(err => console.warn('Background sync item failed:', err));
    }

    return newItem;
  };

  const handleUpdateItem = (id: string, updates: Partial<Item>) => {
    storage.updateItem(id, updates);
    const updatedItems = storage.getItems();
    setItems(updatedItems);

    if (firebaseUser && autoSyncEnabled && config) {
      pushLocalDataToCloud(firebaseUser, {
        items: updatedItems,
        customers,
        suppliers,
        sales,
        receivings,
        expenses,
        cashups,
        config
      }).catch(err => console.warn('Background sync item failed:', err));
    }
  };

  const handleDeleteItem = (id: string) => {
    storage.deleteItem(id);
    const updatedItems = storage.getItems();
    setItems(updatedItems);

    if (firebaseUser && autoSyncEnabled && config) {
      pushLocalDataToCloud(firebaseUser, {
        items: updatedItems,
        customers,
        suppliers,
        sales,
        receivings,
        expenses,
        cashups,
        config
      }).catch(err => console.warn('Background sync item delete failed:', err));
    }
  };

  const handleAddCustomer = (custData: Omit<Customer, 'id' | 'points' | 'total_spent'>) => {
    const newCust = storage.addCustomer(custData);
    setCustomers(storage.getCustomers());
    return newCust;
  };

  const handleUpdateCustomer = (id: string, updates: Partial<Customer>) => {
    storage.updateCustomer(id, updates);
    setCustomers(storage.getCustomers());
  };

  const handleAddSupplier = (suppData: Omit<Supplier, 'id'>) => {
    const newSupp = storage.addSupplier(suppData);
    setSuppliers(storage.getSuppliers());
    return newSupp;
  };

  const handleUpdateSupplier = (id: string, updates: Partial<Supplier>) => {
    storage.updateSupplier(id, updates);
    setSuppliers(storage.getSuppliers());
  };

  const handleDeleteSupplier = (id: string) => {
    storage.deleteSupplier(id);
    setSuppliers(storage.getSuppliers());
  };

  const handleAddReceiving = (recData: Omit<Receiving, 'id' | 'receiving_time'>) => {
    const newRec = storage.addReceiving(recData);
    setReceivings(storage.getReceivings());
    setItems(storage.getItems());
    return newRec;
  };

  const handleAddExpense = (expData: Omit<Expense, 'id'>) => {
    const newExp = storage.addExpense(expData);
    setExpenses(storage.getExpenses());
    return newExp;
  };

  const handleDeleteExpense = (id: string) => {
    storage.deleteExpense(id);
    setExpenses(storage.getExpenses());
  };

  const handleAddCashup = (cashupData: Omit<Cashup, 'id'>) => {
    const newCashup = storage.addCashup(cashupData);
    setCashups(storage.getCashups());
    return newCashup;
  };

  const handleUpdateCashup = (id: string, updates: Partial<Cashup>) => {
    storage.updateCashup(id, updates);
    setCashups(storage.getCashups());
  };

  // Role Override authorization prompt state
  const [overrideModal, setOverrideModal] = useState<{
    isOpen: boolean;
    requiredRole: 'manager' | 'admin';
    targetTab: NavTab;
    actionName: string;
  }>({
    isOpen: false,
    requiredRole: 'manager',
    targetTab: 'register',
    actionName: '',
  });

  const handleSelectTab = (tab: NavTab) => {
    if (!currentUser) return;

    // Admin has full unconstrained access to everything
    if (currentUser.role === 'admin') {
      setCurrentTab(tab);
      return;
    }

    // Manager role restrictions
    if (currentUser.role === 'manager') {
      if (tab === 'employees' || tab === 'settings') {
        setOverrideModal({
          isOpen: true,
          requiredRole: 'admin',
          targetTab: tab,
          actionName: tab === 'employees' ? 'Staff & Role Management' : 'Store Settings',
        });
        return;
      }
      setCurrentTab(tab);
      return;
    }

    // Cashier role restrictions
    const cashierAllowed: NavTab[] = ['register', 'inventory', 'customers'];
    if (!cashierAllowed.includes(tab)) {
      const roleReq = (tab === 'employees' || tab === 'settings') ? 'admin' : 'manager';
      const label = 
        tab === 'reports' ? 'Sales Analytics & Reports' :
        tab === 'receivings' ? 'Inventory Purchase Intake' :
        tab === 'cashups' ? 'Daily Cashup Reconciliations' :
        tab === 'expenses' ? 'Store Operating Expenses' :
        tab === 'suppliers' ? 'Supplier Directory' :
        tab === 'employees' ? 'Staff & Role Management' : 'Store Configuration Settings';

      setOverrideModal({
        isOpen: true,
        requiredRole: roleReq,
        targetTab: tab,
        actionName: label,
      });
      return;
    }

    setCurrentTab(tab);
  };

  const handleLoginSuccess = (user: Employee) => {
    setCurrentUser(user);
    storage.setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    storage.setCurrentUser(null);
  };

  const handleRegisterStaff = (newEmpData: Omit<Employee, 'id'>): Employee => {
    const newEmp: Employee = {
      ...newEmpData,
      id: 'emp-' + Date.now(),
    };
    const updated = [...employees, newEmp];
    storage.saveEmployees(updated);
    setEmployees(updated);
    return newEmp;
  };

  const handleSaveEmployees = (newEmployees: Employee[]) => {
    storage.saveEmployees(newEmployees);
    setEmployees(newEmployees);
    if (currentUser) {
      const updatedCurrent = newEmployees.find(e => e.id === currentUser.id);
      if (updatedCurrent) {
        setCurrentUser(updatedCurrent);
        storage.setCurrentUser(updatedCurrent);
      } else {
        // If current user was deleted, log out to the gateway
        handleLogout();
      }
    }
  };

  const handleSaveConfig = (newConfig: StoreConfig) => {
    storage.saveConfig(newConfig);
    setConfig(newConfig);
  };

  const handleHoldSale = (cartItems: SaleItem[], customerId?: string, customerName?: string) => {
    const total = cartItems.reduce((acc, i) => acc + i.total, 0);
    const newHeld = {
      id: 'HELD-' + (heldSales.length + 1),
      time: new Date().toISOString(),
      customerId,
      customerName,
      items: cartItems,
      total,
    };
    setHeldSales(prev => [newHeld, ...prev]);
  };

  const handleResumeSale = (heldId: string) => {
    const target = heldSales.find(h => h.id === heldId);
    if (!target) return null;
    setHeldSales(prev => prev.filter(h => h.id !== heldId));
    setCurrentTab('register');
    return {
      items: target.items,
      customerId: target.customerId,
      customerName: target.customerName,
    };
  };

  const handleDeleteHeldSale = (heldId: string) => {
    setHeldSales(prev => prev.filter(h => h.id !== heldId));
  };

  const handleGoogleLoginFromGateway = async () => {
    setSyncState('syncing');
    setSyncError(null);
    try {
      const account = await loginWithGoogle();
      setUserAccount(account);
      setSyncState('synced');
      setLastSyncedAt(new Date().toISOString());

      // Find or create admin employee for this Google user
      let adminEmp = employees.find(e => e.role === 'admin' && (e.email === account.email || e.username === 'admin'));
      if (!adminEmp) {
        adminEmp = {
          id: 'emp-google-' + (account.uid ? account.uid.substring(0, 8) : Date.now()),
          first_name: account.displayName?.split(' ')[0] || 'Store',
          last_name: account.displayName?.split(' ').slice(1).join(' ') || 'Owner',
          username: account.email ? account.email.split('@')[0].replace(/[^a-z0-9_]/gi, '') : 'owner',
          role: 'admin',
          pin: '1234',
          email: account.email || '',
          phone_number: '',
          is_active: true,
        };
        const updated = [adminEmp, ...employees.filter(e => e.id !== adminEmp?.id)];
        storage.saveEmployees(updated);
        setEmployees(updated);
      } else if (account.displayName) {
        const parts = account.displayName.split(' ');
        adminEmp = {
          ...adminEmp,
          first_name: parts[0] || adminEmp.first_name,
          last_name: parts.slice(1).join(' ') || adminEmp.last_name,
          email: account.email || adminEmp.email,
        };
        const updated = employees.map(e => e.id === adminEmp?.id ? adminEmp! : e);
        storage.saveEmployees(updated);
        setEmployees(updated);
      }

      storage.markFirstTimeSetupComplete();
      setIsFirstTime(false);
      handleLoginSuccess(adminEmp);
    } catch (err: any) {
      setSyncError(err?.message || 'Google Login failed');
      setSyncState('error');
      throw err;
    }
  };

  // If no user is authenticated, render the terminal Auth Gateway
  if (!currentUser) {
    return (
      <AuthGateway
        employees={employees}
        config={config}
        isFirstTime={isFirstTime}
        onLoginSuccess={handleLoginSuccess}
        onRegisterStaff={handleRegisterStaff}
        onGoogleSignIn={handleGoogleLoginFromGateway}
        onCompleteFirstTimeSetup={() => setIsFirstTime(false)}
      />
    );
  }

  if (!config) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span>Starting POS System...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      {/* Navigation Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        currentUser={currentUser}
        onOpenSwitchUser={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        heldSalesCount={heldSales.length}
        onResumeHeld={() => setCurrentTab('register')}
        theme={config.theme}
        onToggleTheme={handleToggleTheme}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        syncState={syncState}
        firebaseUser={firebaseUser}
        onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'register' && (
          <POSRegister
            items={items}
            customers={customers}
            currentUser={currentUser}
            config={config}
            onCompleteSale={handleCompleteSale}
            onAddNewCustomer={handleAddCustomer}
            heldSales={heldSales}
            onHoldSale={handleHoldSale}
            onResumeSale={handleResumeSale}
            onDeleteHeldSale={handleDeleteHeldSale}
            onShowReceipt={sale => setActiveReceiptSale(sale)}
            onOpenSwitchUser={() => setIsLoginModalOpen(true)}
            onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
            onNavigateToInventory={() => setCurrentTab('inventory')}
          />
        )}

        {currentTab === 'inventory' && (
          <ItemsManager
            items={items}
            config={config}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onOpenBarcodeModal={itemsToPrint => setBarcodePrintItems(itemsToPrint)}
          />
        )}

        {currentTab === 'receivings' && (
          <ReceivingsManager
            items={items}
            suppliers={suppliers}
            receivings={receivings}
            currentUser={currentUser}
            config={config}
            onAddReceiving={handleAddReceiving}
          />
        )}

        {currentTab === 'customers' && (
          <CustomersManager
            customers={customers}
            sales={sales}
            config={config}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
          />
        )}

        {currentTab === 'suppliers' && (
          <SuppliersManager
            suppliers={suppliers}
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
          />
        )}

        {currentTab === 'expenses' && (
          <ExpensesManager
            expenses={expenses}
            currentUser={currentUser}
            config={config}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {currentTab === 'cashups' && (
          <CashupsManager
            cashups={cashups}
            sales={sales}
            currentUser={currentUser}
            config={config}
            onAddCashup={handleAddCashup}
            onUpdateCashup={handleUpdateCashup}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsDashboard
            sales={sales}
            config={config}
            onRefundSale={handleRefundSale}
            onShowReceipt={sale => setActiveReceiptSale(sale)}
          />
        )}

        {currentTab === 'employees' && (
          <EmployeesManager
            employees={employees}
            currentUser={currentUser}
            onSaveEmployees={handleSaveEmployees}
            onLogout={handleLogout}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsManager
            config={config}
            onSaveConfig={handleSaveConfig}
            onReloadAllData={loadData}
            onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
          />
        )}
      </main>

      {/* Printable Receipt Modal */}
      {activeReceiptSale && (
        <ReceiptModal
          sale={activeReceiptSale}
          config={config}
          onClose={() => setActiveReceiptSale(null)}
        />
      )}

      {/* Barcode Labels Sheet Modal */}
      {barcodePrintItems && (
        <BarcodeLabelModal
          items={barcodePrintItems}
          config={config}
          onClose={() => setBarcodePrintItems(null)}
        />
      )}

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      {isShortcutsModalOpen && (
        <KeyboardShortcutsModal
          onClose={() => setIsShortcutsModalOpen(false)}
        />
      )}

      {/* Switch Cashier / Lock Modal */}
      {isLoginModalOpen && (
        <LoginModal
          employees={employees}
          currentUser={currentUser}
          onSelectUser={user => {
            setCurrentUser(user);
            storage.setCurrentUser(user);
          }}
          onClose={() => setIsLoginModalOpen(false)}
          onSignOut={handleLogout}
        />
      )}

      {/* Supervisor Role Override Modal */}
      {overrideModal.isOpen && (
        <RoleOverrideModal
          isOpen={overrideModal.isOpen}
          onClose={() => setOverrideModal(prev => ({ ...prev, isOpen: false }))}
          requiredRole={overrideModal.requiredRole}
          actionName={overrideModal.actionName}
          employees={employees}
          onAuthorize={authSuper => {
            setCurrentUser(authSuper);
            storage.setCurrentUser(authSuper);
            setCurrentTab(overrideModal.targetTab);
          }}
        />
      )}

      {/* Cloud Sync & Account Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncModalOpen}
        onClose={() => setIsCloudSyncModalOpen(false)}
        currentUser={firebaseUser}
        userAccount={userAccount}
        syncState={syncState}
        lastSyncedAt={lastSyncedAt}
        syncError={syncError}
        onLogin={handleLoginGoogle}
        onLogout={handleLogoutGoogle}
        onPushToCloud={handlePushToCloud}
        onPullFromCloud={handlePullFromCloud}
        onFullSync={handleFullSync}
        autoSyncEnabled={autoSyncEnabled}
        onToggleAutoSync={setAutoSyncEnabled}
        itemCount={items.length}
        salesCount={sales.length}
        customersCount={customers.length}
      />
    </div>
  );
};
