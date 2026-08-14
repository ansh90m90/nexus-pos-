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
  ShoppingCart
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Item, Customer, Sale, SaleItem, Payment, StoreConfig, Employee } from '../types/pos';
import { sound } from '../services/audio';

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
  onOpenSwitchUser,
  onOpenShortcuts,
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

  // Filtered items catalog
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (item.is_deleted) return false;
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.name.toLowerCase().includes(q) || 
        item.item_number.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
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
      const afterItemDisc = lineBase - itemDisc;
      const lineTax = afterItemDisc * (item.tax_percent / 100);

      sub += lineBase;
      lineDisc += itemDisc;
      tax += lineTax;
    }

    const baseAfterLines = sub - lineDisc;
    const globalOrderDisc = baseAfterLines * (orderDiscountPercent / 100);
    const totalDiscounts = lineDisc + globalOrderDisc + loyaltyDiscountAmount;
    
    // Tax recalculation with order level discounts
    const taxableAmount = Math.max(0, sub - totalDiscounts);
    const finalTax = taxableAmount * (config.default_tax_rate / 100);
    const finalGrandTotal = Math.max(0, taxableAmount + finalTax);

    return {
      subtotal: sub,
      lineDiscountsTotal: totalDiscounts,
      taxTotal: finalTax,
      rawTotal: sub + finalTax,
      grandTotal: finalGrandTotal,
    };
  }, [cart, orderDiscountPercent, loyaltyDiscountAmount, config.default_tax_rate]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        onOpenShortcuts?.();
      } else if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
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
      } else if (e.key === 'F9') {
        e.preventDefault();
        onOpenSwitchUser?.();
      } else if (e.key === 'Escape') {
        if (isPaymentModalOpen) setIsPaymentModalOpen(false);
        if (isHeldModalOpen) setIsHeldModalOpen(false);
        if (isNewCustModalOpen) setIsNewCustModalOpen(false);
        if (showOrderDiscountModal) setShowOrderDiscountModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isPaymentModalOpen, isHeldModalOpen, isNewCustModalOpen, showOrderDiscountModal]);

  // Cart operations
  const addItemToCart = (item: Item) => {
    sound.playBeep();
    setCart(prev => {
      const existingIdx = prev.findIndex(i => i.item_id === item.id);
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
        const lineBase = item.unit_price * 1;
        const lineTax = lineBase * (config.default_tax_rate / 100);
        const newItem: SaleItem = {
          item_id: item.id,
          item_number: item.item_number,
          name: item.name,
          category: item.category,
          cost_price: item.cost_price,
          unit_price: item.unit_price,
          quantity: 1,
          discount_percent: 0,
          tax_percent: config.default_tax_rate,
          total: lineBase + lineTax,
        };
        return [newItem, ...prev];
      }
    });
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

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Clear all items in the current transaction?')) {
      setCart([]);
      setSelectedCustomerId('');
      setOrderDiscountPercent(0);
      setLoyaltyDiscountAmount(0);
      setRedeemedPoints(0);
    }
  };

  // Barcode / Scanner submission
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const barcode = barcodeInput.trim();
    if (!barcode) return;

    const matched = items.find(i => 
      !i.is_deleted && (
        i.item_number.toLowerCase() === barcode.toLowerCase() ||
        i.name.toLowerCase() === barcode.toLowerCase()
      )
    );

    if (matched) {
      addItemToCart(matched);
      setBarcodeInput('');
    } else {
      alert(`No active inventory item found matching SKU or barcode: "${barcode}"`);
    }
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

  const changeDue = Math.max(0, totalPaid - grandTotal);
  const remainingBalance = Math.max(0, grandTotal - totalPaid);

  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setPaymentsList([{ payment_type: 'Cash', payment_amount: grandTotal }]);
    setPaymentType('Cash');
    setTenderAmountInput(grandTotal.toFixed(2));
    setSaleComment('');
    setUpiTxnRef('');
    setIsPaymentModalOpen(true);
  };

  const handleSelectPaymentType = (type: Payment['payment_type']) => {
    setPaymentType(type);
    if (type === 'UPI / QR Code') {
      const targetAmt = remainingBalance > 0 ? remainingBalance : grandTotal;
      setTenderAmountInput(targetAmt.toFixed(2));
    }
  };

  const handleAddSplitPayment = () => {
    const amt = parseFloat(tenderAmountInput) || 0;
    if (amt <= 0) return;

    setPaymentsList(prev => [
      ...prev,
      {
        payment_type: paymentType,
        payment_amount: amt,
        transaction_ref: paymentType === 'UPI / QR Code' && upiTxnRef.trim() ? upiTxnRef.trim() : undefined,
      },
    ]);
    const newRemaining = Math.max(0, remainingBalance - amt);
    setTenderAmountInput(newRemaining > 0 ? newRemaining.toFixed(2) : '0.00');
    if (paymentType === 'UPI / QR Code') {
      setUpiTxnRef('');
    }
  };

  const handleConfirmUpiFullPayment = () => {
    const amt = parseFloat(tenderAmountInput) > 0 ? parseFloat(tenderAmountInput) : (remainingBalance > 0 ? remainingBalance : grandTotal);
    if (amt <= 0) return;

    setPaymentsList(prev => [
      ...prev,
      {
        payment_type: 'UPI / QR Code',
        payment_amount: amt,
        transaction_ref: upiTxnRef.trim() || undefined,
      },
    ]);
    const newRemaining = Math.max(0, remainingBalance - amt);
    setTenderAmountInput(newRemaining > 0 ? newRemaining.toFixed(2) : '0.00');
    setUpiTxnRef('');
  };

  const handleCopyUpiId = () => {
    const targetId = config.upi_id || 'osposstore@okhdfcbank';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(targetId);
      setCopiedUpiId(true);
      setTimeout(() => setCopiedUpiId(false), 2000);
    }
  };

  const handleRemovePayment = (index: number) => {
    setPaymentsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleCompleteCheckout = () => {
    if (totalPaid < grandTotal - 0.001) {
      alert('Insufficient payment amount tendered. Please collect the remaining balance.');
      return;
    }

    const salePayload = {
      customer_id: selectedCustomerId || undefined,
      customer_name: selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : undefined,
      employee_id: currentUser.id,
      employee_name: `${currentUser.first_name} ${currentUser.last_name}`,
      items: cart,
      subtotal,
      tax_total: taxTotal,
      discount_total: lineDiscountsTotal,
      total: grandTotal,
      payments: paymentsList,
      change_due: changeDue,
      comment: saleComment || undefined,
    };

    const completed = onCompleteSale(salePayload);
    sound.playSuccess();
    setIsPaymentModalOpen(false);
    setCart([]);
    setSelectedCustomerId('');
    setOrderDiscountPercent(0);
    setLoyaltyDiscountAmount(0);
    setRedeemedPoints(0);
    onShowReceipt(completed);
  };

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
    });

    setSelectedCustomerId(created.id);
    setIsNewCustModalOpen(false);
    setNewCustFirst('');
    setNewCustLast('');
    setNewCustPhone('');
    setNewCustEmail('');
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row overflow-hidden bg-slate-100 dark:bg-slate-950 transition-colors">
      {/* Mobile-only switcher tabs for phone screens */}
      <div className="lg:hidden flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
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
          <span>Items & Search ({filteredItems.length})</span>
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

      {/* Left Column: Item Catalog & Quick Search (60%) */}
      <div className={`flex-1 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden ${
        mobileActiveTab === 'catalog' ? 'flex' : 'hidden lg:flex'
      }`}>
        {/* Top Search & Barcode Bar */}
        <div className="p-3 bg-slate-900 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2.5">
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
              className="absolute right-1.5 px-2.5 py-1 bg-slate-800 dark:bg-slate-700 text-white rounded-md text-[11px] font-semibold hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
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
              placeholder="Search items by name or category..."
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
        <div className="px-3 py-2 bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 overflow-x-auto flex gap-1.5 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Item Grid */}
        <div className="flex-1 p-3 overflow-y-auto bg-slate-100/60 dark:bg-slate-950/40">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12">
              <Search className="w-10 h-10 mb-2 stroke-[1.5] text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No items found</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Try searching with a different SKU or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filteredItems.map(item => {
                const isOutOfStock = item.quantity <= 0;
                const isLowStock = item.quantity > 0 && item.quantity <= item.reorder_level;

                return (
                  <button
                    key={item.id}
                    onClick={() => addItemToCart(item)}
                    className="group relative flex flex-col justify-between p-3 bg-white dark:bg-slate-900 hover:bg-sky-50/40 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 rounded-xl text-left transition-all shadow-xs hover:shadow-sm active:scale-[0.99]"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 group-hover:text-sky-600 dark:group-hover:text-sky-400 font-medium">
                          {item.item_number}
                        </span>
                        {isOutOfStock ? (
                          <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[9px] font-bold rounded-md border border-rose-200 dark:border-rose-900">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[9px] font-bold rounded-md border border-amber-200 dark:border-amber-900">
                            {item.quantity} left
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            {item.quantity} in stock
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                        {item.category}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-black text-sky-700 dark:text-sky-400 font-mono">
                        {config.currency_symbol}{item.unit_price.toFixed(2)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-sky-600 group-hover:text-white dark:group-hover:bg-sky-500 rounded-md transition-colors font-semibold">
                        + Add
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Register Terminal & Cart (40%) */}
      <div className={`w-full lg:w-[420px] xl:w-[480px] flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full overflow-y-auto ${
        mobileActiveTab === 'cart' ? 'flex flex-1' : 'hidden lg:flex'
      }`}>
        {/* Customer Selection Bar */}
        <div className="p-3 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex-1 flex items-center gap-2">
            <User className="w-4 h-4 text-sky-400 shrink-0" />
            <select
              value={selectedCustomerId}
              onChange={e => {
                setSelectedCustomerId(e.target.value);
                setRedeemedPoints(0);
                setLoyaltyDiscountAmount(0);
              }}
              className="bg-slate-800 dark:bg-slate-900 text-slate-200 text-xs border border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 w-full truncate font-medium"
            >
              <option value="">Walk-in Customer (Guest)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} ({c.points} pts)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsNewCustModalOpen(true)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg border border-slate-700 text-xs transition-colors shrink-0"
            title="Add New Customer"
          >
            <UserPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Loyalty Points Banner */}
        {selectedCustomer && (
          <div className="bg-sky-50 dark:bg-sky-950/60 px-3 py-2 border-b border-sky-100 dark:border-sky-900/60 flex items-center justify-between text-xs text-sky-900 dark:text-sky-200">
            <div className="flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Loyalty: <b className="font-mono">{selectedCustomer.points} pts</b></span>
            </div>

            <div className="flex items-center gap-2">
              {redeemedPoints > 0 ? (
                <div className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                  <span>Applied -{config.currency_symbol}{loyaltyDiscountAmount.toFixed(2)}</span>
                  <button
                    onClick={handleClearPointsDiscount}
                    className="text-rose-600 hover:underline ml-1 text-[10px]"
                  >
                    Remove
                  </button>
                </div>
              ) : selectedCustomer.points >= 50 ? (
                <button
                  onClick={handleRedeemCustomerPoints}
                  className="px-2 py-0.5 bg-sky-600 hover:bg-sky-700 text-white rounded text-[11px] font-bold transition-colors"
                >
                  Redeem (50 pts = $2.50)
                </button>
              ) : null}

              <button 
                onClick={() => {
                  setSelectedCustomerId('');
                  handleClearPointsDiscount();
                }}
                className="text-slate-400 hover:text-rose-600 text-xs font-semibold"
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
            cart.map(item => (
              <div
                key={item.item_id}
                className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs space-y-2 transition-colors"
              >
                {/* Line 1: Title & Total */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{item.name}</h5>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{item.item_number}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 font-mono">
                    {config.currency_symbol}{item.total.toFixed(2)}
                  </span>
                </div>

                {/* Line 2: Quantity Controls + Price / Disc editing */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                  {/* Quantity Stepper */}
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
            ))
          )}
        </div>

        {/* Bottom Totals & Register Controls */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-md space-y-3">
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
              onClick={clearCart}
              disabled={cart.length === 0}
              className="py-2.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
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
    </div>
  );
};
