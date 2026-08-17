import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  Phone, 
  MapPin, 
  Search, 
  X,
  BookOpen,
  ArrowDownLeft,
  CheckCircle2,
  Send,
  CheckCircle,
  Truck
} from 'lucide-react';
import { Supplier, StoreConfig } from '../types/pos';
import { OkCreditLedgerModal } from './OkCreditLedgerModal';
import { searchSuppliers } from '../utils/fuzzySearch';

interface SuppliersManagerProps {
  suppliers: Supplier[];
  config?: StoreConfig;
  currentUserName?: string;
  onAddSupplier: (s: Omit<Supplier, 'id'>) => Supplier;
  onUpdateSupplier: (id: string, s: Partial<Supplier>) => void;
  onDeleteSupplier: (id: string) => void;
}

export const SuppliersManager: React.FC<SuppliersManagerProps> = ({
  suppliers,
  config = {
    company_name: 'Nexus POS',
    currency_symbol: '$',
    enable_sound: true,
  } as StoreConfig,
  currentUserName = 'Staff Member',
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'due_only' | 'settled'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'highest_due'>('highest_due');
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);

  // OkCredit Ledger Modal State
  const [activeLedgerSupplier, setActiveLedgerSupplier] = useState<Supplier | null>(null);

  // Custom Delete Supplier Confirmation Modal State
  const [deleteConfirmSupplier, setDeleteConfirmSupplier] = useState<Supplier | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const [formData, setFormData] = useState<{
    company_name: string;
    agency_name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    address_1: string;
    city: string;
    account_number: string;
    credit_limit: number;
    credit_balance: number;
  }>({
    company_name: '',
    agency_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address_1: '',
    city: '',
    account_number: '',
    credit_limit: 10000,
    credit_balance: 0,
  });

  // Calculate totals for OkCredit Top Bar
  const totalPayableAmount = useMemo(() => {
    return suppliers.reduce((acc, s) => acc + (s.credit_balance || 0), 0);
  }, [suppliers]);

  const suppliersWithDueCount = useMemo(() => {
    return suppliers.filter(s => (s.credit_balance || 0) > 0).length;
  }, [suppliers]);

  const settledSuppliersCount = useMemo(() => {
    return suppliers.filter(s => (!s.credit_balance || s.credit_balance <= 0)).length;
  }, [suppliers]);

  // Filtered & Sorted Supplier List
  const filteredSuppliers = useMemo(() => {
    const searchResults = searchSuppliers(suppliers, searchQuery);
    
    let list = searchResults.filter(s => {
      const bal = s.credit_balance || 0;
      if (balanceFilter === 'due_only') return bal > 0;
      if (balanceFilter === 'settled') return bal <= 0;
      return true;
    });

    if (sortBy === 'highest_due') {
      list.sort((a, b) => (b.credit_balance || 0) - (a.credit_balance || 0));
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.company_name.localeCompare(b.company_name));
    }

    return list;
  }, [suppliers, searchQuery, balanceFilter, sortBy]);

  const handleOpenAdd = () => {
    setFormData({
      company_name: '',
      agency_name: '',
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      address_1: '',
      city: '',
      account_number: 'SUP-' + Math.floor(1000 + Math.random() * 9000),
      credit_limit: 10000,
      credit_balance: 0,
    });
    setEditingSupplierId(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setFormData({
      company_name: s.company_name,
      agency_name: s.agency_name || '',
      first_name: s.first_name,
      last_name: s.last_name,
      email: s.email || '',
      phone_number: s.phone_number || '',
      address_1: s.address_1 || '',
      city: s.city || '',
      account_number: s.account_number || '',
      credit_limit: s.credit_limit || 10000,
      credit_balance: s.credit_balance || 0,
    });
    setEditingSupplierId(s.id);
    setIsAddEditModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name.trim()) {
      showToast('Company name is required.', 'error');
      return;
    }

    if (editingSupplierId) {
      onUpdateSupplier(editingSupplierId, formData);
      showToast(`Updated supplier: ${formData.company_name}`);
      if (activeLedgerSupplier && activeLedgerSupplier.id === editingSupplierId) {
        setActiveLedgerSupplier({ ...activeLedgerSupplier, ...formData });
      }
    } else {
      onAddSupplier(formData);
      showToast(`Added supplier: ${formData.company_name}`);
    }

    setIsAddEditModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmSupplier) return;
    const name = deleteConfirmSupplier.company_name;
    onDeleteSupplier(deleteConfirmSupplier.id);
    if (activeLedgerSupplier && activeLedgerSupplier.id === deleteConfirmSupplier.id) {
      setActiveLedgerSupplier(null);
    }
    setDeleteConfirmSupplier(null);
    showToast(`Deleted supplier: ${name}`);
  };

  // Quick WhatsApp Statement to Vendor
  const handleQuickWhatsAppShare = (s: Supplier) => {
    const due = s.credit_balance || 0;
    const storeBrand = config.company_name || 'Nexus POS';
    const text = `*🧾 ${storeBrand.toUpperCase()} - SUPPLIER LEDGER INQUIRY*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Vendor: *${s.company_name}*\n` +
      (s.agency_name ? `Agency: ${s.agency_name}\n` : '') +
      `Current Payable Balance: *${config.currency_symbol}${due.toFixed(2)}*\n\n` +
      `Shared from Nexus POS Bahi Khata.`;

    const cleaned = (s.phone_number || '').replace(/[^\d+]/g, '');
    const url = cleaned 
      ? `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
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
            className="text-slate-400 hover:text-white ml-3 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* OkCredit Top Summary Banner for Suppliers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* You Will Pay (Dene Hain) */}
        <div className="p-4 bg-rose-50/70 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              <ArrowDownLeft className="w-4 h-4" />
              <span>You Will Pay (Dene Hain)</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1">
              {config.currency_symbol}{totalPayableAmount.toFixed(2)}
            </div>
            <div className="text-[11px] font-semibold text-rose-700/80 dark:text-rose-300/80 mt-0.5">
              Across {suppliersWithDueCount} vendor accounts
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center font-bold">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        {/* Total Settled Suppliers */}
        <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settled Suppliers</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {settledSuppliersCount} <span className="text-sm font-sans font-bold text-slate-500">Vendors</span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
              Zero pending payable / cleared
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Supplier Directory Action */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Vyapari</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">{suppliers.length}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Nexus POS
            </span>
          </div>

          <button
            onClick={handleOpenAdd}
            className="mt-3 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Supplier (Vyapari)</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search vendor company, contact name, phone, city..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-slate-400 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setBalanceFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              balanceFilter === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All ({suppliers.length})
          </button>

          <button
            onClick={() => setBalanceFilter('due_only')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              balanceFilter === 'due_only'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Payable / Due Only ({suppliersWithDueCount})</span>
          </button>

          <button
            onClick={() => setBalanceFilter('settled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              balanceFilter === 'settled'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Settled ({settledSuppliersCount})</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1" />

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="highest_due">Sort: Highest Payable</option>
            <option value="name">Sort: Company Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* OkCredit Supplier Ledger Cards / List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredSuppliers.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center max-w-md mx-auto p-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-3">
              <Building2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {suppliers.length === 0 ? 'No Suppliers Added Yet' : 'No Suppliers Found'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 text-center">
              {suppliers.length === 0 
                ? 'Add your wholesale vendors, distributors, and supplier accounts to track digital purchase khata and payments.'
                : 'No suppliers match your current search query or active filter.'}
            </p>
            {suppliers.length === 0 ? (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Supplier</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setBalanceFilter('all');
                }}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-bold"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredSuppliers.map(supp => {
              const due = supp.credit_balance || 0;
              const hasDue = due > 0;
              const initials = supp.company_name.slice(0, 2).toUpperCase();

              return (
                <div
                  key={supp.id}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  {/* Left: Avatar & Vendor Details */}
                  <div 
                    onClick={() => setActiveLedgerSupplier(supp)}
                    className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                  >
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                      hasDue 
                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                        : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                    }`}>
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {supp.company_name}
                        </h3>
                        {supp.account_number && (
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {supp.account_number}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {supp.phone_number && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{supp.phone_number}</span>
                          </div>
                        )}
                        {supp.first_name && (
                          <span>• Contact: {supp.first_name} {supp.last_name}</span>
                        )}
                        {supp.agency_name && (
                          <span>• {supp.agency_name}</span>
                        )}
                        {supp.city && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {supp.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: OkCredit Balance Badge & Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    {/* OkCredit Balance Pill */}
                    <div 
                      onClick={() => setActiveLedgerSupplier(supp)}
                      className="cursor-pointer text-left sm:text-right"
                    >
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-black text-xs sm:text-sm border shadow-2xs ${
                        hasDue
                          ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                          : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                      }`}>
                        {hasDue ? (
                          <>
                            <ArrowDownLeft className="w-3.5 h-3.5 text-rose-600" />
                            <span>{config.currency_symbol}{due.toFixed(2)} PAYABLE</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{config.currency_symbol}0.00 CLEARED</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      {/* WhatsApp Statement */}
                      {supp.phone_number && (
                        <button
                          onClick={() => handleQuickWhatsAppShare(supp)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                          title="Share WhatsApp Khata Statement"
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="hidden md:inline">Statement</span>
                        </button>
                      )}

                      {/* Open Bahi Khata Button */}
                      <button
                        onClick={() => setActiveLedgerSupplier(supp)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        title="Open OkCredit Supplier Khata"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Khata</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEdit(supp)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                        title="Edit Supplier"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeleteConfirmSupplier(supp)}
                        className="p-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl transition-colors cursor-pointer"
                        title="Delete Supplier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* OkCredit Digital Ledger Modal for Supplier */}
      {activeLedgerSupplier && (
        <OkCreditLedgerModal
          entityType="supplier"
          entity={activeLedgerSupplier}
          config={config}
          currentUserName={currentUserName}
          isOpen={true}
          onClose={() => setActiveLedgerSupplier(null)}
          onUpdated={updated => {
            const casted = updated as Supplier;
            onUpdateSupplier(casted.id, casted);
            setActiveLedgerSupplier(casted);
            showToast(`Khata updated for ${casted.company_name}`);
          }}
        />
      )}

      {/* Add / Edit Supplier Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 dark:bg-slate-950 px-5 py-4 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    {editingSupplierId ? 'Edit Supplier Details' : 'Add New Supplier (Vyapari)'}
                  </h3>
                  <span className="text-xs text-slate-400">Nexus POS Vendor Directory</span>
                </div>
              </div>
              <button 
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Company / Firm Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="e.g. Royal FMCG Distributors"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Agency / Brand Alias
                  </label>
                  <input
                    type="text"
                    value={formData.agency_name}
                    onChange={e => setFormData({ ...formData, agency_name: e.target.value })}
                    placeholder="e.g. Nestle Wholesale Agency"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="e.g. Sunil Verma"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="vendor@distributors.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Account / Vendor Code
                  </label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                    placeholder="SUP-1001"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Credit Limit with Vendor ({config.currency_symbol})
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.credit_limit}
                    onChange={e => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Payable Balance ({config.currency_symbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.credit_balance}
                    onChange={e => setFormData({ ...formData, credit_balance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.address_1}
                    onChange={e => setFormData({ ...formData, address_1: e.target.value })}
                    placeholder="Warehouse 4, Industrial Area"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    City / Region
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-md transition-colors"
                >
                  {editingSupplierId ? 'Update Supplier' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmSupplier && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Delete Supplier Account?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong className="text-slate-900 dark:text-white">{deleteConfirmSupplier.company_name}</strong> from Nexus POS?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmSupplier(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md"
              >
                Delete Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
