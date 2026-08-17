import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2,
  Phone, 
  Award, 
  X,
  CreditCard,
  CheckCircle,
  ArrowDownLeft,
  BookOpen,
  Send,
  CheckCircle2
} from 'lucide-react';
import { Customer, Sale, StoreConfig } from '../types/pos';
import { OkCreditLedgerModal } from './OkCreditLedgerModal';
import { searchCustomers } from '../utils/fuzzySearch';

interface CustomersManagerProps {
  customers: Customer[];
  sales: Sale[];
  config: StoreConfig;
  currentUserName?: string;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'points' | 'total_spent'>) => Customer;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => void;
  onDeleteCustomer: (id: string) => void;
}

export const CustomersManager: React.FC<CustomersManagerProps> = ({
  customers,
  sales,
  config,
  currentUserName = 'Staff Member',
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'due_only' | 'settled'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'highest_due' | 'recent'>('highest_due');
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  // OkCredit Ledger Modal State
  const [activeLedgerCustomer, setActiveLedgerCustomer] = useState<Customer | null>(null);

  // Custom Delete Customer Confirmation Modal State
  const [deleteConfirmCust, setDeleteConfirmCust] = useState<Customer | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const [formData, setFormData] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    address_1: string;
    city: string;
    company_name: string;
    account_number: string;
    credit_limit: number;
    credit_balance: number;
    comments: string;
  }>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address_1: '',
    city: '',
    company_name: '',
    account_number: '',
    credit_limit: 500,
    credit_balance: 0,
    comments: '',
  });

  // Calculate totals for OkCredit Top Bar
  const totalDueAmount = useMemo(() => {
    return customers.reduce((acc, c) => acc + (c.credit_balance || 0), 0);
  }, [customers]);

  const customersWithDueCount = useMemo(() => {
    return customers.filter(c => (c.credit_balance || 0) > 0).length;
  }, [customers]);

  const settledCustomersCount = useMemo(() => {
    return customers.filter(c => (!c.credit_balance || c.credit_balance <= 0)).length;
  }, [customers]);

  // Filtered & Sorted Customer List
  const filteredCustomers = useMemo(() => {
    const searchResults = searchCustomers(customers, searchQuery);
    
    let list = searchResults.filter(c => {
      const bal = c.credit_balance || 0;
      if (balanceFilter === 'due_only') return bal > 0;
      if (balanceFilter === 'settled') return bal <= 0;
      return true;
    });

    if (sortBy === 'highest_due') {
      list.sort((a, b) => (b.credit_balance || 0) - (a.credit_balance || 0));
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.first_name.localeCompare(b.first_name));
    }

    return list;
  }, [customers, searchQuery, balanceFilter, sortBy]);

  const handleOpenAdd = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      address_1: '',
      city: '',
      company_name: '',
      account_number: 'ACC-' + Math.floor(1000 + Math.random() * 9000),
      credit_limit: 1000,
      credit_balance: 0,
      comments: '',
    });
    setEditingCustomerId(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setFormData({
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email || '',
      phone_number: c.phone_number || '',
      address_1: c.address_1 || '',
      city: c.city || '',
      company_name: c.company_name || '',
      account_number: c.account_number || '',
      credit_limit: c.credit_limit || 1000,
      credit_balance: c.credit_balance || 0,
      comments: c.comments || '',
    });
    setEditingCustomerId(c.id);
    setIsAddEditModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name.trim()) {
      showToast('First name is required.', 'error');
      return;
    }

    if (editingCustomerId) {
      onUpdateCustomer(editingCustomerId, formData);
      showToast(`Updated customer: ${formData.first_name} ${formData.last_name}`);
      if (activeLedgerCustomer && activeLedgerCustomer.id === editingCustomerId) {
        setActiveLedgerCustomer({ ...activeLedgerCustomer, ...formData });
      }
    } else {
      onAddCustomer(formData);
      showToast(`Added customer: ${formData.first_name} ${formData.last_name}`);
    }

    setIsAddEditModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmCust) return;
    const name = `${deleteConfirmCust.first_name} ${deleteConfirmCust.last_name}`.trim();
    onDeleteCustomer(deleteConfirmCust.id);
    if (activeLedgerCustomer && activeLedgerCustomer.id === deleteConfirmCust.id) {
      setActiveLedgerCustomer(null);
    }
    setDeleteConfirmCust(null);
    showToast(`Deleted customer: ${name}`);
  };

  // Quick Direct WhatsApp Reminder
  const handleQuickWhatsAppReminder = (c: Customer) => {
    const due = c.credit_balance || 0;
    const storeBrand = config.company_name || 'Nexus POS';
    const text = `*🧾 ${storeBrand.toUpperCase()} - PAYMENT REMINDER*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Dear ${c.first_name} ${c.last_name},\n` +
      `Your outstanding balance at *${storeBrand}* is *${config.currency_symbol}${due.toFixed(2)}*.\n\n` +
      (config.upi_id ? `📲 *Pay via UPI:* ${config.upi_id}\n\n` : '') +
      `Thank you for shopping with us! 🙏`;

    const cleaned = (c.phone_number || '').replace(/[^\d+]/g, '');
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

      {/* OkCredit Top Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* You Will Get (Lene Hain) */}
        <div className="p-4 bg-rose-50/70 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              <ArrowDownLeft className="w-4 h-4" />
              <span>You Will Get (Lene Hain)</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1">
              {config.currency_symbol}{totalDueAmount.toFixed(2)}
            </div>
            <div className="text-[11px] font-semibold text-rose-700/80 dark:text-rose-300/80 mt-0.5">
              Across {customersWithDueCount} customer accounts
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Total Settled Customers */}
        <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settled Customers</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {settledCustomersCount} <span className="text-sm font-sans font-bold text-slate-500">Accounts</span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
              Zero pending due / cleared
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Customer Directory Action */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Grahak</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">{customers.length}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
              Nexus POS
            </span>
          </div>

          <button
            onClick={handleOpenAdd}
            className="mt-3 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Customer (Grahak)</span>
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
            placeholder="Search by customer name, mobile, account..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
            All ({customers.length})
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
            <span>Udhar / Due Only ({customersWithDueCount})</span>
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
            <span>Settled ({settledCustomersCount})</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1" />

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="highest_due">Sort: Highest Due</option>
            <option value="name">Sort: Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* OkCredit Customer Ledger Cards / List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center max-w-md mx-auto p-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {customers.length === 0 ? 'No Customers Added Yet' : 'No Customers Found'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 text-center">
              {customers.length === 0 
                ? 'Create customer accounts to track digital bahi khata, record udhar (Maine Diya) and payments (Maine Liya).'
                : 'No customers match your current search query or active filter.'}
            </p>
            {customers.length === 0 ? (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Customer</span>
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
            {filteredCustomers.map(cust => {
              const due = cust.credit_balance || 0;
              const hasDue = due > 0;
              const initials = `${cust.first_name.slice(0, 1)}${cust.last_name ? cust.last_name.slice(0, 1) : ''}`.toUpperCase();

              return (
                <div
                  key={cust.id}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  {/* Left: Avatar & Contact Details */}
                  <div 
                    onClick={() => setActiveLedgerCustomer(cust)}
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
                          {cust.first_name} {cust.last_name}
                        </h3>
                        {cust.account_number && (
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {cust.account_number}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {cust.phone_number && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{cust.phone_number}</span>
                          </div>
                        )}
                        {cust.company_name && (
                          <span>• {cust.company_name}</span>
                        )}
                        {config.enable_loyalty !== false && cust.points > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                            <Award className="w-3 h-3" />
                            {cust.points} pts
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: OkCredit Balance Badge & Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    {/* OkCredit Balance Pill */}
                    <div 
                      onClick={() => setActiveLedgerCustomer(cust)}
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
                            <span>{config.currency_symbol}{due.toFixed(2)} DUE</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{config.currency_symbol}0.00 SETTLED</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      {/* WhatsApp Reminder */}
                      {hasDue && cust.phone_number && (
                        <button
                          onClick={() => handleQuickWhatsAppReminder(cust)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                          title="Send WhatsApp Payment Reminder"
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="hidden md:inline">Reminder</span>
                        </button>
                      )}

                      {/* Open Bahi Khata Button */}
                      <button
                        onClick={() => setActiveLedgerCustomer(cust)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        title="Open OkCredit Bahi Khata"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Khata</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEdit(cust)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                        title="Edit Customer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeleteConfirmCust(cust)}
                        className="p-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl transition-colors cursor-pointer"
                        title="Delete Customer"
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

      {/* OkCredit Digital Ledger Modal */}
      {activeLedgerCustomer && (
        <OkCreditLedgerModal
          entityType="customer"
          entity={activeLedgerCustomer}
          config={config}
          currentUserName={currentUserName}
          sales={sales}
          isOpen={true}
          onClose={() => setActiveLedgerCustomer(null)}
          onUpdated={updated => {
            const casted = updated as Customer;
            onUpdateCustomer(casted.id, casted);
            setActiveLedgerCustomer(casted);
            showToast(`Khata updated for ${casted.first_name} ${casted.last_name}`);
          }}
        />
      )}

      {/* Add / Edit Customer Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 dark:bg-slate-950 px-5 py-4 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    {editingCustomerId ? 'Edit Customer Details' : 'Add New Customer (Grahak)'}
                  </h3>
                  <span className="text-xs text-slate-400">Nexus POS Digital Directory</span>
                </div>
              </div>
              <button 
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="e.g. Ramesh"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="e.g. Sharma"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ramesh@example.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Account / Nickname
                  </label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                    placeholder="ACC-1001"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Company / Firm Name
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Optional firm name"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Credit Limit ({config.currency_symbol})
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
                    Initial Balance ({config.currency_symbol})
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

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Address / City
                </label>
                <input
                  type="text"
                  value={formData.address_1}
                  onChange={e => setFormData({ ...formData, address_1: e.target.value })}
                  placeholder="Street address, city, landmark"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                />
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
                  className="px-5 py-2 rounded-xl text-xs font-black bg-sky-600 hover:bg-sky-700 text-white shadow-md transition-colors"
                >
                  {editingCustomerId ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmCust && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Delete Customer Account?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong className="text-slate-900 dark:text-white">{deleteConfirmCust.first_name} {deleteConfirmCust.last_name}</strong> from Nexus POS?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmCust(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
