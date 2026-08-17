import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  setDoc, 
  deleteDoc,
  collection, 
  getDocs, 
  onSnapshot, 
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Item, Customer, Supplier, Sale, Receiving, Expense, Cashup, StoreConfig, UserAccount } from '../types/pos';

// Initialize Firebase App & Firestore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Optional connection tester
export async function testConnection(): Promise<boolean> {
  try {
    if (auth.currentUser) {
      await getDocFromServer(doc(db, 'users', auth.currentUser.uid));
    }
    return true;
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const errorCode = error?.code || '';
    if (
      errorCode === 'unavailable' ||
      errorMsg.includes('client is offline') ||
      errorMsg.includes('unavailable') ||
      errorMsg.includes('backend')
    ) {
      console.info("Nexus POS: Local-first offline mode active.");
    }
    return false;
  }
}

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function loginWithGoogle(): Promise<UserAccount> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const userAccount: UserAccount = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Manager',
      photoURL: user.photoURL,
      role: 'admin'
    };

    // Save/Update user profile document in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      userId: user.uid,
      email: user.email || '',
      displayName: userAccount.displayName,
      photoURL: user.photoURL || '',
      role: 'admin',
      lastLoginAt: new Date().toISOString()
    }, { merge: true });

    return userAccount;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

// Store Document Root for Multi-device Cloud Sync
function getStoreId(user: User | null): string {
  if (!user) return 'default_store';
  return `store_${user.uid.replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

// Push local full state to Firestore Cloud
export async function pushLocalDataToCloud(
  user: User,
  data: {
    items: Item[];
    customers: Customer[];
    suppliers: Supplier[];
    sales: Sale[];
    receivings: Receiving[];
    expenses: Expense[];
    cashups: Cashup[];
    config: StoreConfig;
  }
): Promise<{ success: boolean; count: number }> {
  const storeId = getStoreId(user);
  const path = `stores/${storeId}`;

  try {
    // 1. Ensure Store Document exists
    const storeDocRef = doc(db, 'stores', storeId);
    await setDoc(storeDocRef, {
      storeId,
      ownerId: user.uid,
      company_name: data.config.company_name || 'Nexus POS Retail',
      address: data.config.address || '',
      currency_symbol: data.config.currency_symbol || '₹',
      tax_rate_percent: data.config.default_tax_rate || 0,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // 2. Batch write items and clean up deleted ones
    let writeCount = 0;
    const batch = writeBatch(db);

    const localItemIds = new Set(data.items.map(i => i.id));
    try {
      const existingItemsSnap = await getDocs(collection(db, 'stores', storeId, 'items'));
      existingItemsSnap.forEach(snap => {
        if (!localItemIds.has(snap.id)) {
          batch.delete(snap.ref);
          writeCount++;
        }
      });
    } catch (e) {
      console.warn('Could not query existing items for purge:', e);
    }

    data.items.slice(0, 450).forEach(item => {
      const itemRef = doc(db, 'stores', storeId, 'items', item.id);
      batch.set(itemRef, {
        item_id: item.id,
        storeId,
        name: item.name,
        category: item.category || 'General',
        cost_price: item.cost_price || 0,
        unit_price: item.unit_price || 0,
        quantity: item.quantity || 0,
        barcode: item.item_number || '',
        item_number: item.item_number || '',
        reorder_level: item.reorder_level || 5,
        description: item.description || '',
        item_type: item.item_type || 'standard',
        unit_name: item.unit_name || (item.item_type === 'weighted' ? 'kg' : 'unit'),
        variants: item.variants || [],
        is_deleted: Boolean(item.is_deleted),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      writeCount++;
    });

    // Batch customers and clean up deleted ones
    const localCustomerIds = new Set(data.customers.map(c => c.id));
    try {
      const existingCustSnap = await getDocs(collection(db, 'stores', storeId, 'customers'));
      existingCustSnap.forEach(snap => {
        if (!localCustomerIds.has(snap.id)) {
          batch.delete(snap.ref);
          writeCount++;
        }
      });
    } catch (e) {
      console.warn('Could not query existing customers for purge:', e);
    }

    data.customers.slice(0, 100).forEach(c => {
      const custRef = doc(db, 'stores', storeId, 'customers', c.id);
      batch.set(custRef, {
        customer_id: c.id,
        storeId,
        first_name: c.first_name,
        last_name: c.last_name || '',
        email: c.email || '',
        phone_number: c.phone_number || '',
        points: c.points || 0,
        balance: c.total_spent || 0,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      writeCount++;
    });

    // Batch suppliers
    data.suppliers.slice(0, 50).forEach(s => {
      const supRef = doc(db, 'stores', storeId, 'suppliers', s.id);
      batch.set(supRef, {
        supplier_id: s.id,
        storeId,
        company_name: s.company_name,
        first_name: s.first_name || '',
        email: s.email || '',
        phone_number: s.phone_number || '',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      writeCount++;
    });

    // Batch recent sales
    data.sales.slice(-50).forEach(sale => {
      const saleRef = doc(db, 'stores', storeId, 'sales', sale.id);
      batch.set(saleRef, {
        sale_id: sale.id,
        storeId,
        sale_time: sale.sale_time,
        customer_name: sale.customer_name || 'Walk-in Customer',
        subtotal: sale.subtotal,
        tax: sale.tax_total,
        total: sale.total,
        status: sale.status === 'suspended' ? 'held' : 'completed',
        comment: sale.comment || ''
      }, { merge: true });
      writeCount++;
    });

    await batch.commit();
    return { success: true, count: writeCount };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Pull cloud data into local state
export async function pullCloudData(user: User): Promise<{
  items?: Item[];
  customers?: Customer[];
  suppliers?: Supplier[];
  sales?: Sale[];
}> {
  const storeId = getStoreId(user);
  const path = `stores/${storeId}`;

  try {
    const itemsSnapshot = await getDocs(collection(db, 'stores', storeId, 'items'));
    const remoteItems: Item[] = [];
    itemsSnapshot.forEach(docSnap => {
      const d = docSnap.data();
      remoteItems.push({
        id: docSnap.id,
        item_number: d.barcode || d.item_number || '',
        name: d.name || '',
        category: d.category || 'General',
        cost_price: Number(d.cost_price) || 0,
        unit_price: Number(d.unit_price) || 0,
        quantity: Number(d.quantity) || 0,
        reorder_level: Number(d.reorder_level) || 5,
        description: d.description || '',
        item_type: d.item_type || 'standard',
        unit_name: d.unit_name || (d.item_type === 'weighted' ? 'kg' : 'unit'),
        variants: Array.isArray(d.variants) ? d.variants : [],
        is_deleted: Boolean(d.is_deleted),
      });
    });

    const custSnapshot = await getDocs(collection(db, 'stores', storeId, 'customers'));
    const remoteCustomers: Customer[] = [];
    custSnapshot.forEach(docSnap => {
      const d = docSnap.data();
      remoteCustomers.push({
        id: docSnap.id,
        first_name: d.first_name,
        last_name: d.last_name || '',
        email: d.email || '',
        phone_number: d.phone_number || '',
        address_1: '',
        city: '',
        points: d.points || 0,
        total_spent: d.balance || 0
      });
    });

    return {
      items: remoteItems.length > 0 ? remoteItems : undefined,
      customers: remoteCustomers.length > 0 ? remoteCustomers : undefined
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Setup real-time cloud listeners
export function subscribeToCloudStore(
  user: User,
  onItemsUpdate: (items: Item[]) => void,
  onCustomersUpdate: (customers: Customer[]) => void,
  onError: (err: string) => void
): Unsubscribe {
  const storeId = getStoreId(user);

  const unsubItems = onSnapshot(
    collection(db, 'stores', storeId, 'items'),
    (snapshot) => {
      const cloudItems: Item[] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        if (!d.is_deleted) {
          cloudItems.push({
            id: docSnap.id,
            item_number: d.barcode || d.item_number || '',
            name: d.name || '',
            category: d.category || 'General',
            cost_price: Number(d.cost_price) || 0,
            unit_price: Number(d.unit_price) || 0,
            quantity: Number(d.quantity) || 0,
            reorder_level: Number(d.reorder_level) || 5,
            description: d.description || '',
            item_type: d.item_type || 'standard',
            unit_name: d.unit_name || (d.item_type === 'weighted' ? 'kg' : 'unit'),
            variants: Array.isArray(d.variants) ? d.variants : [],
            is_deleted: false,
          });
        }
      });
      onItemsUpdate(cloudItems);
    },
    (error) => {
      console.warn('Realtime items listener error:', error);
      onError(error.message);
    }
  );

  const unsubCustomers = onSnapshot(
    collection(db, 'stores', storeId, 'customers'),
    (snapshot) => {
      const cloudCustomers: Customer[] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        cloudCustomers.push({
          id: docSnap.id,
          first_name: d.first_name || '',
          last_name: d.last_name || '',
          email: d.email || '',
          phone_number: d.phone_number || d.phone || '',
          address_1: d.address_1 || d.address || '',
          city: d.city || '',
          points: d.points || 0,
          total_spent: d.total_spent || d.balance || 0
        });
      });
      onCustomersUpdate(cloudCustomers);
    },
    (error) => {
      console.warn('Realtime customers listener error:', error);
      onError(error.message);
    }
  );

  return () => {
    unsubItems();
    unsubCustomers();
  };
}

// Delete item document from Firestore
export async function deleteCloudItem(user: User, itemId: string): Promise<void> {
  const storeId = getStoreId(user);
  const path = `stores/${storeId}/items/${itemId}`;
  try {
    const itemRef = doc(db, 'stores', storeId, 'items', itemId);
    await deleteDoc(itemRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Delete customer document from Firestore
export async function deleteCloudCustomer(user: User, customerId: string): Promise<void> {
  const storeId = getStoreId(user);
  const path = `stores/${storeId}/customers/${customerId}`;
  try {
    const custRef = doc(db, 'stores', storeId, 'customers', customerId);
    await deleteDoc(custRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Delete supplier document from Firestore
export async function deleteCloudSupplier(user: User, supplierId: string): Promise<void> {
  const storeId = getStoreId(user);
  const path = `stores/${storeId}/suppliers/${supplierId}`;
  try {
    const supRef = doc(db, 'stores', storeId, 'suppliers', supplierId);
    await deleteDoc(supRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Delete expense document from Firestore
export async function deleteCloudExpense(user: User, expenseId: string): Promise<void> {
  const storeId = getStoreId(user);
  const path = `stores/${storeId}/expenses/${expenseId}`;
  try {
    const expRef = doc(db, 'stores', storeId, 'expenses', expenseId);
    await deleteDoc(expRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
