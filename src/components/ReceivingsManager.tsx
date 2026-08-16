import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  Search, 
  Trash2, 
  Check, 
  Building2, 
  History, 
  PackageCheck
} from 'lucide-react';
import { Item, Supplier, Receiving, ReceivingItem, StoreConfig, Employee, ItemVariant } from '../types/pos';
import { sound } from '../services/audio';
import { searchItems } from '../utils/fuzzySearch';

interface ReceivingsManagerProps {
  items: Item[];
  suppliers: Supplier[];
  receivings: Receiving[];
  currentUser: Employee;
  config: StoreConfig;
  onAddReceiving: (rec: Omit<Receiving, 'id' | 'receiving_time'>) => Receiving;
}

export const ReceivingsManager: React.FC<ReceivingsManagerProps> = ({
  items,
  suppliers,
  receivings,
  currentUser,
  config,
  onAddReceiving,
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [searchItem, setSearchItem] = useState('');
  const [receivingCart, setReceivingCart] = useState<ReceivingItem[]>([]);
  const [paymentType, setPaymentType] = useState('Invoice / Credit');
  const [comments, setComments] = useState('');
  const [activeTab, setActiveTab] = useState<'intake' | 'history'>('intake');

  const filteredItems = useMemo(() => {
    if (!searchItem.trim()) return [];
    return searchItems(items, searchItem, 'All').slice(0, 10);
  }, [items, searchItem]);

  const selectedSupplier = useMemo(() => {
    return suppliers.find(s => s.id === selectedSupplierId);
  }, [suppliers, selectedSupplierId]);

  const totalReceivingCost = useMemo(() => {
    return receivingCart.reduce((acc, i) => acc + i.total, 0);
  }, [receivingCart]);

  const addItemToReceiving = (item: Item, variant?: ItemVariant) => {
    sound.playBeep();
    const itemIdKey = variant ? `${item.id}-var-${variant.id}` : item.id;
    const itemNumber = variant ? (variant.item_number || item.item_number) : item.item_number;
    const itemName = variant ? `${item.name} (${variant.name})` : item.name;
    const costPrice = variant ? (variant.cost_price ?? item.cost_price) : item.cost_price;

    setReceivingCart(prev => {
      const idx = prev.findIndex(i => i.item_id === itemIdKey);
      if (idx > -1) {
        const updated = [...prev];
        const newQty = updated[idx].quantity + 1;
        updated[idx] = {
          ...updated[idx],
          quantity: newQty,
          total: updated[idx].cost_price * newQty,
        };
        return updated;
      } else {
        return [
          {
            item_id: itemIdKey,
            item_number: itemNumber,
            name: itemName,
            cost_price: costPrice,
            quantity: 10,
            total: costPrice * 10,
            ...(variant ? { variant_id: variant.id } : {}),
          },
          ...prev,
        ];
      }
    });
    setSearchItem('');
  };

  const updateItemCost = (itemId: string, cost: number) => {
    setReceivingCart(prev => prev.map(item => {
      if (item.item_id !== itemId) return item;
      return {
        ...item,
        cost_price: cost,
        total: cost * item.quantity,
      };
    }));
  };

  const updateItemQty = (itemId: string, qty: number) => {
    if (qty <= 0) {
      setReceivingCart(prev => prev.filter(i => i.item_id !== itemId));
      return;
    }
    setReceivingCart(prev => prev.map(item => {
      if (item.item_id !== itemId) return item;
      return {
        ...item,
        quantity: qty,
        total: item.cost_price * qty,
      };
    }));
  };

  const handleCompleteReceiving = () => {
    if (receivingCart.length === 0) return;

    onAddReceiving({
      supplier_id: selectedSupplier?.id,
      supplier_name: selectedSupplier?.company_name || 'Generic Supplier',
      employee_id: currentUser.id,
      employee_name: `${currentUser.first_name} ${currentUser.last_name}`,
      items: receivingCart,
      total: totalReceivingCost,
      payment_type: paymentType,
      comment: comments || undefined,
    });

    sound.playSuccess();
    setReceivingCart([]);
    setComments('');
    alert('Stock receiving completed successfully! Inventory counts updated.');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>Stock Receivings & Supplier Purchase Orders</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Record incoming shipments and update inventory stock counts</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('intake')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'intake'
                ? 'bg-sky-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>New Intake</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'history'
                ? 'bg-sky-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Receiving Log ({receivings.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'intake' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Intake Builder */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search items to receive */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Scan or Search Items to Receive into Stock
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchItem}
                  onChange={e => setSearchItem(e.target.value)}
                  placeholder="Type product name or barcode..."
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {filteredItems.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                  {filteredItems.map(item => {
                    const hasVariants = item.variants && item.variants.length > 0;
                    return (
                      <div
                        key={item.id}
                        className="p-2.5 hover:bg-sky-50/50 dark:hover:bg-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs transition-colors gap-2"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                            <span>{item.item_number}</span>
                            <span>• Current Stock: {item.quantity}</span>
                            {hasVariants && <span className="text-purple-600 dark:text-purple-400 font-bold">({item.variants?.length} variants)</span>}
                          </div>
                        </div>

                        {hasVariants ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.variants!.map(v => (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => addItemToReceiving(item, v)}
                                className="px-2 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded text-[11px] font-semibold transition-colors flex items-center gap-1.5"
                                title={`Current Stock: ${v.quantity ?? 0}`}
                              >
                                <span>{v.name}</span>
                                <span className="text-[10px] font-bold text-purple-900 dark:text-purple-200 bg-purple-200/70 dark:bg-purple-900/70 px-1 rounded">
                                  {v.quantity ?? 0}
                                </span>
                                <span className="font-mono text-[10px] opacity-75">({config.currency_symbol}{v.cost_price?.toFixed(2) || item.cost_price.toFixed(2)})</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
                              Cost: {config.currency_symbol}{item.cost_price.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => addItemToReceiving(item)}
                              className="px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-[10px] font-bold"
                            >
                              + Add
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Receiving Items Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 flex justify-between">
                <span>Items in Current Receiving PO</span>
                <span>{receivingCart.length} SKU(s)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/75 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3 text-right">Cost Price</th>
                      <th className="py-2.5 px-3 text-center">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                      <th className="py-2.5 px-3 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {receivingCart.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">
                          No items added yet. Search items above to receive stock.
                        </td>
                      </tr>
                    ) : (
                      receivingCart.map(item => (
                        <tr key={item.item_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 dark:text-white block">{item.name}</span>
                            <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">{item.item_number}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.cost_price}
                              onChange={e => updateItemCost(item.item_id, parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded text-right font-mono text-xs focus:ring-2 focus:ring-sky-500"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => updateItemQty(item.item_id, parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded text-center font-mono font-bold text-xs focus:ring-2 focus:ring-sky-500"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                            {config.currency_symbol}{item.total.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => updateItemQty(item.item_id, 0)}
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right 1 Col: Supplier & PO Summary */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Supplier & Payment Info
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Supplier
                </label>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <select
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.company_name} ({s.account_number})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedSupplier && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-400 space-y-1 border border-slate-200 dark:border-slate-750">
                  <p className="font-bold text-slate-800 dark:text-slate-200">{selectedSupplier.company_name}</p>
                  <p>Contact: {selectedSupplier.first_name} {selectedSupplier.last_name}</p>
                  <p>Phone: {selectedSupplier.phone_number}</p>
                  <p>Email: {selectedSupplier.email}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentType}
                  onChange={e => setPaymentType(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="Invoice / Credit">Net 30 Invoice / Credit</option>
                  <option value="Company Check">Company Check</option>
                  <option value="Direct Bank Transfer">Direct Bank Wire / ACH</option>
                  <option value="Company Card">Company Card</option>
                  <option value="Cash Paid">Cash Paid Out</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  PO Reference / Notes
                </label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  placeholder="PO #, Bill of Lading, Batch expiry notes..."
                  className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Purchase Cost:</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                    {config.currency_symbol}{totalReceivingCost.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handleCompleteReceiving}
                  disabled={receivingCart.length === 0}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Receive Stock & Update Inventory</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* History View */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300">
            Past Receivings & Inward Inventory History
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Receiving ID</th>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4 text-center">Items Received</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {receivings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 dark:text-slate-500">
                      No stock receiving records yet.
                    </td>
                  </tr>
                ) : (
                  receivings.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-sky-700 dark:text-sky-400">{rec.id}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {new Date(rec.receiving_time).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{rec.supplier_name || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{rec.employee_name}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-700 dark:text-slate-300">
                        {rec.items.reduce((a, i) => a + i.quantity, 0)} units ({rec.items.length} SKUs)
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{rec.payment_type}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                        {config.currency_symbol}{rec.total.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
