import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  Barcode, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  DollarSign, 
  PauseCircle, 
  RotateCcw, 
  Check, 
  Percent,
  X,
  UserPlus,
  PlayCircle,
  Gift,
  QrCode,
  Smartphone,
  Copy,
  CheckCheck,
  ShieldCheck,
  ShoppingCart,
  Scale,
  Layers,
  Edit2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Item, Customer, Sale, SaleItem, Payment, StoreConfig, Employee, ItemVariant } from '../types/pos';
import { sound } from '../services/audio';
import { WeighedItemModal } from './WeighedItemModal';
import { VariantSelectModal } from './VariantSelectModal';
import { searchItems } from '../utils/fuzzySearch';

interface POSRegisterProps {
  items: Item[];
  customers: Customer[];
  currentUser: Employee;
  config: StoreConfig;
  onCompleteSale: (sale: Omit<Sale, 'id' | 'sale_time' | 'status'>) => Sale;
  onAddNewCustomer: (cust: Omit<Customer, 'id' | 'points' | 'total_spent'>) => Customer;
  heldSales: { id: string; time: string; customerName?: string; customerId?: string; items: SaleItem[]; total: number }[];
  onHoldSale: (items: SaleItem[], customerId?: string, customerName?: string) => void;
  onResumeSale: (heldId: string) => { items: SaleItem[]; customerId?: string; customerName?: string } | null;
  onDeleteHeldSale: (heldId: string) => void;
  onShowReceipt: (sale: Sale) => void;
  onOpenSwitchUser?: () => void;
  onOpenShortcuts?: () => void;
  onNavigateToInventory?: () => void;
}

export const POSRegister: React.FC<POSRegisterProps> = ({
  items,
  customers,
  currentUser,
  config,
  onCompleteSale,
  onAddNewCustomer,
  heldSales,
  onHoldSale,
  onResumeSale,
  onDeleteHeldSale,
  onShowReceipt,
  onNavigateToInventory,
}) => {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  
  // Overall Order Discount & Points Discount
  const [orderDiscountPercent, setOrderDiscountPercent] = useState<number>(0);
  const [loyaltyDiscountAmount, setLoyaltyDiscountAmount] = useState<number>(0);
  const [redeemedPoints, setRedeemedPoints] = useState<number>(0);

  // Payment Modal State
  const [mobileActiveTab, setMobileActiveTab] = useState<'catalog' | 'cart'>('catalog');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<Payment['payment_type']>('Cash');
  const [tenderAmountInput, setTenderAmountInput] = useState<string>('');
  const [paymentsList, setPaymentsList] = useState<Payment[]>([]);
  const [saleComment, setSaleComment] = useState<string>('');
  const [upiTxnRef, setUpiTxnRef] = useState<string>('');
  const [copiedUpiId, setCopiedUpiId] = useState(false);

  // Modals & UI Toggles
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);
  const [showOrderDiscountModal, setShowOrderDiscountModal] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  // Weighed & Variant Modals
  const [weighedModalItem, setWeighedModalItem] = useState<Item | null>(null);
  const [weighedModalVariant, setWeighedModalVariant] = useState<ItemVariant | undefined>(undefined);
  const [editingCartItemIndex, setEditingCartItemIndex] = useState<number | null>(null);
  const [variantModalItem, setVariantModalItem] = useState<Item | null>(null);
  
  // New Customer inputs
  const [newCustFirst, setNewCustFirst] = useState('');
  const [newCustLast, setNewCustLast] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.category && !i.is_deleted) set.add(i.category);
    });
    return ['All', ...Array.from(set)];
  }, [items]);

  // Filtered items catalog with Smart Phonetic & Typo-Tolerant Search
  const filteredItems = useMemo(() => {
    return searchItems(items, searchQuery, selectedCategory);
  }, [items, selectedCategory, searchQuery]);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Cart Calculations
  const { subtotal, lineDiscountsTotal, taxTotal, grandTotal } = useMemo(() => {
    let sub = 0;
    let lineDisc = 0;
    let tax = 0;

    for (const item of cart) {
      const lineBase = item.unit_price * item.quantity;
      const itemDisc = lineBase * (item.discount_percent / 100);
      const itemTax = (lineBase - itemDisc) * (item.tax_percent / 100);
      
      sub += lineBase;
      lineDisc += itemDisc;
      tax += itemTax;
    }

    // Apply Order Level Discount
    const orderDiscVal = sub * (orderDiscountPercent / 100);
    const totalDiscounts = lineDisc + orderDiscVal + loyaltyDiscountAmount;
    
    // Tax after total discounts
    const taxableAmount = Math.max(0, sub - totalDiscounts);
    const effectiveTax = (taxableAmount * (config.default_tax_rate / 100));
    const total = Math.max(0, taxableAmount + effectiveTax);

    return {
      subtotal: sub,
      lineDiscountsTotal: totalDiscounts,
      taxTotal: effectiveTax,
      grandTotal: total,
    };
  }, [cart, orderDiscountPercent, loyaltyDiscountAmount, config.default_tax_rate]);

  // Hotkeys handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0 && !isPaymentModalOpen) {
          handleOpenPayment();
        }
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) {
          handleHoldCurrent();
        }
      } else if (e.key === 'Escape') {
        if (isPaymentModalOpen) setIsPaymentModalOpen(false);
        if (isHeldModalOpen) setIsHeldModalOpen(false);
        if (isNewCustModalOpen) setIsNewCustModalOpen(false);
        if (showOrderDiscountModal) setShowOrderDiscountModal(false);
        if (weighedModalItem) setWeighedModalItem(null);
        if (variantModalItem) setVariantModalItem(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isPaymentModalOpen, isHeldModalOpen, isNewCustModalOpen, showOrderDiscountModal, weighedModalItem, variantModalItem]);

  // Catalog Item Click Handler
  const handleCatalogItemClick = (item: Item, variant?: ItemVariant) => {
    if (item.item_type === 'weighted') {
      setWeighedModalItem(item);
      setWeighedModalVariant(variant);
      setEditingCartItemIndex(null);
      return;
    }

    if (variant) {
      addItemToCart(item, variant);
      return;
    }

    if (item.variants && item.variants.length > 0) {
      // Open variant picker dialog to choose variant
      setVariantModalItem(item);
      return;
    }

    addItemToCart(item);
  };

  // Standard Item add to Cart
  const addItemToCart = (item: Item, variant?: ItemVariant) => {
    sound.playBeep();
    const itemIdKey = variant ? `${item.id}-var-${variant.id}` : item.id;
    const unitPrice = variant ? variant.unit_price : item.unit_price;
    const costPrice = variant ? (variant.cost_price ?? item.cost_price) : item.cost_price;
    const itemNumber = variant ? (variant.item_number || item.item_number) : item.item_number;

    setCart(prev => {
      const existingIdx = prev.findIndex(i => i.item_id === itemIdKey);
      if (existingIdx > -1) {
        const updated = [...prev];
        const currentQty = updated[existingIdx].quantity;
        const newQty = currentQty + 1;
        const lineBase = updated[existingIdx].unit_price * newQty;
        const lineDiscount = lineBase * (updated[existingIdx].discount_percent / 100);
        const lineTax = (lineBase - lineDiscount) * (updated[existingIdx].tax_percent / 100);
        
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          total: lineBase - lineDiscount + lineTax,
        };
        return updated;
      } else {
        const lineBase = unitPrice * 1;
        const lineTax = lineBase * (config.default_tax_rate / 100);
        const newItem: SaleItem = {
          item_id: itemIdKey,
          item_number: itemNumber,
          name: item.name,
          category: item.category,
          cost_price: costPrice,
          unit_price: unitPrice,
          quantity: 1,
          discount_percent: 0,
          tax_percent: config.default_tax_rate,
          total: lineBase + lineTax,
          variant_id: variant?.id,
          variant_name: variant?.name,
          item_type: 'standard',
        };
        return [newItem, ...prev];
      }
    });
  };

  // Add or Update Weighed (Rashan) Item in Cart
  const handleConfirmWeighedItem = (data: {
    quantity: number;
    weight_in_grams: number;
    target_price_requested?: number;
    unit_price: number;
    variant_id?: string;
    variant_name?: string;
  }) => {
    if (!weighedModalItem) return;
    sound.playBeep();

    const lineBase = data.unit_price * data.quantity;
    const lineTax = lineBase * (config.default_tax_rate / 100);

    if (editingCartItemIndex !== null && editingCartItemIndex >= 0 && editingCartItemIndex < cart.length) {
      // Update existing line
      setCart(prev => {
        const updated = [...prev];
        const existing = updated[editingCartItemIndex];
        const lineDiscount = lineBase * (existing.discount_percent / 100);
        const finalTax = (lineBase - lineDiscount) * (existing.tax_percent / 100);
        
        updated[editingCartItemIndex] = {
          ...existing,
          unit_price: data.unit_price,
          quantity: data.quantity,
          weight_in_grams: data.weight_in_grams,
          target_price_requested: data.target_price_requested,
          total: lineBase - lineDiscount + finalTax,
          variant_id: data.variant_id,
          variant_name: data.variant_name,
        };
        return updated;
      });
    } else {
      // Add new weighed line
      const uniqueLineId = `${weighedModalItem.id}-wt-${Date.now()}`;
      const newSaleItem: SaleItem = {
        item_id: uniqueLineId,
        item_number: weighedModalItem.item_number,
        name: weighedModalItem.name,
        category: weighedModalItem.category,
        cost_price: weighedModalItem.cost_price,
        unit_price: data.unit_price,
        quantity: data.quantity,
        weight_in_grams: data.weight_in_grams,
        target_price_requested: data.target_price_requested,
        discount_percent: 0,
        tax_percent: config.default_tax_rate,
        total: lineBase + lineTax,
        item_type: 'weighted',
        variant_id: data.variant_id,
        variant_name: data.variant_name,
      };
      setCart(prev => [newSaleItem, ...prev]);
    }

    setWeighedModalItem(null);
    setWeighedModalVariant(undefined);
    setEditingCartItemIndex(null);
  };

  // Open Weighed Item Editor from Cart
  const handleEditWeighedCartItem = (saleItem: SaleItem, index: number) => {
    // Find base item
    const baseItem = items.find(i => 
      i.id === saleItem.item_id || 
      saleItem.item_id.startsWith(i.id) || 
      i.item_number === saleItem.item_number ||
      i.name === saleItem.name
    );

    if (baseItem) {
      setWeighedModalItem(baseItem);
      if (saleItem.variant_id && baseItem.variants) {
        setWeighedModalVariant(baseItem.variants.find(v => v.id === saleItem.variant_id));
      } else {
        setWeighedModalVariant(undefined);
      }
      setEditingCartItemIndex(index);
    } else {
      // Create a temporary mock item
      const mockItem: Item = {
        id: saleItem.item_id,
        item_number: saleItem.item_number,
        name: saleItem.name,
        category: saleItem.category,
        cost_price: saleItem.cost_price,
        unit_price: saleItem.unit_price,
        quantity: 100,
        reorder_level: 5,
        item_type: 'weighted',
        unit_name: 'kg',
      };
      setWeighedModalItem(mockItem);
      setEditingCartItemIndex(index);
    }
  };

  // Handle Variant Selection Modal Confirmation
  const handleSelectVariant = (variant: ItemVariant) => {
    if (!variantModalItem) return;
    if (variantModalItem.item_type === 'weighted') {
      const itemToWeigh = variantModalItem;
      setVariantModalItem(null);
      setWeighedModalItem(itemToWeigh);
      setWeighedModalVariant(variant);
      setEditingCartItemIndex(null);
    } else {
      addItemToCart(variantModalItem, variant);
      setVariantModalItem(null);
    }
  };

  const updateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.item_id !== itemId) return item;
      const lineBase = item.unit_price * newQty;
      const lineDiscount = lineBase * (item.discount_percent / 100);
      const lineTax = (lineBase - lineDiscount) * (item.tax_percent / 100);
      return {
        ...item,
        quantity: newQty,
        total: lineBase - lineDiscount + lineTax,
      };
    }));
  };

  const updateDiscount = (itemId: string, discountPercent: number) => {
    const validDiscount = Math.min(100, Math.max(0, discountPercent));
    setCart(prev => prev.map(item => {
      if (item.item_id !== itemId) return item;
      const lineBase = item.unit_price * item.quantity;
      const lineDiscount = lineBase * (validDiscount / 100);
      const lineTax = (lineBase - lineDiscount) * (item.tax_percent / 100);
      return {
        ...item,
        discount_percent: validDiscount,
        total: lineBase - lineDiscount + lineTax,
      };
    }));
  };

  const updatePrice = (itemId: string, newPrice: number) => {
    const validPrice = Math.max(0, newPrice);
    setCart(prev => prev.map(item => {
      if (item.item_id !== itemId) return item;
      const lineBase = validPrice * item.quantity;
      const lineDiscount = lineBase * (item.discount_percent / 100);
      const lineTax = (lineBase - lineDiscount) * (item.tax_percent / 100);
      return {
        ...item,
        unit_price: validPrice,
        total: lineBase - lineDiscount + lineTax,
      };
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.item_id !== itemId));
  };

  const handleCancelClick = () => {
    if (cart.length === 0) return;
    setIsCancelConfirmOpen(true);
  };

  const confirmClearCart = () => {
    setCart([]);
    setSelectedCustomerId('');
    setOrderDiscountPercent(0);
    setLoyaltyDiscountAmount(0);
    setRedeemedPoints(0);
    setIsCancelConfirmOpen(false);
    sound.playBeep();
  };

  // Barcode / Scanner / Quick Lookup submission
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const barcode = barcodeInput.trim();
    if (!barcode) return;

    // 1. Direct match on variant barcode / SKU
    for (const item of items) {
      if (item.is_deleted) continue;
      if (item.variants && item.variants.length > 0) {
        const matchedVar = item.variants.find(v => 
          v.item_number?.toLowerCase() === barcode.toLowerCase() ||
          v.name.toLowerCase() === barcode.toLowerCase()
        );
        if (matchedVar) {
          if (item.item_type === 'weighted') {
            setWeighedModalItem(item);
            setWeighedModalVariant(matchedVar);
            setEditingCartItemIndex(null);
          } else {
            addItemToCart(item, matchedVar);
          }
          setBarcodeInput('');
          return;
        }
      }
    }

    // 2. Direct match on main item barcode or exact name
    const exactMatched = items.find(i => 
      !i.is_deleted && (
        i.item_number.toLowerCase() === barcode.toLowerCase() ||
        i.name.toLowerCase() === barcode.toLowerCase()
      )
    );

    if (exactMatched) {
      handleCatalogItemClick(exactMatched);
      setBarcodeInput('');
      return;
    }

    // 3. Fallback to Smart Typo-Tolerant Search
    const searchResults = searchItems(items, barcode, 'All');
    if (searchResults.length > 0) {
      const topMatch = searchResults[0];
      handleCatalogItemClick(topMatch);
      setBarcodeInput('');
      return;
    }

    alert(`No inventory item found matching barcode, SKU, or name: "${barcode}"`);
  };

  // Hold current cart
  const handleHoldCurrent = () => {
    if (cart.length === 0) return;
    const custName = selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : undefined;
    onHoldSale(cart, selectedCustomerId || undefined, custName);
    setCart([]);
    setSelectedCustomerId('');
    setOrderDiscountPercent(0);
    setLoyaltyDiscountAmount(0);
    setRedeemedPoints(0);
    sound.playBeep();
  };

  const handleResume = (heldId: string) => {
    const data = onResumeSale(heldId);
    if (data) {
      setCart(data.items);
      if (data.customerId) {
        setSelectedCustomerId(data.customerId);
      }
      setIsHeldModalOpen(false);
      sound.playBeep();
    }
  };

  // Customer Loyalty Points Redeem (50 points = $2.50 off)
  const handleRedeemCustomerPoints = () => {
    if (!selectedCustomer || selectedCustomer.points < 50) return;
    const pointsToUse = Math.min(selectedCustomer.points, 200);
    const discountVal = (pointsToUse / 50) * 2.50;
    setRedeemedPoints(pointsToUse);
    setLoyaltyDiscountAmount(discountVal);
    sound.playBeep();
  };

  const handleClearPointsDiscount = () => {
    setRedeemedPoints(0);
    setLoyaltyDiscountAmount(0);
  };

  // Payment Flow Calculations
  const totalPaid = useMemo(() => {
    return paymentsList.reduce((acc, p) => acc + p.payment_amount, 0);
  }, [paymentsList]);

  const remainingBalance = useMemo(() => {
    return Math.max(0, grandTotal - totalPaid);
  }, [grandTotal, totalPaid]);

  const changeDue = useMemo(() => {
    return Math.max(0, totalPaid - grandTotal);
  }, [totalPaid, grandTotal]);

  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setIsPaymentModalOpen(true);
    setPaymentsList([]);
    setPaymentType('Cash');
    setTenderAmountInput(grandTotal.toFixed(2));
    setSaleComment('');
    setUpiTxnRef('');
    setCopiedUpiId(false);
  };

  const handleSelectPaymentType = (type: Payment['payment_type']) => {
    setPaymentType(type);
    if (remainingBalance > 0) {
      setTenderAmountInput(remainingBalance.toFixed(2));
    }
  };

  const handleAddSplitPayment = () => {
    const amt = parseFloat(tenderAmountInput);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid tender amount.');
      return;
    }

    const newPayment: Payment = {
      payment_type: paymentType,
      payment_amount: amt,
      transaction_ref: (paymentType === 'UPI / QR Code' && upiTxnRef) 
        ? upiTxnRef 
        : (paymentType === 'Customer Credit' ? `Cust-${selectedCustomerId || 'WalkIn'}` : undefined),
    };

    setPaymentsList(prev => [...prev, newPayment]);
    sound.playBeep();

    const newRemain = Math.max(0, remainingBalance - amt);
    setTenderAmountInput(newRemain > 0 ? newRemain.toFixed(2) : '0.00');
    setUpiTxnRef('');
  };

  const handleConfirmUpiFullPayment = () => {
    const amtToPay = remainingBalance > 0 ? remainingBalance : grandTotal;
    const newPayment: Payment = {
      payment_type: 'UPI / QR Code',
      payment_amount: amtToPay,
      transaction_ref: upiTxnRef.trim() || `UPI-${Date.now().toString().slice(-6)}`,
    };
    setPaymentsList(prev => [...prev, newPayment]);
    sound.playBeep();
    setTenderAmountInput('0.00');
  };

  const handleRemovePayment = (index: number) => {
    const removed = paymentsList[index];
    setPaymentsList(prev => prev.filter((_, i) => i !== index));
    const newRemain = remainingBalance + (removed ? removed.payment_amount : 0);
    setTenderAmountInput(newRemain.toFixed(2));
  };

  const handleCopyUpiId = () => {
    const upi = config.upi_id || 'nexuspos@okhdfcbank';
    navigator.clipboard.writeText(upi);
    setCopiedUpiId(true);
    setTimeout(() => setCopiedUpiId(false), 2000);
  };

  const handleCompleteCheckout = () => {
    if (totalPaid < grandTotal - 0.001) {
      alert('Tendered amount is less than the grand total due. Please tender remaining balance.');
      return;
    }

    const salePayload = {
      customer_id: selectedCustomerId || undefined,
      customer_name: selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : undefined,
      employee_id: currentUser.id,
      employee_name: `${currentUser.first_name} ${currentUser.last_name}`.trim(),
      items: cart,
      subtotal,
      discount_total: lineDiscountsTotal,
      tax_total: taxTotal,
      total: grandTotal,
      payments: paymentsList.length > 0 ? paymentsList : [{
        payment_type: paymentType,
        payment_amount: grandTotal,
      }],
      change_due: changeDue,
      comment: saleComment || undefined,
    };

    const completed = onCompleteSale(salePayload);
    setIsPaymentModalOpen(false);
    setCart([]);
    setSelectedCustomerId('');
    setOrderDiscountPercent(0);
    setLoyaltyDiscountAmount(0);
    setRedeemedPoints(0);
    sound.playSuccess();
    onShowReceipt(completed);
  };

  // Quick Customer Creation
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustFirst.trim()) return;

    const created = onAddNewCustomer({
      first_name: newCustFirst.trim(),
      last_name: newCustLast.trim(),
      phone_number: newCustPhone.trim(),
      email: newCustEmail.trim(),
      address_1: '',
      city: '',
      credit_limit: 500,
      credit_balance: 0,
    });

    setSelectedCustomerId(created.id);
    setIsNewCustModalOpen(false);
    setNewCustFirst('');
    setNewCustLast('');
    setNewCustPhone('');
    setNewCustEmail('');
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Mobile Tab Navigation */}
      <div className="lg:hidden flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <button
          type="button"
          onClick={() => setMobileActiveTab('catalog')}
          className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            mobileActiveTab === 'catalog'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Catalog ({filteredItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileActiveTab('cart')}
          className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            mobileActiveTab === 'cart'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Cart ({cart.reduce((s, i) => s + i.quantity, 0)}) • {config.currency_symbol}{grandTotal.toFixed(2)}</span>
        </button>
      </div>

      {/* Left Column: Item Catalog & Quick Search */}
      <div className={`flex-1 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden ${
        mobileActiveTab === 'catalog' ? 'flex' : 'hidden lg:flex'
      }`}>
        {/* Top Search & Barcode Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2.5">
          {/* Barcode / SKU input */}
          <form onSubmit={handleBarcodeSubmit} className="flex-1 relative flex items-center">
            <Barcode className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              placeholder="Scan Barcode / SKU (F2) + Enter..."
              className="w-full pl-9 pr-16 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono shadow-2xs"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-2.5 py-1 bg-sky-600 hover:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-md text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              Scan
            </button>
          </form>

          {/* Text Search input */}
          <div className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search items, variants, rashan or category..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="px-3 py-2 bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 overflow-x-auto flex gap-1.5 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-sky-600 dark:bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Item Grid */}
        <div className="flex-1 p-3 overflow-y-auto bg-slate-100/60 dark:bg-slate-950/40">
          {items.length === 0 ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 my-auto">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
                <Barcode className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Store Catalog is Clean</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
                No products are currently registered. Add your store inventory items, rashan loose products, or variants to start ringing up sales.
              </p>
              {onNavigateToInventory && (
                <button
                  type="button"
                  onClick={onNavigateToInventory}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Go to Inventory & Add Products</span>
                </button>
              )}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12 text-center">
              <Search className="w-10 h-10 mb-2 stroke-[1.5] text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No items matching search</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs">
                Try searching with a different SKU, name, or change the category filter
              </p>
              {(searchQuery || selectedCategory !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="mt-3 text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredItems.map(item => {
                const isOutOfStock = item.quantity <= 0;
                const isLowStock = item.quantity > 0 && item.quantity <= item.reorder_level;
                const isWeighted = item.item_type === 'weighted';
                const hasVariants = item.variants && item.variants.length > 0;

                return (
                  <div
                    key={item.id}
                    className="group relative flex flex-col justify-between p-3 bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 rounded-xl text-left transition-all shadow-xs hover:shadow-sm min-h-[175px]"
                  >
                    {/* Header: SKU & Stock Status */}
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-semibold truncate max-w-[90px]">
                          {item.item_number}
                        </span>
                        {isOutOfStock ? (
                          <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[9px] font-bold rounded border border-rose-200 dark:border-rose-900 shrink-0">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[9px] font-bold rounded border border-amber-200 dark:border-amber-900 shrink-0">
                            {item.quantity} left
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
                            {item.quantity} {item.unit_name || 'in stock'}
                          </span>
                        )}
                      </div>

                      {/* Product Name */}
                      <h4 
                        onClick={() => handleCatalogItemClick(item)}
                        className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 leading-snug cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                        title={item.name}
                      >
                        {item.name}
                      </h4>

                      {/* Category & Tags */}
                      <div className="flex items-center gap-1.5 mt-0.5 mb-2">
                        {isWeighted && (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[9px] font-bold border border-amber-200 dark:border-amber-900 shrink-0">
                            <Scale className="w-2.5 h-2.5" />
                            <span>Loose</span>
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    {/* Middle Section: Variants Selector or Price Details */}
                    <div className="my-1">
                      {hasVariants ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-purple-700 dark:text-purple-300">
                            <span className="flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              <span>Options ({item.variants!.length})</span>
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500">
                              {item.variants!.length > 3 ? 'Scroll for more' : 'Tap to add'}
                            </span>
                          </div>

                          {/* Scrollable Variant Pills List (Max 3 visible without scrolling) */}
                          <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                            {item.variants!.map(v => {
                              const isOutOfStock = (v.quantity ?? 0) <= 0;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCatalogItemClick(item, v);
                                  }}
                                  className={`shrink-0 flex flex-col items-start px-2 py-1 rounded-lg text-left transition-all group/var cursor-pointer shadow-2xs active:scale-95 border ${
                                    isOutOfStock
                                      ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                                      : 'bg-purple-50/80 hover:bg-purple-600 dark:bg-purple-950/40 dark:hover:bg-purple-600 text-purple-900 hover:text-white dark:text-purple-200 dark:hover:text-white border-purple-200/80 dark:border-purple-800/80 hover:border-purple-600'
                                  }`}
                                  title={`Add ${item.name} (${v.name}) - ${config.currency_symbol}${v.unit_price.toFixed(2)} [${v.quantity ?? 0} in stock]`}
                                >
                                  <div className="flex items-center justify-between w-full gap-1">
                                    <span className="text-[10px] font-bold leading-tight truncate max-w-[70px]">
                                      {v.name}
                                    </span>
                                    <span className={`text-[9px] font-bold px-1 rounded ${
                                      isOutOfStock
                                        ? 'bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200'
                                        : 'bg-purple-200/80 text-purple-900 dark:bg-purple-900 dark:text-purple-200 group-hover/var:bg-purple-700 group-hover/var:text-white'
                                    }`}>
                                      {v.quantity ?? 0}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono font-extrabold text-purple-700 group-hover/var:text-purple-100 dark:text-purple-300 dark:group-hover/var:text-purple-100">
                                    {config.currency_symbol}{v.unit_price.toFixed(2)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={() => handleCatalogItemClick(item)}
                          className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                        >
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            Standard
                          </span>
                          <span className="text-xs font-black text-sky-700 dark:text-sky-400 font-mono">
                            {config.currency_symbol}{item.unit_price.toFixed(2)}
                            {isWeighted && <span className="text-[10px] font-normal text-slate-500"> /{item.unit_name || 'kg'}</span>}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                        {hasVariants ? (
                          <span className="text-[10px] text-slate-500">
                            From <span className="font-bold text-slate-900 dark:text-white">{config.currency_symbol}{Math.min(...item.variants!.map(v => v.unit_price)).toFixed(2)}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-sky-700 dark:text-sky-400">
                            {config.currency_symbol}{item.unit_price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCatalogItemClick(item)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg transition-colors font-bold flex items-center gap-1 shadow-2xs ${
                          hasVariants
                            ? 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 dark:hover:bg-purple-800/80 text-purple-800 dark:text-purple-200'
                            : 'bg-sky-600 hover:bg-sky-700 text-white'
                        }`}
                      >
                        {isWeighted ? (
                          <>
                            <Scale className="w-3 h-3" />
                            <span>Weigh</span>
                          </>
                        ) : hasVariants ? (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Default</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Register Terminal & Cart */}
      <div className={`w-full lg:w-[420px] xl:w-[480px] flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full overflow-y-auto ${
        mobileActiveTab === 'cart' ? 'flex flex-1' : 'hidden lg:flex'
      }`}>
        {/* Customer Selection Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex-1 flex items-center gap-2">
            <User className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <select
              value={selectedCustomerId}
              onChange={e => {
                setSelectedCustomerId(e.target.value);
                setRedeemedPoints(0);
                setLoyaltyDiscountAmount(0);
              }}
              className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 w-full truncate font-medium shadow-2xs"
            >
              <option value="">Walk-in Customer (Guest)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}{config.enable_loyalty !== false ? ` (${c.points} pts)` : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsNewCustModalOpen(true)}
            className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 rounded-lg border border-slate-300 dark:border-slate-700 text-xs transition-colors shrink-0 shadow-2xs"
            title="Add New Customer"
          >
            <UserPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Customer Banner (Loyalty or Clean Customer Bar) */}
        {selectedCustomer && (
          <div className="bg-sky-50 dark:bg-sky-950/60 px-3 py-2 border-b border-sky-100 dark:border-sky-900/60 flex items-center justify-between text-xs text-sky-900 dark:text-sky-200 shrink-0">
            {config.enable_loyalty !== false ? (
              <div className="flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Loyalty: <b className="font-mono">{selectedCustomer.points} pts</b></span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Customer: <b className="font-semibold">{selectedCustomer.first_name} {selectedCustomer.last_name}</b></span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {config.enable_loyalty !== false && redeemedPoints > 0 ? (
                <div className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                  <span>Applied -{config.currency_symbol}{loyaltyDiscountAmount.toFixed(2)}</span>
                  <button
                    onClick={handleClearPointsDiscount}
                    className="text-rose-600 hover:underline ml-1 text-[10px]"
                  >
                    Remove
                  </button>
                </div>
              ) : config.enable_loyalty !== false && selectedCustomer.points >= 50 ? (
                <button
                  onClick={handleRedeemCustomerPoints}
                  className="px-2 py-0.5 bg-sky-600 hover:bg-sky-700 text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Redeem (50 pts = {config.currency_symbol}2.50)
                </button>
              ) : null}

              <button 
                onClick={() => {
                  setSelectedCustomerId('');
                  handleClearPointsDiscount();
                }}
                className="text-slate-400 hover:text-rose-600 text-xs font-semibold cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50 dark:bg-slate-950/40">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12">
              <Barcode className="w-12 h-12 mb-3 stroke-[1.2] text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Register is empty</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center max-w-[240px] mt-1">
                Scan barcode (F2) or select items from catalog to start ringing up sale
              </p>
            </div>
          ) : (
            cart.map((item, idx) => {
              const isWeighted = item.item_type === 'weighted';
              const weightDisplay = isWeighted && item.weight_in_grams 
                ? (item.weight_in_grams >= 1000 ? `${(item.weight_in_grams/1000).toFixed(3)} kg` : `${item.weight_in_grams.toFixed(0)} g`)
                : null;

              return (
                <div
                  key={item.item_id || idx}
                  className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs space-y-2 transition-colors"
                >
                  {/* Line 1: Title & Total */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{item.name}</h5>
                        {item.variant_name && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800 shrink-0">
                            {item.variant_name}
                          </span>
                        )}
                      </div>

                      {/* Weighed Item details */}
                      {isWeighted && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <button
                            type="button"
                            onClick={() => handleEditWeighedCartItem(item, idx)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                          >
                            <Scale className="w-3 h-3" />
                            <span>{weightDisplay} @ {config.currency_symbol}{item.unit_price.toFixed(2)}/kg</span>
                            <Edit2 className="w-2.5 h-2.5 ml-0.5 opacity-60" />
                          </button>
                          {item.target_price_requested && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              (Target: {config.currency_symbol}{item.target_price_requested.toFixed(2)})
                            </span>
                          )}
                        </div>
                      )}

                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{item.item_number}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 font-mono">
                      {config.currency_symbol}{item.total.toFixed(2)}
                    </span>
                  </div>

                  {/* Line 2: Quantity Controls + Price / Disc editing */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                    {/* Quantity Stepper (or Weight Adjust for weighed items) */}
                    {isWeighted ? (
                      <button
                        type="button"
                        onClick={() => handleEditWeighedCartItem(item, idx)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-lg flex items-center gap-1"
                      >
                        <Scale className="w-3 h-3 text-amber-600" />
                        <span>Adjust Weight ({weightDisplay})</span>
                      </button>
                    ) : (
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900">
                        <button
                          onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                          className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-l transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => updateQuantity(item.item_id, parseInt(e.target.value) || 1)}
                          className="w-10 text-center text-xs font-bold bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none font-mono"
                        />
                        <button
                          onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                          className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-r transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Price override */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>@ {config.currency_symbol}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={e => updatePrice(item.item_id, parseFloat(e.target.value) || 0)}
                        className="w-14 px-1 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-right text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none font-mono font-medium"
                      />
                    </div>

                    {/* Discount % */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <Percent className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount_percent || ''}
                        placeholder="0"
                        onChange={e => updateDiscount(item.item_id, parseFloat(e.target.value) || 0)}
                        className="w-10 px-1 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-center text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none font-mono"
                      />
                    </div>

                    {/* Remove line */}
                    <button
                      onClick={() => removeFromCart(item.item_id)}
                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Totals & Register Controls */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-md space-y-3 shrink-0">
          {/* Subtotals Breakdown */}
          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold">{config.currency_symbol}{subtotal.toFixed(2)}</span>
            </div>

            {/* Discounts summary & order discount button */}
            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
              <button
                onClick={() => setShowOrderDiscountModal(true)}
                className="hover:underline flex items-center gap-1 font-medium text-xs text-emerald-700 dark:text-emerald-400"
              >
                <span>Order Discount {orderDiscountPercent > 0 ? `(${orderDiscountPercent}%)` : '+ Add'}:</span>
              </button>
              <span className="font-mono font-semibold">
                {lineDiscountsTotal > 0 ? `-${config.currency_symbol}${lineDiscountsTotal.toFixed(2)}` : '$0.00'}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Tax ({config.default_tax_rate}%):</span>
              <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold">{config.currency_symbol}{taxTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-base font-extrabold text-slate-900 dark:text-white">Total:</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {config.currency_symbol}{grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Register Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleCancelClick}
              disabled={cart.length === 0}
              className="py-2.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 disabled:opacity-40 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>

            <button
              onClick={handleHoldCurrent}
              disabled={cart.length === 0}
              className="py-2.5 px-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 disabled:opacity-40 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
              title="Hold Transaction (F8)"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>Hold (F8)</span>
            </button>

            <button
              onClick={() => setIsHeldModalOpen(true)}
              className="py-2.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
            >
              <PlayCircle className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Held ({heldSales.length})</span>
            </button>
          </div>

          {/* Primary Checkout Button */}
          <button
            onClick={handleOpenPayment}
            disabled={cart.length === 0}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-xl text-sm font-extrabold tracking-wide uppercase shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <DollarSign className="w-5 h-5" />
            <span>Pay {config.currency_symbol}{grandTotal.toFixed(2)} (F4)</span>
          </button>
        </div>
      </div>

      {/* Weighed Item / Rashan Loose Product Modal */}
      {weighedModalItem && (
        <WeighedItemModal
          item={weighedModalItem}
          selectedVariant={weighedModalVariant}
          config={config}
          onConfirm={handleConfirmWeighedItem}
          onClose={() => {
            setWeighedModalItem(null);
            setWeighedModalVariant(undefined);
            setEditingCartItemIndex(null);
          }}
          initialGrams={
            editingCartItemIndex !== null && cart[editingCartItemIndex]?.weight_in_grams
              ? cart[editingCartItemIndex].weight_in_grams
              : undefined
          }
          initialPriceRequested={
            editingCartItemIndex !== null && cart[editingCartItemIndex]?.target_price_requested
              ? cart[editingCartItemIndex].target_price_requested
              : undefined
          }
        />
      )}

      {/* Product Variant Select Modal */}
      {variantModalItem && (
        <VariantSelectModal
          item={variantModalItem}
          config={config}
          onSelectVariant={handleSelectVariant}
          onClose={() => setVariantModalItem(null)}
        />
      )}

      {/* Payment & Split Tender Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 dark:bg-slate-950 px-5 py-4 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm">Payment & Checkout</h3>
                <p className="text-xs text-slate-400 font-mono">Total Due: {config.currency_symbol}{grandTotal.toFixed(2)}</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Payment Methods Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Tender Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['Cash', 'UPI / QR Code', 'Customer Credit', 'Check', 'Gift Card'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleSelectPaymentType(type)}
                      className={`py-2.5 px-2 text-center rounded-lg border text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1 ${
                        paymentType === type
                          ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/50 text-sky-900 dark:text-sky-300 font-bold ring-1 ring-sky-500 shadow-xs'
                          : 'border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                      }`}
                    >
                      {type === 'UPI / QR Code' && <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                      {type === 'Customer Credit' && <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                      <span className="truncate w-full">{type === 'UPI / QR Code' ? 'UPI / QR' : (type === 'Customer Credit' ? 'On Credit' : type)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Credit Info Banner */}
              {paymentType === 'Customer Credit' && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Customer Store Credit Account</span>
                    </span>
                    {selectedCustomer ? (
                      <span className="text-[10px] px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-full font-bold">
                        Attached: {selectedCustomer.first_name} {selectedCustomer.last_name}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded-full font-bold">
                        No Customer Selected
                      </span>
                    )}
                  </div>

                  {selectedCustomer ? (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-900/40">
                        <span className="text-[10px] text-slate-500 block">Current Due</span>
                        <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                          {config.currency_symbol}{(selectedCustomer.credit_balance || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-900/40">
                        <span className="text-[10px] text-slate-500 block">Credit Limit</span>
                        <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
                          {config.currency_symbol}{(selectedCustomer.credit_limit || 500).toFixed(2)}
                        </span>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-900/40">
                        <span className="text-[10px] text-slate-500 block">Available</span>
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {config.currency_symbol}{Math.max(0, (selectedCustomer.credit_limit || 500) - (selectedCustomer.credit_balance || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold">
                      ⚠️ Please attach a customer to this sale before charging on credit.
                    </p>
                  )}
                </div>
              )}

              {/* UPI / QR Code Digital Payment Panel */}
              {paymentType === 'UPI / QR Code' && (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-900/50 pb-2">
                    <div className="flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Scan & Pay with UPI</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                      Instant Dynamic QR
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* High contrast QR Box with neutral card container */}
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center shrink-0">
                      <div className="p-2 bg-white rounded-lg">
                        <QRCodeSVG
                          value={`upi://pay?pa=${encodeURIComponent(config.upi_id || 'nexuspos@okhdfcbank')}&pn=${encodeURIComponent(config.upi_payee_name || config.company_name || 'Nexus POS Retail')}&am=${(parseFloat(tenderAmountInput) > 0 ? parseFloat(tenderAmountInput) : (remainingBalance > 0 ? remainingBalance : grandTotal)).toFixed(2)}&cu=INR&tn=${encodeURIComponent((config.upi_qr_note || 'POS Sale') + ' #' + (cart.length > 0 ? cart[0].item_number : '01'))}`}
                          size={135}
                          level="M"
                          includeMargin={false}
                        />
                      </div>
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        <Smartphone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Scan with any UPI app</span>
                      </div>
                    </div>

                    {/* Payment Info & Quick Copy */}
                    <div className="flex-1 w-full space-y-2.5">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                          Amount to Pay
                        </span>
                        <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                          {config.currency_symbol}{(parseFloat(tenderAmountInput) > 0 ? parseFloat(tenderAmountInput) : (remainingBalance > 0 ? remainingBalance : grandTotal)).toFixed(2)}
                        </div>
                      </div>

                      {/* Payee UPI ID */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                          Merchant UPI ID (VPA)
                        </span>
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono">
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {config.upi_id || 'nexuspos@okhdfcbank'}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyUpiId}
                            className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors ml-1"
                            title="Copy UPI ID"
                          >
                            {copiedUpiId ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Customer UTR / Ref input */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          UPI Ref / UTR # (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 423589102431"
                          value={upiTxnRef}
                          onChange={e => setUpiTxnRef(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Compatible Apps Badges */}
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-600 dark:text-slate-400 border-t border-emerald-200/60 dark:border-emerald-900/50">
                    <span className="font-semibold">Supported:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      GPay • PhonePe • Paytm • BHIM • Cred • Any Bank UPI
                    </span>
                  </div>

                  {/* Direct Confirm Button for UPI */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmUpiFullPayment}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm UPI Payment Received ({config.currency_symbol}{(parseFloat(tenderAmountInput) > 0 ? parseFloat(tenderAmountInput) : (remainingBalance > 0 ? remainingBalance : grandTotal)).toFixed(2)})</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Cash Quick Buttons (if Cash selected) */}
              {paymentType === 'Cash' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Quick Cash Denominations
                    </label>
                    <span className="text-[11px] text-slate-500">Tap to set exact tender</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    <button
                      type="button"
                      onClick={() => setTenderAmountInput(remainingBalance.toFixed(2))}
                      className="py-2 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold"
                    >
                      Exact
                    </button>
                    {[5, 10, 20, 50, 100].map(bill => (
                      <button
                        key={bill}
                        type="button"
                        onClick={() => setTenderAmountInput(bill.toFixed(2))}
                        className="py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold font-mono"
                      >
                        ${bill}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tender Amount Input with Split Pay action */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Amount to Tender ({paymentType})
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 dark:text-slate-500 font-bold">
                      {config.currency_symbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={tenderAmountInput}
                      onChange={e => setTenderAmountInput(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSplitPayment}
                    className="px-3 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-xs font-bold whitespace-nowrap"
                  >
                    + Add Tender
                  </button>
                </div>
              </div>

              {/* Payments List / Split Summary */}
              {paymentsList.length > 0 && (
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-750">
                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tendered Payments</div>
                  {paymentsList.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-200 dark:border-slate-700/60 last:border-0">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{p.payment_type}</span>
                        {p.transaction_ref && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono ml-2">
                            Ref: {p.transaction_ref}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-slate-900 dark:text-white">{config.currency_symbol}{p.payment_amount.toFixed(2)}</span>
                        <button
                          onClick={() => handleRemovePayment(idx)}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Balance / Change Calculation Summary */}
              <div className="p-4 bg-slate-50 dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Grand Total Due:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{config.currency_symbol}{grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Total Tendered:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{config.currency_symbol}{totalPaid.toFixed(2)}</span>
                </div>
                {changeDue > 0 && (
                  <div className="flex justify-between text-sm font-extrabold text-emerald-700 dark:text-emerald-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>CHANGE DUE:</span>
                    <span className="font-mono text-base">{config.currency_symbol}{changeDue.toFixed(2)}</span>
                  </div>
                )}
                {remainingBalance > 0 && (
                  <div className="flex justify-between text-xs font-bold text-rose-600 dark:text-rose-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>REMAINING BALANCE:</span>
                    <span className="font-mono">{config.currency_symbol}{remainingBalance.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Optional Sale Comments */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sale Notes / Reference (Optional)
                </label>
                <input
                  type="text"
                  value={saleComment}
                  onChange={e => setSaleComment(e.target.value)}
                  placeholder="e.g. Order #42, Gift receipt requested..."
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-[#151c28] px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteCheckout}
                disabled={totalPaid < grandTotal - 0.001}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Complete Sale</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Level Discount Modal */}
      {showOrderDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 dark:bg-slate-950 px-4 py-3 text-white flex items-center justify-between border-b border-slate-800">
              <span className="font-bold text-xs">Apply Order Discount</span>
              <button onClick={() => setShowOrderDiscountModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setOrderDiscountPercent(pct);
                      setShowOrderDiscountModal(false);
                    }}
                    className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                      orderDiscountPercent === pct
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {pct}% Off
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Custom Percent (%)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={orderDiscountPercent || ''}
                    placeholder="0"
                    onChange={e => setOrderDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                  <button
                    onClick={() => setShowOrderDiscountModal(false)}
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {orderDiscountPercent > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setOrderDiscountPercent(0);
                    setShowOrderDiscountModal(false);
                  }}
                  className="w-full py-1.5 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:underline text-center"
                >
                  Remove Discount
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Held Sales Modal */}
      {isHeldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 dark:bg-slate-950 px-5 py-3.5 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PauseCircle className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm">Suspended / Held Sales</span>
              </div>
              <button onClick={() => setIsHeldModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2 bg-slate-50/50 dark:bg-slate-950/40">
              {heldSales.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">No held sales found.</p>
              ) : (
                heldSales.map(held => (
                  <div
                    key={held.id}
                    className="p-3 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{held.id}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{new Date(held.time).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                        {held.customerName ? `Customer: ${held.customerName}` : 'Walk-in'} • {held.items.length} items
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                        {config.currency_symbol}{held.total.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleResume(held.id)}
                        className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold"
                      >
                        Resume
                      </button>
                      <button
                        onClick={() => onDeleteHeldSale(held.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-850 px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsHeldModalOpen(false)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Customer Modal */}
      {isNewCustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 dark:bg-slate-950 px-4 py-3 text-white flex items-center justify-between border-b border-slate-800">
              <span className="font-bold text-xs">Quick Add Customer</span>
              <button onClick={() => setIsNewCustModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={newCustFirst}
                  onChange={e => setNewCustFirst(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                <input
                  type="text"
                  value={newCustLast}
                  onChange={e => setNewCustLast(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={e => setNewCustPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={newCustEmail}
                  onChange={e => setNewCustEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold"
                >
                  Save & Attach
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Clear / Cancel Cart Confirmation Modal */}
      {isCancelConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Clear Current Transaction?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                This will remove all {cart.length} item{cart.length > 1 ? 's' : ''} from the register cart and reset discounts.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsCancelConfirmOpen(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Keep Cart
              </button>
              <button
                type="button"
                onClick={confirmClearCart}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer active:scale-95"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variant Selector Modal */}
      {variantModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-slate-900 dark:bg-slate-950 px-5 py-3.5 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <div>
                  <h3 className="font-bold text-sm leading-tight">{variantModalItem.name}</h3>
                  <p className="text-[10px] text-slate-400">Select variant to add to cart</p>
                </div>
              </div>
              <button 
                onClick={() => setVariantModalItem(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2.5 max-h-[65vh] overflow-y-auto">
              {variantModalItem.variants?.map(v => {
                const isOutOfStock = (v.quantity ?? 0) <= 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      addItemToCart(variantModalItem, v);
                      setVariantModalItem(null);
                    }}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all group ${
                      isOutOfStock
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-400'
                        : 'bg-white dark:bg-slate-850 hover:bg-purple-50 dark:hover:bg-purple-950/40 border-slate-200 dark:border-slate-750 hover:border-purple-300 dark:hover:border-purple-800 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{v.name}</span>
                        {v.item_number && (
                          <span className="text-[10px] text-slate-400 font-mono">({v.item_number})</span>
                        )}
                      </div>
                      <div className="text-[11px] mt-0.5">
                        <span className={`font-semibold ${
                          isOutOfStock
                            ? 'text-rose-600 dark:text-rose-400'
                            : (v.quantity ?? 0) <= 3
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-purple-600 dark:text-purple-400'
                        }`}>
                          {v.quantity ?? 0} in stock
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                        {config.currency_symbol}{v.unit_price.toFixed(2)}
                      </span>
                      <span className="px-2.5 py-1 bg-purple-600 text-white rounded-lg text-xs font-bold shadow-2xs group-hover:bg-purple-700 transition-colors">
                        + Add
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-slate-50 dark:bg-slate-850 px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setVariantModalItem(null)}
                className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
