import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Phone, 
  Mail, 
  Award, 
  X,
  History,
  CreditCard,
  Share2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Customer, Sale, StoreConfig } from '../types/pos';
import { CustomerCreditStatementModal } from './CustomerCreditStatementModal';

interface CustomersManagerProps {
  customers: Customer[];
  sales: Sale[];
  config: StoreConfig;
  currentUserName?: string;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'points' | 'total_spent'>) => Customer;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => void;
}

export const CustomersManager: React.FC<CustomersManagerProps> = ({
  customers,
  sales,
  config,
  currentUserName = 'Staff Member',
  onAddCustomer,
  onUpdateCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'due_only'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  // History Drawer State
  const [viewHistoryCust, setViewHistoryCust] = useState<Customer | null>(null);

  // Credit Statement Modal State
  const [selectedStatementCust, setSelectedStatementCust] = useState<Customer | null>(null);

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

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return customers.filter(c => {
      if (balanceFilter === 'due_only' && (!c.credit_balance || c.credit_balance <= 0)) {
        return false;
      }
      if (!q) return true;
      return (
        c.first_name.toLowerCase().includes(q) ||
        c.last_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone_number.includes(q) ||
        (c.company_name && c.company_name.toLowerCase().includes(q)) ||
        (c.account_number && c.account_number.toLowerCase().includes(q))
      );
    });
  }, [customers, searchQuery, balanceFilter]);

  const totalDueAmount = useMemo(() => {
    return customers.reduce((acc, c) => acc + (c.credit_balance || 0), 0);
  }, [customers]);

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
      credit_limit: 500,
      credit_balance: 0,
      comments: '',
    });
    setEditingCustomerId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setFormData({
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email,
      phone_number: c.phone_number,
      address_1: c.address_1,
      city: c.city,
      company_name: c.company_name || '',
      account_number: c.account_number || '',
      credit_limit: c.credit_limit || 500,
      credit_balance: c.credit_balance || 0,
      comments: c.comments || '',
    });
    setEditingCustomerId(c.id);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name.trim()) {
      alert('First name is required.');
      return;
    }

    if (editingCustomerId) {
      onUpdateCustomer(editingCustomerId, formData);
    } else {
      onAddCustomer(formData);
    }

    setIsModalOpen(false);
  };

  const customerPurchases = useMemo(() => {
    if (!viewHistoryCust) return [];
    return sales.filter(s => s.customer_id === viewHistoryCust.id);
  }, [sales, viewHistoryCust]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>Customer Directory & Credit CRM</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Client credit accounts, WhatsApp & SMS statement sharing, and loyalty rewards
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Customer</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Customers</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{customers.length}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Total Outstanding Due</span>
            <div className="text-xl font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              {config.currency_symbol}{totalDueAmount.toFixed(2)}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Mobile Sharing Channels</span>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded font-semibold text-[10px]">WhatsApp</span>
              <span className="px-1.5 py-0.5 bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 rounded font-semibold text-[10px]">SMS / Phone</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search, Filter and Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/50 dark:bg-slate-850/50 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search customer name, phone, account, email..."
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBalanceFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                balanceFilter === 'all'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setBalanceFilter('due_only')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                balanceFilter === 'due_only'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>With Due Balance</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Account / Company</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4 text-center">Outstanding Due</th>
                <th className="py-3 px-4 text-center">Credit Limit</th>
                <th className="py-3 px-4 text-center">Loyalty</th>
                <th className="py-3 px-4 text-right">Lifetime Spend</th>
                <th className="py-3 px-4 text-right">Statement & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    No customers match the current filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => {
                  const due = c.credit_balance || 0;
                  const limit = c.credit_limit || 500;
                  const hasDue = due > 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">{c.first_name} {c.last_name}</span>
                        {c.comments && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-xs block">{c.comments}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">{c.company_name || 'Individual'}</span>
                        {c.account_number && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">{c.account_number}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 space-y-0.5">
                        {c.phone_number && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{c.phone_number}</span>
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-500 dark:text-slate-400">{c.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Outstanding Due */}
                      <td className="py-3 px-4 text-center">
                        {hasDue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-full font-mono font-bold text-xs">
                            <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            <span>{config.currency_symbol}{due.toFixed(2)}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-full font-mono font-bold text-[11px]">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            <span>Settled</span>
                          </span>
                        )}
                      </td>

                      {/* Credit Limit */}
                      <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-slate-400">
                        {config.currency_symbol}{limit.toFixed(2)}
                      </td>

                      {/* Loyalty */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 rounded-full text-xs font-bold">
                          <Award className="w-3 h-3 text-amber-500" />
                          <span>{c.points} pts</span>
                        </span>
                      </td>

                      {/* Lifetime Spend */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {config.currency_symbol}{c.total_spent.toFixed(2)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Share Statement Button */}
                          <button
                            onClick={() => setSelectedStatementCust(c)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-lg text-xs font-bold transition-all shadow-2xs"
                            title="Share Statement via WhatsApp / Phone Messages"
                          >
                            <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Statement</span>
                          </button>

                          <button
                            onClick={() => setViewHistoryCust(c)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                            title="Purchase History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-400 rounded-lg transition-colors"
                            title="Edit Customer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
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

      {/* Customer Credit Statement Modal */}
      {selectedStatementCust && (
        <CustomerCreditStatementModal
          customer={selectedStatementCust}
          sales={sales}
          config={config}
          currentUserName={currentUserName}
          onClose={() => setSelectedStatementCust(null)}
          onCustomerUpdated={updated => {
            onUpdateCustomer(updated.id, updated);
            setSelectedStatementCust(updated);
          }}
        />
      )}

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 dark:bg-slate-950 px-5 py-4 text-white flex items-center justify-between border-b border-slate-800">
              <span className="font-bold text-sm">
                {editingCustomerId ? 'Edit Customer & Credit Limit' : 'Add New Customer'}
              </span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="For WhatsApp / SMS"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Company (Optional)</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Credit Limit & Balance Settings */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Credit Limit ({config.currency_symbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.credit_limit}
                    onChange={e => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Due Balance ({config.currency_symbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.credit_balance}
                    onChange={e => setFormData({ ...formData, credit_balance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={formData.address_1}
                    onChange={e => setFormData({ ...formData, address_1: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Customer Notes</label>
                <textarea
                  rows={2}
                  value={formData.comments}
                  onChange={e => setFormData({ ...formData, comments: e.target.value })}
                  placeholder="Preferences, special discounts, notes..."
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Purchase History Modal */}
      {viewHistoryCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 dark:bg-slate-950 px-5 py-3 text-white flex items-center justify-between border-b border-slate-800">
              <span className="font-bold text-sm">
                Purchase History — {viewHistoryCust.first_name} {viewHistoryCust.last_name}
              </span>
              <button onClick={() => setViewHistoryCust(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 max-h-[65vh] overflow-y-auto space-y-3">
              {customerPurchases.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">No previous orders recorded for this customer.</p>
              ) : (
                customerPurchases.map(sale => (
                  <div key={sale.id} className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono font-bold text-xs text-sky-600 dark:text-sky-400">{sale.id}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-2">{new Date(sale.sale_time).toLocaleString()}</span>
                      </div>
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                        {config.currency_symbol}{sale.total.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      {sale.items.map((i, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span>{i.quantity}x {i.name}</span>
                          <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">{config.currency_symbol}{i.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setViewHistoryCust(null)}
                className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
