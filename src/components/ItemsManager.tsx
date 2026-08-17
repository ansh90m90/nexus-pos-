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
  Layers,
  ChevronDown,
  ChevronRight,
  Folder,
  FileText,
  Boxes,
  CheckCircle2
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

  // Expanded Folder IDs for inline table expansion
  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedItemIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [productStructureMode, setProductStructureMode] = useState<'single' | 'variants'>('single');

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

  // Custom Delete Item Confirmation Modal State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<Item | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

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
      const hasVariants = item.variants && item.variants.length > 0;
      
      if (stockFilter === 'low') {
        if (hasVariants) {
          // Check if any variant is at or below its reorder level
          return item.variants!.some(v => (v.quantity ?? 0) > 0 && (v.quantity ?? 0) <= (v.reorder_level ?? 5));
        }
        return item.quantity > 0 && item.quantity <= item.reorder_level;
      } else if (stockFilter === 'out') {
        if (hasVariants) {
          return item.variants!.some(v => (v.quantity ?? 0) <= 0) || item.quantity <= 0;
        }
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
      const hasVariants = item.variants && item.variants.length > 0;

      if (hasVariants) {
        totalSKUs += item.variants!.length;
        let itemSumQty = 0;
        let itemHasLowStock = false;
        let itemHasOutOfStock = false;

        for (const v of item.variants!) {
          const vQty = Number(v.quantity) || 0;
          const vCost = Number(v.cost_price) || 0;
          const vReorder = v.reorder_level ?? 5;
          itemSumQty += vQty;
          inventoryValuation += vCost * vQty;

          if (vQty <= 0) {
            itemHasOutOfStock = true;
          } else if (vQty <= vReorder) {
            itemHasLowStock = true;
          }
        }
        totalQty += itemSumQty;
        if (itemHasOutOfStock) outOfStockCount += 1;
        if (itemHasLowStock) lowStockCount += 1;
      } else {
        totalSKUs += 1;
        totalQty += item.quantity;
        inventoryValuation += item.cost_price * item.quantity;
        if (item.quantity <= 0) {
          outOfStockCount += 1;
        } else if (item.quantity <= item.reorder_level) {
          lowStockCount += 1;
        }
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
    setProductStructureMode('single');
    setEditingItemId(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (item: Item) => {
    const hasVariants = Boolean(item.variants && item.variants.length > 0);
    setFormData({
      item_number: item.item_number,
      name: item.name,
      category: item.category || 'General',
      cost_price: item.cost_price || 0,
      unit_price: item.unit_price || 0,
      quantity: item.quantity || 0,
      reorder_level: item.reorder_level || 5,
      description: item.description || '',
      item_type: item.item_type || 'standard',
      unit_name: item.unit_name || (item.item_type === 'weighted' ? 'kg' : 'unit'),
      variants: item.variants ? JSON.parse(JSON.stringify(item.variants)) : [],
    });
    setProductStructureMode(hasVariants ? 'variants' : 'single');
    setEditingItemId(item.id);
    setIsEditModalOpen(true);
  };

  // Switch structure mode in modal
  const handleSwitchStructureMode = (mode: 'single' | 'variants') => {
    setProductStructureMode(mode);
    if (mode === 'variants' && formData.variants.length === 0) {
      // Seed initial 2 default variant files
      const baseSku = formData.item_number || 'SKU';
      const c = formData.cost_price || 5;
      const p = formData.unit_price || 10;
      setFormData(prev => ({
        ...prev,
        variants: [
          { 
            id: 'var-' + Date.now() + '-1', 
            name: 'Standard Pack (500g / Small)', 
            item_number: `${baseSku}-V1`, 
            cost_price: c, 
            unit_price: p, 
            quantity: 10,
            reorder_level: 5
          },
          { 
            id: 'var-' + Date.now() + '-2', 
            name: 'Family Pack (1kg / Large)', 
            item_number: `${baseSku}-V2`, 
            cost_price: Math.round(c * 1.8 * 100) / 100, 
            unit_price: Math.round(p * 1.8 * 100) / 100, 
            quantity: 8,
            reorder_level: 3
          }
        ]
      }));
    } else if (mode === 'single' && formData.variants.length > 0) {
      // If switching back to single, ask confirmation or clear variants
      if (formData.variants.length > 0) {
        const first = formData.variants[0];
        setFormData(prev => ({
          ...prev,
          cost_price: first.cost_price || prev.cost_price || 5,
          unit_price: first.unit_price || prev.unit_price || 10,
          quantity: prev.variants.reduce((s, v) => s + (Number(v.quantity) || 0), 0),
          reorder_level: first.reorder_level || 5,
          variants: []
        }));
      }
    }
  };

  // Variant Helpers ("Files inside this folder")
  const handleAddVariant = () => {
    const count = formData.variants.length + 1;
    const baseSku = formData.item_number || 'SKU';
    const lastVar = formData.variants[formData.variants.length - 1];
    
    const newVariant: ItemVariant = {
      id: 'var-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      name: count === 1 ? 'Small' : count === 2 ? 'Medium' : count === 3 ? 'Large' : `Variant File ${count}`,
      item_number: `${baseSku}-V${count}`,
      cost_price: lastVar?.cost_price || formData.cost_price || 5,
      unit_price: lastVar?.unit_price || formData.unit_price || 10,
      quantity: 10,
      reorder_level: 5,
    };
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }));
  };

  const handleSetAllVariantsStock = (newStock: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(v => ({ ...v, quantity: Math.max(0, newStock) })),
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
    if (!formData.name.trim()) {
      showToast('Please provide a product name.', 'error');
      return;
    }

    const isFolder = productStructureMode === 'variants' && formData.variants.length > 0;

    if (isFolder) {
      // Validate all variants have names and barcodes
      for (let i = 0; i < formData.variants.length; i++) {
        const v = formData.variants[i];
        if (!v.name.trim()) {
          showToast(`Please enter a name for Variant #${i + 1}`, 'error');
          return;
        }
        if (!v.item_number.trim()) {
          showToast(`Please enter a Barcode/SKU for Variant "${v.name}"`, 'error');
          return;
        }
      }

      // Compute folder aggregate values
      const computedQty = formData.variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
      const firstVar = formData.variants[0];

      const payload: Omit<Item, 'id'> = {
        item_number: formData.item_number || `SKU-${Date.now().toString().slice(-6)}`,
        name: formData.name.trim(),
        category: formData.category || 'General',
        cost_price: firstVar.cost_price || 0, // Fallback placeholder
        unit_price: firstVar.unit_price || 0, // Fallback placeholder
        quantity: computedQty,
        reorder_level: Math.min(...formData.variants.map(v => v.reorder_level ?? 5)),
        item_type: formData.item_type || 'standard',
        unit_name: formData.unit_name || 'unit',
        description: formData.description || '',
        variants: formData.variants,
      };

      if (editingItemId) {
        onUpdateItem(editingItemId, payload);
        showToast(`Updated product folder: ${payload.name} (${formData.variants.length} variants)`);
      } else {
        onAddItem(payload);
        showToast(`Created product folder: ${payload.name} (${formData.variants.length} variants)`);
      }
    } else {
      // Single product validation
      if (!formData.item_number.trim()) {
        showToast('Please provide a barcode/SKU for this item.', 'error');
        return;
      }

      const payload: Omit<Item, 'id'> = {
        item_number: formData.item_number.trim(),
        name: formData.name.trim(),
        category: formData.category || 'General',
        cost_price: formData.cost_price || 0,
        unit_price: formData.unit_price || 0,
        quantity: formData.quantity || 0,
        reorder_level: formData.reorder_level || 5,
        item_type: formData.item_type || 'standard',
        unit_name: formData.unit_name || 'unit',
        description: formData.description || '',
        variants: [], // Empty for single product
      };

      if (editingItemId) {
        onUpdateItem(editingItemId, payload);
        showToast(`Updated product: ${payload.name}`);
      } else {
        onAddItem(payload);
        showToast(`Added new product: ${payload.name}`);
      }
    }

    setIsEditModalOpen(false);
  };

  const handleConfirmDeleteItem = () => {
    if (!deleteConfirmItem) return;
    const name = deleteConfirmItem.name;
    onDeleteItem(deleteConfirmItem.id);
    setDeleteConfirmItem(null);
    showToast(`Successfully deleted product: ${name}`);
  };

  const handleOpenAdjustModal = (item: Item, specificVariantId?: string) => {
    setAdjustModalItem(item);
    if (specificVariantId) {
      setSelectedAdjustVariantId(specificVariantId);
    } else {
      setSelectedAdjustVariantId(item.variants && item.variants.length > 0 ? item.variants[0].id : 'all');
    }
    setAdjustAmount(1);
    setAdjustType('add');
  };

  const handleApplyAdjustment = () => {
    if (!adjustModalItem) return;
    const change = adjustType === 'add' ? adjustAmount : -adjustAmount;

    if (adjustModalItem.variants && adjustModalItem.variants.length > 0) {
      if (selectedAdjustVariantId !== 'all') {
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
        // Adjust each variant equally
        const updatedVariants = adjustModalItem.variants.map(v => ({
          ...v,
          quantity: Math.max(0, (v.quantity || 0) + change),
        }));
        const newTotal = updatedVariants.reduce((sum, v) => sum + (v.quantity || 0), 0);
        onUpdateItem(adjustModalItem.id, {
          variants: updatedVariants,
          quantity: newTotal,
        });
      }
    } else {
      const newQty = Math.max(0, adjustModalItem.quantity + change);
      onUpdateItem(adjustModalItem.id, { quantity: newQty });
    }
    showToast(`Adjusted inventory stock for ${adjustModalItem.name}`);
    setAdjustModalItem(null);
  };

  const exportCSV = () => {
    const headers = ['Item Number', 'Product / Folder Name', 'Category', 'Type', 'Base Unit', 'Cost Price', 'Selling Price', 'Quantity', 'Reorder Level', 'Structure'];
    const rows: (string | number)[][] = [];

    filteredItems.forEach(item => {
      const hasVariants = item.variants && item.variants.length > 0;
      if (hasVariants) {
        // Parent folder summary row
        const minCost = Math.min(...item.variants!.map(v => v.cost_price || 0));
        const maxCost = Math.max(...item.variants!.map(v => v.cost_price || 0));
        const minPrice = Math.min(...item.variants!.map(v => v.unit_price || 0));
        const maxPrice = Math.max(...item.variants!.map(v => v.unit_price || 0));

        rows.push([
          `"${item.item_number}"`,
          `"[FOLDER] ${item.name.replace(/"/g, '""')}"`,
          `"${item.category}"`,
          `"${item.item_type || 'standard'}"`,
          `"${item.unit_name || 'unit'}"`,
          `"${minCost} - ${maxCost}"`,
          `"${minPrice} - ${maxPrice}"`,
          item.quantity,
          'Per Variant',
          `"Master Folder (${item.variants!.length} variant files)"`
        ]);

        // Child variant rows
        item.variants!.forEach(v => {
          rows.push([
            `"  └ ${v.item_number}"`,
            `"  └ [VARIANT FILE] ${item.name} (${v.name})"`,
            `"${item.category}"`,
            `"${item.item_type || 'standard'}"`,
            `"${item.unit_name || 'unit'}"`,
            v.cost_price,
            v.unit_price,
            v.quantity,
            v.reorder_level ?? 5,
            `"Variant File of ${item.name}"`
          ]);
        });
      } else {
        rows.push([
          `"${item.item_number}"`,
          `"${item.name.replace(/"/g, '""')}"`,
          `"${item.category}"`,
          `"${item.item_type || 'standard'}"`,
          `"${item.unit_name || 'unit'}"`,
          item.cost_price,
          item.unit_price,
          item.quantity,
          item.reorder_level,
          '"Single Standalone Product"'
        ]);
      }
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_master_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-bold shadow-lg animate-in slide-in-from-top-2 duration-150 ${
          toastMessage.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
            : 'bg-rose-950/90 border-rose-800 text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
            <Boxes className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
            {metrics.totalSKUs}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Total variants & items</span>
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
                placeholder="Search SKU, product name, variant file, or category..."
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
              <span>New Product</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3 w-10 text-center"></th>
                <th className="py-3 px-3">Barcode / Master SKU</th>
                <th className="py-3 px-4">Product Name & Structure</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Cost (Wholesale)</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Margin</th>
                <th className="py-3 px-4 text-center">Inventory Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    {items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
                          <Package className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Items in Inventory</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                          Get started by registering standalone products or master product folders with variant files.
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
                  const hasVariants = Boolean(item.variants && item.variants.length > 0);
                  const isWeighted = item.item_type === 'weighted';
                  const isExpanded = expandedItemIds[item.id] ?? false;

                  // Compute pricing/cost ranges for folder items
                  let minCost = item.cost_price;
                  let maxCost = item.cost_price;
                  let minPrice = item.unit_price;
                  let maxPrice = item.unit_price;
                  let isOutOfStock = item.quantity <= 0;
                  let isLowStock = item.quantity > 0 && item.quantity <= item.reorder_level;
                  let minMargin = '0';
                  let maxMargin = '0';

                  if (hasVariants) {
                    const costs = item.variants!.map(v => Number(v.cost_price) || 0);
                    const prices = item.variants!.map(v => Number(v.unit_price) || 0);
                    minCost = Math.min(...costs);
                    maxCost = Math.max(...costs);
                    minPrice = Math.min(...prices);
                    maxPrice = Math.max(...prices);

                    const variantMargins = item.variants!.map(v => {
                      const p = Number(v.unit_price) || 0;
                      const c = Number(v.cost_price) || 0;
                      return p > 0 ? ((p - c) / p) * 100 : 0;
                    });
                    minMargin = Math.min(...variantMargins).toFixed(0);
                    maxMargin = Math.max(...variantMargins).toFixed(0);

                    isOutOfStock = item.variants!.every(v => (v.quantity ?? 0) <= 0);
                    isLowStock = item.variants!.some(v => (v.quantity ?? 0) > 0 && (v.quantity ?? 0) <= (v.reorder_level ?? 5));
                  }

                  const singleMargin = item.unit_price > 0 
                    ? (((item.unit_price - item.cost_price) / item.unit_price) * 100).toFixed(0) 
                    : '0';

                  return (
                    <React.Fragment key={item.id}>
                      {/* Main Product Row */}
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        {/* Expand / Collapse Icon for Variant Folders */}
                        <td className="py-3 px-3 text-center">
                          {hasVariants ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(item.id)}
                              className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                              title={isExpanded ? 'Collapse variant options' : 'Expand variant options'}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" />
                          )}
                        </td>

                        {/* Barcode / SKU */}
                        <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {item.item_number}
                        </td>

                        {/* Product Title */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {hasVariants ? <Layers className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                            </div>

                            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                              {item.name}
                            </span>

                            {hasVariants ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                                <Layers className="w-3 h-3 opacity-75" />
                                <span>{item.variants?.length} Options</span>
                              </span>
                            ) : isWeighted ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                                <Scale className="w-3 h-3" />
                                <span>Rashan / Weight</span>
                              </span>
                            ) : null}
                          </div>

                          {/* Variant Pills Quick Overview */}
                          {hasVariants && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {item.variants?.map(v => {
                                const isVOut = (v.quantity ?? 0) <= 0;
                                const isVLow = !isVOut && (v.quantity ?? 0) <= (v.reorder_level ?? 5);

                                return (
                                  <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => handleOpenAdjustModal(item, v.id)}
                                    className={`text-[10px] px-2 py-0.5 rounded-md font-mono flex items-center gap-1.5 border transition-all hover:scale-105 active:scale-95 ${
                                      isVOut
                                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800 font-bold'
                                        : isVLow
                                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 font-bold'
                                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700'
                                    }`}
                                    title={`Click to adjust stock for ${v.name}: ${v.quantity ?? 0} in stock. Price: ${config.currency_symbol}${v.unit_price}`}
                                  >
                                    <FileText className="w-2.5 h-2.5 opacity-70" />
                                    <span className="font-semibold">{v.name}:</span>
                                    <span className="font-black underline">{v.quantity ?? 0}</span>
                                    <span className="text-slate-400 dark:text-slate-500 font-normal">({config.currency_symbol}{v.unit_price})</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {item.description && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-xs mt-0.5">{item.description}</div>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                            {item.category}
                          </span>
                        </td>

                        {/* Cost Price */}
                        <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400 font-medium">
                          {hasVariants ? (
                            minCost === maxCost ? (
                              <span>{config.currency_symbol}{minCost.toFixed(2)}</span>
                            ) : (
                              <span>{config.currency_symbol}{minCost.toFixed(2)} – {config.currency_symbol}{maxCost.toFixed(2)}</span>
                            )
                          ) : (
                            <span>{config.currency_symbol}{item.cost_price.toFixed(2)}</span>
                          )}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {hasVariants ? (
                            minPrice === maxPrice ? (
                              <span>{config.currency_symbol}{minPrice.toFixed(2)}</span>
                            ) : (
                              <span>{config.currency_symbol}{minPrice.toFixed(2)} – {config.currency_symbol}{maxPrice.toFixed(2)}</span>
                            )
                          ) : (
                            <span>
                              {config.currency_symbol}{item.unit_price.toFixed(2)}
                              {isWeighted && <span className="text-[10px] font-normal text-slate-400"> /{item.unit_name || 'kg'}</span>}
                            </span>
                          )}
                        </td>

                        {/* Margin */}
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {hasVariants ? (
                            minMargin === maxMargin ? (
                              <span>{minMargin}%</span>
                            ) : (
                              <span>{minMargin}% – {maxMargin}%</span>
                            )
                          ) : (
                            <span>{singleMargin}%</span>
                          )}
                        </td>

                        {/* Stock Quantity */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center gap-0.5">
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
                            {hasVariants && (
                              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold">
                                Total across {item.variants?.length} files
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenAdjustModal(item)}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                              title="Adjust Stock Inventory"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                              title="Edit Product / Folder"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmItem(item)}
                              className="p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title="Delete Product / Folder"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Sub-Table for Variant Files */}
                      {hasVariants && isExpanded && (
                        <tr className="bg-slate-50/80 dark:bg-slate-850/60 border-y border-slate-200 dark:border-slate-800">
                          <td colSpan={9} className="p-4 pl-12">
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Folder className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                                    Files inside "{item.name}" Folder ({item.variants?.length} variants)
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(item)}
                                  className="text-[11px] text-slate-700 dark:text-slate-300 hover:underline font-semibold flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Manage / Add Variant Files</span>
                                </button>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                      <th className="py-2 px-3 text-left">Variant File</th>
                                      <th className="py-2 px-3 text-left">Barcode / SKU</th>
                                      <th className="py-2 px-3 text-right">Cost Price</th>
                                      <th className="py-2 px-3 text-right">Retail Rate</th>
                                      <th className="py-2 px-3 text-right">Margin</th>
                                      <th className="py-2 px-3 text-center">Stock Count</th>
                                      <th className="py-2 px-3 text-center">Stock Alert</th>
                                      <th className="py-2 px-3 text-right">Quick Adjust</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                                    {item.variants!.map(v => {
                                      const vMargin = v.unit_price > 0 
                                        ? (((v.unit_price - (v.cost_price || 0)) / v.unit_price) * 100).toFixed(0) 
                                        : '0';
                                      const isVOut = (v.quantity ?? 0) <= 0;
                                      const isVLow = !isVOut && (v.quantity ?? 0) <= (v.reorder_level ?? 5);

                                      return (
                                        <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                            <FileText className="w-3 h-3 opacity-70" />
                                            <span>{v.name}</span>
                                          </td>
                                          <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                                            {v.item_number}
                                          </td>
                                          <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                                            {config.currency_symbol}{(v.cost_price || 0).toFixed(2)}
                                          </td>
                                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                            {config.currency_symbol}{v.unit_price.toFixed(2)}
                                          </td>
                                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                            {vMargin}%
                                          </td>
                                          <td className="py-2.5 px-3 text-center font-mono">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                              isVOut
                                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                                : isVLow
                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                                            }`}>
                                              {v.quantity ?? 0} {item.unit_name || 'units'}
                                            </span>
                                          </td>
                                          <td className="py-2.5 px-3 text-center text-[10px] text-slate-500 dark:text-slate-400">
                                            Alert at ≤ {v.reorder_level ?? 5} units
                                          </td>
                                          <td className="py-2.5 px-3 text-right">
                                            <button
                                              type="button"
                                              onClick={() => handleOpenAdjustModal(item, v.id)}
                                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-700 transition-colors"
                                            >
                                              Adjust Qty
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="bg-slate-900 dark:bg-slate-950 px-5 py-3.5 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                {productStructureMode === 'variants' ? (
                  <Folder className="w-4 h-4 text-sky-400" />
                ) : (
                  <Package className="w-4 h-4 text-sky-400" />
                )}
                <span className="font-bold text-sm">
                  {editingItemId 
                    ? (productStructureMode === 'variants' ? 'Edit Product Folder with Variants' : 'Edit Single Product')
                    : (productStructureMode === 'variants' ? 'Add New Product Folder with Variants' : 'Add Single Standalone Product')}
                </span>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Product Architecture Selector (Single Item vs Master Folder with Variants) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Product Architecture / Structure
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSwitchStructureMode('single')}
                    className={`p-3.5 rounded-xl border text-left text-xs transition-all flex items-start gap-3 cursor-pointer ${
                      productStructureMode === 'single'
                        ? 'border-sky-600 dark:border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-950 dark:text-sky-100 ring-2 ring-sky-500 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Package className={`w-5 h-5 shrink-0 mt-0.5 ${productStructureMode === 'single' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                    <div>
                      <span className="font-bold block text-sm">Single Standalone Product</span>
                      <span className={`text-[11px] ${productStructureMode === 'single' ? 'text-sky-800 dark:text-sky-300' : 'text-slate-500 dark:text-slate-400'}`}>
                        Has its own single SKU, cost, price, stock count, and stock alert.
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchStructureMode('variants')}
                    className={`p-3.5 rounded-xl border text-left text-xs transition-all flex items-start gap-3 cursor-pointer ${
                      productStructureMode === 'variants'
                        ? 'border-sky-600 dark:border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-950 dark:text-sky-100 ring-2 ring-sky-500 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Folder className={`w-5 h-5 shrink-0 mt-0.5 ${productStructureMode === 'variants' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                    <div>
                      <span className="font-bold block text-sm">📁 Master Product Folder (With Variants)</span>
                      <span className={`text-[11px] ${productStructureMode === 'variants' ? 'text-sky-800 dark:text-sky-300' : 'text-slate-500 dark:text-slate-400'}`}>
                        Folder container. Pricing, cost, stock, and barcodes are managed on each variant file.
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Master Folder Notice */}
              {productStructureMode === 'variants' && (
                <div className="p-3.5 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-900/60 flex items-start gap-3 text-xs text-sky-950 dark:text-sky-100">
                  <Folder className="w-5 h-5 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
                  <div>
                    <p className="font-bold">Folder Container Mode Active</p>
                    <p className="text-[11px] text-sky-800 dark:text-sky-300 mt-0.5 leading-relaxed">
                      The main product holds the product title, category, and unit type. It has no individual price, cost, or stock limit. Instead, all pricing, wholesale costs, independent stock inventories, barcodes, and stock alerts are defined per variant file below.
                    </p>
                  </div>
                </div>
              )}

              {/* Basic Details: Name, Category, Unit, Type */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {productStructureMode === 'variants' ? 'Product Folder Title *' : 'Item Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder={productStructureMode === 'variants' ? 'e.g. Basmati Rice, Tata Tea Gold, Levi\'s 501' : 'e.g. 500g Classic Salt'}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Category *
                    </label>
                    <CategoryCombobox
                      value={formData.category}
                      onChange={cat => setFormData({ ...formData, category: cat })}
                      existingCategories={categories}
                      placeholder="Select category..."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {productStructureMode === 'variants' ? 'Master Folder Barcode / SKU Prefix' : 'Barcode / SKU *'}
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
                      Base Measurement Unit
                    </label>
                    <select
                      value={formData.unit_name}
                      onChange={e => setFormData({ ...formData, unit_name: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    >
                      <option value="unit">unit / pcs</option>
                      <option value="pack">pack / packet</option>
                      <option value="box">box</option>
                      <option value="bottle">bottle</option>
                      <option value="jar">jar</option>
                      <option value="kg">kg (Kilograms)</option>
                      <option value="g">g (Grams)</option>
                      <option value="ltr">ltr (Litres)</option>
                      <option value="ml">ml (Millilitres)</option>
                      <option value="dozen">dozen</option>
                      <option value="meter">meter</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Pricing Format
                    </label>
                    <select
                      value={formData.item_type}
                      onChange={e => setFormData({ ...formData, item_type: e.target.value as ItemType })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    >
                      <option value="standard">Standard Fixed Unit</option>
                      <option value="weighted">Weighed / Rashan Loose</option>
                      <option value="open_price">Open Price</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SINGLE PRODUCT PRICING & STOCK CONTROLS */}
              {productStructureMode === 'single' && (
                <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Standalone Product Inventory & Pricing
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Cost Price ({config.currency_symbol}) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required={productStructureMode === 'single'}
                        value={formData.cost_price}
                        onChange={e => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Selling Price ({config.currency_symbol}) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required={productStructureMode === 'single'}
                        value={formData.unit_price}
                        onChange={e => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-sky-500 focus:outline-none text-sky-600 dark:text-sky-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        In-Stock Quantity *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step={formData.item_type === 'weighted' ? '0.1' : '1'}
                        required={productStructureMode === 'single'}
                        value={formData.quantity}
                        onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Low Stock Alert At *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required={productStructureMode === 'single'}
                        value={formData.reorder_level}
                        onChange={e => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MASTER FOLDER VARIANT FILES SECTION */}
              {productStructureMode === 'variants' && (
                <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                  {/* Variant Header & Preset Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Variant Files ({formData.variants.length} Files in this Folder)
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          Each file has independent Barcode, Cost, Price, Stock & Reorder Alert
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-1.5">
                      {formData.variants.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const val = prompt('Enter in-stock count to apply to all variant files:', '10');
                            if (val !== null && !isNaN(parseInt(val))) {
                              handleSetAllVariantsStock(parseInt(val));
                            }
                          }}
                          className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 rounded text-[11px] font-semibold"
                          title="Set the same stock count for all variants"
                        >
                          Bulk Stock
                        </button>
                      )}

                      {/* Weight Presets */}
                      <button
                        type="button"
                        onClick={() => {
                          const baseSku = formData.item_number || 'SKU';
                          setFormData(prev => ({
                            ...prev,
                            variants: [
                              { id: 'var-' + Date.now() + '-1', name: '250g Pack', item_number: `${baseSku}-250G`, cost_price: 2.5, unit_price: 5.0, quantity: 15, reorder_level: 5 },
                              { id: 'var-' + Date.now() + '-2', name: '500g Pack', item_number: `${baseSku}-500G`, cost_price: 4.8, unit_price: 9.5, quantity: 20, reorder_level: 5 },
                              { id: 'var-' + Date.now() + '-3', name: '1kg Bag', item_number: `${baseSku}-1KG`, cost_price: 9.0, unit_price: 18.0, quantity: 12, reorder_level: 4 },
                              { id: 'var-' + Date.now() + '-4', name: '5kg Family Jar', item_number: `${baseSku}-5KG`, cost_price: 42.0, unit_price: 80.0, quantity: 6, reorder_level: 2 },
                            ]
                          }));
                        }}
                        className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 rounded text-[11px] font-semibold"
                      >
                        + Weight Presets
                      </button>

                      {/* Size Presets */}
                      <button
                        type="button"
                        onClick={() => {
                          const baseSku = formData.item_number || 'SKU';
                          setFormData(prev => ({
                            ...prev,
                            variants: [
                              { id: 'var-' + Date.now() + '-1', name: 'Small', item_number: `${baseSku}-S`, cost_price: 5.0, unit_price: 10.0, quantity: 10, reorder_level: 4 },
                              { id: 'var-' + Date.now() + '-2', name: 'Medium', item_number: `${baseSku}-M`, cost_price: 6.0, unit_price: 12.0, quantity: 15, reorder_level: 5 },
                              { id: 'var-' + Date.now() + '-3', name: 'Large', item_number: `${baseSku}-L`, cost_price: 7.0, unit_price: 14.0, quantity: 10, reorder_level: 4 },
                              { id: 'var-' + Date.now() + '-4', name: 'XL Extra Large', item_number: `${baseSku}-XL`, cost_price: 8.0, unit_price: 16.0, quantity: 8, reorder_level: 3 },
                            ]
                          }));
                        }}
                        className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 rounded text-[11px] font-semibold"
                      >
                        + Size Presets
                      </button>

                      <button
                        type="button"
                        onClick={handleAddVariant}
                        className="flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-xs font-semibold shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Variant File</span>
                      </button>
                    </div>
                  </div>

                  {/* Variant Files List */}
                  {formData.variants.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900">
                      <Folder className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        This Product Folder is Currently Empty
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-3">
                        Click below to add your first variant file with its own price, stock, and barcode.
                      </p>
                      <button
                        type="button"
                        onClick={handleAddVariant}
                        className="inline-flex items-center gap-1 px-4 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-bold shadow-xs hover:bg-slate-800 dark:hover:bg-slate-200"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Variant File</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {formData.variants.map((v, idx) => {
                        const marginPercent = v.unit_price > 0 
                          ? (((v.unit_price - (v.cost_price || 0)) / v.unit_price) * 100).toFixed(0) 
                          : '0';

                        return (
                          <div 
                            key={v.id || idx} 
                            className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                              <div className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 opacity-70" />
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  File #{idx + 1}: <span className="font-mono text-slate-800 dark:text-slate-200">{v.name || 'Untitled Variant'}</span>
                                </span>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                                  {marginPercent}% Margin
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(idx)}
                                className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors"
                                title="Delete this variant file"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5">
                              {/* Variant Title */}
                              <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                                  Variant Title / Pack *
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. 500g Pack / Large / Red"
                                  value={v.name}
                                  onChange={e => handleUpdateVariant(idx, { name: e.target.value })}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
                                />
                              </div>

                              {/* Barcode / SKU */}
                              <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                                  Variant Barcode / SKU *
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder={`${formData.item_number || 'SKU'}-V${idx + 1}`}
                                  value={v.item_number || ''}
                                  onChange={e => handleUpdateVariant(idx, { item_number: e.target.value })}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
                                />
                              </div>

                              {/* Wholesale Cost */}
                              <div>
                                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                                  Cost ({config.currency_symbol}) *
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  required
                                  value={v.cost_price ?? 0}
                                  onChange={e => handleUpdateVariant(idx, { cost_price: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
                                />
                              </div>

                              {/* Retail Price */}
                              <div>
                                <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                                  Price ({config.currency_symbol}) *
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  required
                                  value={v.unit_price}
                                  onChange={e => handleUpdateVariant(idx, { unit_price: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 pt-1">
                              {/* Stock Quantity */}
                              <div>
                                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                                  In-Stock Count ({formData.unit_name})
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={v.quantity ?? 0}
                                  onChange={e => handleUpdateVariant(idx, { quantity: parseInt(e.target.value) || 0 })}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
                                />
                              </div>

                              {/* Reorder Level */}
                              <div>
                                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                                  Stock Alert Threshold (Alert if ≤)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={v.reorder_level ?? 5}
                                  onChange={e => handleUpdateVariant(idx, { reorder_level: parseInt(e.target.value) || 0 })}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Aggregate Summary Box */}
                  {formData.variants.length > 0 && (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Total Combined Stock</span>
                          <span className="font-bold font-mono text-slate-900 dark:text-white">
                            {formData.variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0)} {formData.unit_name}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Price Range</span>
                          <span className="font-bold font-mono text-slate-900 dark:text-white">
                            {config.currency_symbol}{Math.min(...formData.variants.map(v => Number(v.unit_price) || 0)).toFixed(2)} – {config.currency_symbol}{Math.max(...formData.variants.map(v => Number(v.unit_price) || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        ✓ {formData.variants.length} Variant Files ready to save
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Product Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Product Description / Notes (Optional)
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
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingItemId ? 'Update Product' : 'Save Product to Inventory'}</span>
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
                <p className="text-xs text-slate-500 dark:text-slate-400">Product:</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{adjustModalItem.name}</p>
                
                {/* Variant Selector in Stock Adjustment */}
                {adjustModalItem.variants && adjustModalItem.variants.length > 0 && (
                  <div className="mt-2.5">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Select Variant File to Adjust:
                    </label>
                    <select
                      value={selectedAdjustVariantId}
                      onChange={e => setSelectedAdjustVariantId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    >
                      <option value="all">All Variant Files (Equal Adjustment)</option>
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

      {/* Delete Item Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete {deleteConfirmItem.variants && deleteConfirmItem.variants.length > 0 ? 'Product Folder' : 'Product'}?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-slate-900 dark:text-white">{deleteConfirmItem.name}</span> (<span className="font-mono">{deleteConfirmItem.item_number}</span>) from your inventory catalogue?
                {deleteConfirmItem.variants && deleteConfirmItem.variants.length > 0 && (
                  <span className="block mt-1 font-semibold text-rose-600 dark:text-rose-400">
                    This will delete all {deleteConfirmItem.variants.length} variant files inside this folder.
                  </span>
                )}
              </p>

              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Category:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">{deleteConfirmItem.category}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Total Combined Stock:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{deleteConfirmItem.quantity} units</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmItem(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteItem}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  Delete Product Folder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
