import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Barcode, 
  Download, 
  TrendingUp, 
  Package, 
  SlidersHorizontal, 
  X,
  PlusCircle,
  Scale,
  Layers
} from 'lucide-react';
import { Item, StoreConfig, ItemVariant, ItemType } from '../types/pos';
import { CategoryCombobox } from './CategoryCombobox';
import { searchItems } from '../utils/fuzzySearch';

interface ItemsManagerProps {
  items: Item[];
  config: StoreConfig;
  onAddItem: (item: Omit<Item, 'id'>) => Item;
  onUpdateItem: (id: string, updates: Partial<Item>) => void;
  onDeleteItem: (id: string) => void;
  onOpenBarcodeModal: (items: Item[]) => void;
}

export const ItemsManager: React.FC<ItemsManagerProps> = ({
  items,
  config,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onOpenBarcodeModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState<{
    item_number: string;
    name: string;
    category: string;
    cost_price: number;
    unit_price: number;
    quantity: number;
    reorder_level: number;
    description: string;
    item_type: ItemType;
    unit_name: string;
    variants: ItemVariant[];
  }>({
    item_number: '',
    name: '',
    category: 'General',
    cost_price: 0,
    unit_price: 0,
    quantity: 0,
    reorder_level: 10,
    description: '',
    item_type: 'standard',
    unit_name: 'unit',
    variants: [],
  });

  // Stock Adjustment Modal
  const [adjustModalItem, setAdjustModalItem] = useState<Item | null>(null);
  const [selectedAdjustVariantId, setSelectedAdjustVariantId] = useState<string>('all');
  const [adjustAmount, setAdjustAmount] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add');

  // Category List for Filtering & Combobox
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.category?.trim()) set.add(i.category.trim());
    });
    return ['All', ...Array.from(set)];
  }, [items]);

  // Filtered List using Smart Typo-Tolerant Search
  const filteredItems = useMemo(() => {
    const searchResults = searchItems(items, searchQuery, categoryFilter);
    return searchResults.filter(item => {
      if (stockFilter === 'low') {
        return item.quantity > 0 && item.quantity <= item.reorder_level;
      } else if (stockFilter === 'out') {
        return item.quantity <= 0;
      }
      return true;
    });
  }, [items, categoryFilter, searchQuery, stockFilter]);

  // Metrics
  const metrics = useMemo(() => {
    let totalSKUs = 0;
    let totalQty = 0;
    let inventoryValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const item of items) {
      if (item.is_deleted) continue;
      totalSKUs += 1;
      totalQty += item.quantity;
      inventoryValuation += item.cost_price * item.quantity;
      if (item.quantity <= 0) {
        outOfStockCount += 1;
      } else if (item.quantity <= item.reorder_level) {
        lowStockCount += 1;
      }
    }

    return {
      totalSKUs,
      totalQty,
      inventoryValuation,
      lowStockCount,
      outOfStockCount,
    };
  }, [items]);

  const handleOpenAdd = () => {
    const nextBarcode = 'SKU-' + Math.floor(10000 + Math.random() * 90000);
    setFormData({
      item_number: nextBarcode,
      name: '',
      category: categories[1] || 'Grocery & Rashan',
      cost_price: 5.0,
      unit_price: 10.0,
      quantity: 20,
      reorder_level: 5,
      description: '',
      item_type: 'standard',
      unit_name: 'unit',
      variants: [],
    });
    setEditingItemId(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (item: Item) => {
    setFormData({
      item_number: item.item_number,
      name: item.name,
      category: item.category || 'General',
      cost_price: item.cost_price,
      unit_price: item.unit_price,
      quantity: item.quantity,
      reorder_level: item.reorder_level,
      description: item.description || '',
      item_type: item.item_type || 'standard',
      unit_name: item.unit_name || (item.item_type === 'weighted' ? 'kg' : 'unit'),
      variants: item.variants ? JSON.parse(JSON.stringify(item.variants)) : [],
    });
    setEditingItemId(item.id);
    setIsEditModalOpen(true);
  };

  // Variant Helpers
  const handleAddVariant = () => {
    const count = formData.variants.length + 1;
    const newVariant: ItemVariant = {
      id: 'var-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      name: count === 1 ? 'Small' : count === 2 ? 'Medium' : count === 3 ? 'Large' : `Variant ${count}`,
      item_number: `${formData.item_number || 'SKU'}-V${count}`,
      cost_price: formData.cost_price || 0,
      unit_price: formData.unit_price || 0,
      quantity: 10,
    };
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }));
  };

  const handleUpdateVariant = (index: number, updates: Partial<ItemVariant>) => {
    setFormData(prev => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], ...updates };
      return { ...prev, variants: updated };
    });
  };

  const handleRemoveVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.item_number.trim()) {
      alert('Please provide an item name and barcode/SKU.');
      return;
    }

    // Auto-compute total quantity from variants if variants exist
    let computedQty = formData.quantity;
    if (formData.variants && formData.variants.length > 0) {
      computedQty = formData.variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
    }

    const payload = {
      ...formData,
      quantity: computedQty,
    };

    if (editingItemId) {
      onUpdateItem(editingItemId, payload);
    } else {
      onAddItem(payload);
    }

    setIsEditModalOpen(false);
  };

  const handleOpenAdjustModal = (item: Item) => {
    setAdjustModalItem(item);
    setSelectedAdjustVariantId(item.variants && item.variants.length > 0 ? item.variants[0].id : 'all');
    setAdjustAmount(1);
    setAdjustType('add');
  };

  const handleApplyAdjustment = () => {
    if (!adjustModalItem) return;
    const change = adjustType === 'add' ? adjustAmount : -adjustAmount;

    if (adjustModalItem.variants && adjustModalItem.variants.length > 0 && selectedAdjustVariantId !== 'all') {
      const updatedVariants = adjustModalItem.variants.map(v => {
        if (v.id === selectedAdjustVariantId) {
          return { ...v, quantity: Math.max(0, (v.quantity || 0) + change) };
        }
        return v;
      });
      const newTotal = updatedVariants.reduce((sum, v) => sum + (v.quantity || 0), 0);
      onUpdateItem(adjustModalItem.id, {
        variants: updatedVariants,
        quantity: newTotal,
      });
    } else {
      const newQty = Math.max(0, adjustModalItem.quantity + change);
      onUpdateItem(adjustModalItem.id, { quantity: newQty });
    }
    setAdjustModalItem(null);
  };

  const exportCSV = () => {
    const headers = ['Item Number', 'Name', 'Category', 'Type', 'Unit', 'Cost Price', 'Unit Price', 'Quantity', 'Reorder Level', 'Variants'];
    const rows = filteredItems.map(i => [
      `"${i.item_number}"`,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      `"${i.item_type || 'standard'}"`,
      `"${i.unit_name || 'unit'}"`,
      i.cost_price,
      i.unit_price,
      i.quantity,
      i.reorder_level,
      `"${i.variants ? i.variants.map(v => `${v.name}:${v.unit_price}`).join('; ') : ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Inventory Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
            {config.currency_symbol}{metrics.inventoryValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{metrics.totalQty} total units in catalog</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Active SKUs</span>
            <Package className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
            {metrics.totalSKUs}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Products & items registered</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Low Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {metrics.lowStockCount}
          </p>
          <button 
            onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
            className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-semibold"
          >
            {stockFilter === 'low' ? 'Clear filter' : 'Filter low stock'}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Out of Stock</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {metrics.outOfStockCount}
          </p>
          <button 
            onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
            className="text-[11px] text-rose-700 dark:text-rose-400 hover:underline font-semibold"
          >
            {stockFilter === 'out' ? 'Clear filter' : 'Filter out of stock'}
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2.5 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search SKU, name, variant or category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Category selector */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => onOpenBarcodeModal(filteredItems)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <Barcode className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Print Barcodes</span>
            </button>

            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Item</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Barcode / SKU</th>
                <th className="py-3 px-4">Item Name & Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Retail Rate</th>
                <th className="py-3 px-4 text-right">Margin</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    {items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
                          <Package className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Items in Inventory</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                          Get started by registering your first SKU, loose rashan item, or product variants.
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenAdd}
                          className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add First Item</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No items match your active search or filter</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setCategoryFilter('All');
                            setStockFilter('all');
                          }}
                          className="mt-2 text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                        >
                          Reset filters
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const margin = item.unit_price > 0 
                    ? (((item.unit_price - item.cost_price) / item.unit_price) * 100).toFixed(0) 
                    : '0';
                  const isOutOfStock = item.quantity <= 0;
                  const isLowStock = item.quantity > 0 && item.quantity <= item.reorder_level;
                  const hasVariants = item.variants && item.variants.length > 0;
                  const isWeighted = item.item_type === 'weighted';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {item.item_number}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{item.name}</span>
                          {isWeighted && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                              <Scale className="w-3 h-3" />
                              <span>Rashan / Weight</span>
                            </span>
                          )}
                          {hasVariants && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-bold border border-purple-200 dark:border-purple-800">
                              <Layers className="w-3 h-3" />
                              <span>{item.variants?.length} Variants</span>
                            </span>
                          )}
                        </div>

                        {hasVariants && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.variants?.map(v => (
                              <span key={v.id} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">
                                {v.name}: {config.currency_symbol}{v.unit_price}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.description && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-xs mt-0.5">{item.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400 font-medium">
                        {config.currency_symbol}{item.cost_price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {config.currency_symbol}{item.unit_price.toFixed(2)}
                        {isWeighted && <span className="text-[10px] font-normal text-slate-400"> /{item.unit_name || 'kg'}</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {margin}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isOutOfStock
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                              : isLowStock
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                              : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                          }`}
                        >
                          {item.quantity} {isWeighted ? (item.unit_name || 'kg') : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAdjustModal(item)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                            title="Adjust Stock"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-400 rounded-lg transition-colors"
                            title="Edit Item"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete item "${item.name}"?`)) {
                                onDeleteItem(item.id);
                              }
                            }}
                            className="p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-lg transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Item Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="bg-slate-900 dark:bg-slate-950 px-5 py-3.5 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <span className="font-bold text-sm">
                {editingItemId ? 'Edit Product Item' : 'Add New Inventory Item'}
              </span>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Product Pricing Type Selector (Standard vs Loose Rashan by weight) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Product Pricing Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, item_type: 'standard', unit_name: 'unit' })}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 ${
                      formData.item_type === 'standard'
                        ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Package className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
                    <div>
                      <span className="font-bold block">Standard Unit Product</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Sold per piece / packet / bottle</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, item_type: 'weighted', unit_name: 'kg' })}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 ${
                      formData.item_type === 'weighted'
                        ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Scale className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-bold block">Weighed / Open Value (Rashan)</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Sold loose by grams/kg or customer budget</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* SKU & Category Combobox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Barcode / SKU *
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      value={formData.item_number}
                      onChange={e => setFormData({ ...formData, item_number: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, item_number: 'SKU-' + Math.floor(10000 + Math.random() * 90000) })}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold shrink-0"
                      title="Generate random SKU"
                    >
                      Gen
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category (Combobox: Select or Type New) *
                  </label>
                  <CategoryCombobox
                    value={formData.category}
                    onChange={cat => setFormData({ ...formData, category: cat })}
                    existingCategories={categories}
                    placeholder="Search or type new category..."
                    required
                  />
                </div>
              </div>

              {/* Item Name & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder={formData.item_type === 'weighted' ? 'e.g. Basmati Rice, Sugar (Loose), Dal' : 'e.g. Colombian Roast Whole Bean'}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Base Unit
                  </label>
                  <select
                    value={formData.unit_name}
                    onChange={e => setFormData({ ...formData, unit_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="unit">unit / pcs</option>
                    <option value="kg">kg (Kilograms)</option>
                    <option value="g">g (Grams)</option>
                    <option value="ltr">ltr (Litres)</option>
                    <option value="ml">ml (Millilitres)</option>
                    <option value="pack">pack</option>
                    <option value="box">box</option>
                    <option value="dozen">dozen</option>
                  </select>
                </div>
              </div>

              {/* Pricing & Rate */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cost Price ({config.currency_symbol} / {formData.unit_name}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.cost_price}
                    onChange={e => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Selling Price / Rate ({config.currency_symbol} / {formData.unit_name}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.unit_price}
                    onChange={e => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-sky-500 focus:outline-none text-sky-600 dark:text-sky-400"
                  />
                </div>
              </div>

              {/* Stock & Reorder */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Quantity in Stock ({formData.unit_name})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={formData.item_type === 'weighted' ? '0.1' : '1'}
                    required
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Low Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.reorder_level}
                    onChange={e => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Product Variants Sub-section */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Product Variants (Sizes / Packs / Flavors)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const baseSku = formData.item_number || 'SKU';
                        const p = formData.unit_price || 10;
                        const c = formData.cost_price || 5;
                        setFormData(prev => ({
                          ...prev,
                          variants: [
                            { id: 'var-' + Date.now() + '-1', name: 'Small', item_number: `${baseSku}-S`, cost_price: Math.round(c * 0.75 * 100)/100, unit_price: Math.round(p * 0.75 * 100)/100, quantity: 10 },
                            { id: 'var-' + Date.now() + '-2', name: 'Medium', item_number: `${baseSku}-M`, cost_price: c, unit_price: p, quantity: 15 },
                            { id: 'var-' + Date.now() + '-3', name: 'Large', item_number: `${baseSku}-L`, cost_price: Math.round(c * 1.5 * 100)/100, unit_price: Math.round(p * 1.5 * 100)/100, quantity: 10 },
                          ]
                        }));
                      }}
                      className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 rounded text-[11px] font-semibold"
                    >
                      + S/M/L Presets
                    </button>
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Variant</span>
                    </button>
                  </div>
                </div>

                {formData.variants.length === 0 ? (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    No variants added. Click "+ Add Variant" or "+ S/M/L Presets" if this item comes in multiple sizes (e.g. Small / Large, 500g / 1kg pack).
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {formData.variants.map((v, idx) => (
                      <div key={v.id || idx} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                            Option #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors"
                            title="Remove Variant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Variant Title</label>
                            <input
                              type="text"
                              placeholder="e.g. Small / Large / 500g"
                              value={v.name}
                              onChange={e => handleUpdateVariant(idx, { name: e.target.value })}
                              className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-purple-500 focus:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Variant Barcode / SKU</label>
                            <input
                              type="text"
                              placeholder={`${formData.item_number || 'SKU'}-V${idx + 1}`}
                              value={v.item_number || ''}
                              onChange={e => handleUpdateVariant(idx, { item_number: e.target.value })}
                              className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-purple-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Cost ({config.currency_symbol})</label>
                            <input
                              type="number"
                              step="0.01"
                              value={v.cost_price ?? 0}
                              onChange={e => handleUpdateVariant(idx, { cost_price: parseFloat(e.target.value) || 0 })}
                              className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-purple-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Selling Price ({config.currency_symbol})</label>
                            <input
                              type="number"
                              step="0.01"
                              value={v.unit_price}
                              onChange={e => handleUpdateVariant(idx, { unit_price: parseFloat(e.target.value) || 0 })}
                              className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-purple-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Stock Count</label>
                            <input
                              type="number"
                              min="0"
                              value={v.quantity}
                              onChange={e => handleUpdateVariant(idx, { quantity: parseInt(e.target.value) || 0 })}
                              className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-purple-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Product Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brand, origin, grade, packaging details..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 dark:bg-slate-950 px-5 py-3 text-white flex items-center justify-between border-b border-slate-800">
              <span className="font-bold text-sm">Adjust Stock Level</span>
              <button onClick={() => setAdjustModalItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Item:</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{adjustModalItem.name}</p>
                
                {/* Variant Selector in Stock Adjustment */}
                {adjustModalItem.variants && adjustModalItem.variants.length > 0 && (
                  <div className="mt-2.5">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Select Variant to Adjust:
                    </label>
                    <select
                      value={selectedAdjustVariantId}
                      onChange={e => setSelectedAdjustVariantId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    >
                      <option value="all">Entire Item / Total Stock</option>
                      {adjustModalItem.variants.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.quantity ?? 0} in stock) - {config.currency_symbol}{v.unit_price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                  Current Stock:{' '}
                  <span className="font-bold font-mono text-slate-900 dark:text-white">
                    {adjustModalItem.variants && adjustModalItem.variants.length > 0 && selectedAdjustVariantId !== 'all'
                      ? `${adjustModalItem.variants.find(v => v.id === selectedAdjustVariantId)?.quantity ?? 0} units (${adjustModalItem.variants.find(v => v.id === selectedAdjustVariantId)?.name})`
                      : `${adjustModalItem.quantity} ${adjustModalItem.unit_name || 'units'}`}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    adjustType === 'add'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Receive / Restock</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdjustType('remove')}
                  className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    adjustType === 'remove'
                      ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 ring-1 ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Damaged / Loss</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity to {adjustType === 'add' ? 'Add' : 'Deduct'}
                </label>
                <input
                  type="number"
                  min="1"
                  step={adjustModalItem.item_type === 'weighted' ? '0.1' : '1'}
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalItem(null)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyAdjustment}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold"
                >
                  Apply Stock Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
