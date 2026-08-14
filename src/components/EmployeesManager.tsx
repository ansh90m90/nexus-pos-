import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Check, 
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { Employee } from '../types/pos';

interface EmployeesManagerProps {
  employees: Employee[];
  currentUser: Employee;
  onSaveEmployees: (employees: Employee[]) => void;
  onLogout?: () => void;
}

export const EmployeesManager: React.FC<EmployeesManagerProps> = ({
  employees,
  currentUser,
  onSaveEmployees,
  onLogout,
}) => {
  const [activeView, setActiveView] = useState<'list' | 'roles_matrix'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);

  // Custom Delete Modal state (replaces window.confirm / alert)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState<{
    first_name: string;
    last_name: string;
    username: string;
    role: 'admin' | 'manager' | 'cashier';
    pin: string;
    email: string;
    phone_number: string;
    is_active: boolean;
  }>({
    first_name: '',
    last_name: '',
    username: '',
    role: 'cashier',
    pin: '0000',
    email: '',
    phone_number: '',
    is_active: true,
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenAdd = (presetRole?: 'admin' | 'manager' | 'cashier') => {
    const defaultRole = presetRole || 'cashier';
    const defaultPin = defaultRole === 'admin' ? '1234' : defaultRole === 'manager' ? '5678' : '0000';
    
    setFormData({
      first_name: '',
      last_name: '',
      username: '',
      role: defaultRole,
      pin: defaultPin,
      email: '',
      phone_number: '',
      is_active: true,
    });
    setEditingEmpId(null);
    setShowPin(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setFormData({
      first_name: emp.first_name,
      last_name: emp.last_name,
      username: emp.username,
      role: emp.role,
      pin: emp.pin,
      email: emp.email,
      phone_number: emp.phone_number,
      is_active: emp.is_active,
    });
    setEditingEmpId(emp.id);
    setShowPin(false);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name.trim() || !formData.username.trim()) {
      showToast('First name and username are required.', 'error');
      return;
    }
    if (!formData.pin.trim()) {
      showToast('A security PIN/password is required for this role.', 'error');
      return;
    }

    if (editingEmpId) {
      const updated = employees.map(emp => {
        if (emp.id !== editingEmpId) return emp;
        return { ...emp, ...formData };
      });
      onSaveEmployees(updated);
      showToast(`Updated staff account: ${formData.first_name} (${formData.role.toUpperCase()})`);
    } else {
      const newEmp: Employee = {
        ...formData,
        id: 'emp-' + Date.now(),
      };
      onSaveEmployees([...employees, newEmp]);
      showToast(`Added new ${formData.role.toUpperCase()} account: ${formData.first_name}`);
    }

    setIsModalOpen(false);
  };

  const initiateDelete = (emp: Employee) => {
    setDeleteTarget(emp);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    const targetId = deleteTarget.id;
    const targetName = deleteTarget.first_name;
    const targetRole = deleteTarget.role;
    const isDeletingSelf = targetId === currentUser.id;

    // Filter out deleted user
    const updatedEmployees = employees.filter(e => e.id !== targetId);

    // If deleting last employee, create default fallback admin
    if (updatedEmployees.length === 0) {
      const fallbackAdmin: Employee = {
        id: 'emp-fallback-' + Date.now(),
        first_name: 'Admin',
        last_name: 'User',
        username: 'admin',
        role: 'admin',
        pin: '1234',
        email: 'admin@opensourcepos.org',
        phone_number: '555-0100',
        is_active: true,
      };
      updatedEmployees.push(fallbackAdmin);
    }

    onSaveEmployees(updatedEmployees);
    setDeleteTarget(null);

    if (isDeletingSelf) {
      showToast(`Your account (${targetName}) was deleted. Signing out...`);
      if (onLogout) {
        setTimeout(() => {
          onLogout();
        }, 1000);
      }
    } else {
      showToast(`Successfully deleted ${targetName} (${targetRole.toUpperCase()}) role account.`);
    }
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
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
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

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <span>Staff, Role & Permission Management</span>
            </h2>
            <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900 text-[10px] font-bold uppercase">
              Admin Exclusive
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure passwords/PINs, select roles (Admin, Manager, Cashier), assign permissions, and delete role accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setActiveView('list')}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
                activeView === 'list'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Staff Directory ({employees.length})
            </button>
            <button
              onClick={() => setActiveView('roles_matrix')}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1.5 ${
                activeView === 'roles_matrix'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Role Permissions</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>New Staff Member</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Staff Directory Table */}
      {activeView === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Username</th>
                  <th className="py-3.5 px-4">Assigned Role</th>
                  <th className="py-3.5 px-4">Security PIN / Password</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {employees.map(emp => {
                  const isCurrent = emp.id === currentUser.id;
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {emp.first_name} {emp.last_name}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-md text-[10px] font-bold">
                              You (Active)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                        @{emp.username}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                          emp.role === 'admin' 
                            ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900' 
                            : emp.role === 'manager' 
                            ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900' 
                            : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                        }`}>
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-mono">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>••••</span>
                          <span className="text-[10px] text-slate-400">({emp.pin.length} digits)</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">{emp.email || '—'}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">{emp.phone_number || '—'}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 font-bold rounded-full text-[10px] border ${
                          emp.is_active !== false
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                        }`}>
                          {emp.is_active !== false ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1.5 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-400 rounded-lg transition-colors"
                            title="Edit Role & Password"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => initiateDelete(emp)}
                            className="p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-lg transition-colors"
                            title="Delete Role & Employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Role Permissions & Privileges Matrix */}
      {activeView === 'roles_matrix' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Administrator Role Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-purple-300 dark:border-purple-800/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 rounded-lg text-xs font-black uppercase">
                  Administrator
                </span>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">Full Access</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Complete unrestricted control over system configuration, roles, database backups, and financial records.
              </p>
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span><strong>Delete and modify staff roles</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Configure store settings & tax rates</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Cloud synchronization & Google Auth</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Complete database export, import & reset</span>
                </div>
              </div>
              <button
                onClick={() => handleOpenAdd('admin')}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                + Add Administrator
              </button>
            </div>

            {/* Manager Role Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-blue-300 dark:border-blue-800/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 rounded-lg text-xs font-black uppercase">
                  Store Manager
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">Operations</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Supervises store operations, inventory purchasing, daily audit registers, expense records, and reports.
              </p>
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Inventory intake, pricing & adjustments</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Suppliers & receiving orders</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Daily drawer cashup reconciliations</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Operating expense tracking & sales reports</span>
                </div>
              </div>
              <button
                onClick={() => handleOpenAdd('manager')}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                + Add Store Manager
              </button>
            </div>

            {/* Cashier Role Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-black uppercase">
                  Cashier
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Frontline POS</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Front desk point of sale checkout, barcode scanning, customer loyalty search, and receipts.
              </p>
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Sales register & barcode checkout</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Customer loyalty point management</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Cash, UPI QR, and check payments</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Holding and resuming active cart sales</span>
                </div>
              </div>
              <button
                onClick={() => handleOpenAdd('cashier')}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                + Add Cashier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Add/Edit Staff & Role Credentials */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 dark:bg-slate-950 px-5 py-4 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-sm">
                  {editingEmpId ? 'Edit Staff & Role Credentials' : 'Add New Staff & Assign Role'}
                </span>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="e.g. Alex"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="e.g. Rivera"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="e.g. alex_pos"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Role *</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as Employee['role'] })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold"
                  >
                    <option value="cashier">Cashier (Frontline Register)</option>
                    <option value="manager">Store Manager (Inventory & Reports)</option>
                    <option value="admin">Administrator (Full Jurisdiction & Role Deletion)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Security Password / PIN *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                  >
                    {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPin ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={12}
                    required
                    value={formData.pin}
                    onChange={e => setFormData({ ...formData, pin: e.target.value })}
                    placeholder="e.g. 1234 or custom password"
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono tracking-wider focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Staff member will enter this code to unlock the register or authenticate operations.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="staff@store.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="555-0100"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  {editingEmpId ? 'Save Role Changes' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Admin Delete Confirmation Modal (NO native browser alerts/confirm) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-600 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-white" />
                <span className="font-bold text-sm">Confirm Role & Account Deletion</span>
              </div>
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-rose-200 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-1 text-xs">
                <div className="font-bold text-rose-900 dark:text-rose-200">
                  Staff Member: {deleteTarget.first_name} {deleteTarget.last_name}
                </div>
                <div className="text-rose-700 dark:text-rose-300 font-mono">
                  Username: @{deleteTarget.username} • Role: {deleteTarget.role.toUpperCase()}
                </div>
              </div>

              {deleteTarget.id === currentUser.id ? (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Active Session Notice</span>
                  </div>
                  <p>
                    You are deleting your currently active login account. Confirming will permanently delete this account and immediately log you out to the Sign In screen.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Are you sure you want to delete this role and staff profile? This will revoke all register access and remove their security credentials permanently.
                </p>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  Delete Account Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
