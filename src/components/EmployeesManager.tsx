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
  ShieldAlert,
  UserX,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { Employee } from '../types/pos';
import { storage } from '../services/storage';

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

  // Owner PIN setup state for transitioning to Team Mode
  const [ownerPin, setOwnerPin] = useState('');
  const [confirmOwnerPin, setConfirmOwnerPin] = useState('');
  const [showOwnerPin, setShowOwnerPin] = useState(false);

  // Standalone Owner Password Modal state
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [newOwnerPin, setNewOwnerPin] = useState('');
  const [confirmNewOwnerPin, setConfirmNewOwnerPin] = useState('');
  const [showNewOwnerPin, setShowNewOwnerPin] = useState(false);

  // Custom Delete Modal state
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const staffEmployees = employees.filter(e => e.role !== 'admin' && e.is_active !== false);
  const hasStaff = staffEmployees.length > 0;
  const primaryAdmin = employees.find(e => e.role === 'admin') || employees[0];

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
    pin: '',
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
    const defaultPin = defaultRole === 'admin' ? '1234' : '';
    
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
    setOwnerPin(primaryAdmin?.pin || '');
    setConfirmOwnerPin(primaryAdmin?.pin || '');
    setShowOwnerPin(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setFormData({
      first_name: emp.first_name,
      last_name: emp.last_name,
      username: emp.username,
      role: emp.role,
      pin: emp.pin || '',
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
    
    // Only Admin role strictly requires a password/PIN when saving an Admin
    if (formData.role === 'admin' && !formData.pin.trim()) {
      showToast('An administrator security PIN or password is required.', 'error');
      return;
    }

    // If adding first staff member (transitioning from Solo Owner to Team Mode), require owner PIN
    if (!editingEmpId && formData.role !== 'admin' && !hasStaff) {
      if (!ownerPin.trim()) {
        showToast('Please set an Owner / Administrator password or PIN to protect your store.', 'error');
        return;
      }
      if (ownerPin.trim() !== confirmOwnerPin.trim()) {
        showToast('Owner PIN and confirmation PIN do not match.', 'error');
        return;
      }
    }

    if (editingEmpId) {
      const updated = employees.map(emp => {
        if (emp.id !== editingEmpId) return emp;
        return { ...emp, ...formData };
      });
      onSaveEmployees(updated);
      showToast(`Updated account: ${formData.first_name} (${formData.role.toUpperCase()})`);
    } else {
      const newEmp: Employee = {
        ...formData,
        id: 'emp-' + Date.now(),
      };

      let updatedList = [...employees];

      // If this is the first staff member, also update the primary admin's PIN
      if (formData.role !== 'admin' && !hasStaff && ownerPin.trim()) {
        updatedList = updatedList.map(emp => {
          if (emp.role === 'admin') {
            return { ...emp, pin: ownerPin.trim() };
          }
          return emp;
        });
      }

      updatedList.push(newEmp);
      onSaveEmployees(updatedList);

      if (formData.role !== 'admin' && !hasStaff) {
        showToast(`Owner password set & added staff member ${formData.first_name}! Owner account is now protected.`);
      } else {
        showToast(`Added new ${formData.role.toUpperCase()} account: ${formData.first_name}`);
      }
    }

    setIsModalOpen(false);
  };

  const handleSaveOwnerPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwnerPin.trim()) {
      showToast('Please enter a valid password or PIN.', 'error');
      return;
    }
    if (newOwnerPin.trim() !== confirmNewOwnerPin.trim()) {
      showToast('Password / PIN entries do not match.', 'error');
      return;
    }

    const updated = employees.map(emp => {
      if (emp.role === 'admin') {
        return { ...emp, pin: newOwnerPin.trim() };
      }
      return emp;
    });

    onSaveEmployees(updated);
    setIsOwnerModalOpen(false);
    setNewOwnerPin('');
    setConfirmNewOwnerPin('');
    showToast('Owner / Administrator security PIN updated successfully!');
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
    let updatedEmployees = employees.filter(e => e.id !== targetId);

    // If deleting last admin or last employee, ensure a fallback admin exists
    if (updatedEmployees.length === 0 || !updatedEmployees.some(e => e.role === 'admin')) {
      const fallbackAdmin: Employee = {
        id: 'emp-admin-owner',
        first_name: 'Store',
        last_name: 'Owner',
        username: 'admin',
        role: 'admin',
        pin: '1234',
        email: 'owner@nexuspos.io',
        phone_number: '555-0100',
        is_active: true,
      };
      if (updatedEmployees.length === 0) {
        updatedEmployees = [fallbackAdmin];
      } else {
        updatedEmployees[0].role = 'admin';
      }
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
      showToast(`Successfully deleted ${targetName} (${targetRole.toUpperCase()}) account.`);
    }
  };

  // Delete ALL non-admin staff in one click (Solo Owner Mode)
  const handleConfirmDeleteAllStaff = () => {
    const remainingAdmins = storage.deleteAllStaff();
    onSaveEmployees(remainingAdmins);
    setIsDeleteAllModalOpen(false);
    showToast('All staff accounts deleted. Solo Owner Mode enabled — Admin login no longer requires a password!');
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
              <span>Staff, Role & Account Management</span>
            </h2>
            <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900 text-[10px] font-bold uppercase">
              Admin Exclusive
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage store roles: Staff accounts do not require passwords; Admin accounts require a password only when staff exist.
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
            onClick={() => {
              setNewOwnerPin(primaryAdmin?.pin || '');
              setConfirmNewOwnerPin(primaryAdmin?.pin || '');
              setShowNewOwnerPin(false);
              setIsOwnerModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
            title="Configure or Change Owner / Administrator Password"
          >
            <Lock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Owner PIN</span>
          </button>

          <button
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Staff Member</span>
          </button>
        </div>
      </div>

      {/* SOLO OWNER MODE BANNER / HELPER */}
      {hasStaff ? (
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900/10 dark:from-amber-950/40 dark:border-amber-900/60 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mt-0.5">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-amber-200">
                Running the store alone? Enable Solo Owner Mode
              </div>
              <div className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                If only the store owner is managing the shop, you can delete all staff. When there is no staff in the store, your Admin login will <strong>not require a password</strong>.
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsDeleteAllModalOpen(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs whitespace-nowrap shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <UserX className="w-4 h-4" />
            <span>Delete All Staff (Solo Owner)</span>
          </button>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-900/60 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold">Solo Owner Mode is Active</div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300/80">
                Zero staff members registered. The Admin account logs in instantly with <strong>zero password required</strong>!
              </div>
            </div>
          </div>
          <button
            onClick={() => handleOpenAdd('cashier')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs whitespace-nowrap"
          >
            + Add First Staff Member
          </button>
        </div>
      )}

      {/* VIEW 1: Staff Directory Table */}
      {activeView === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Username</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Authentication Mode</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {employees.map(emp => {
                  const isCurrent = emp.id === currentUser.id;
                  const isAdmin = emp.role === 'admin';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                            isAdmin
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {emp.first_name[0]}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {emp.first_name} {emp.last_name}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-md text-[10px] font-bold">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                        @{emp.username}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                          isAdmin 
                            ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900' 
                            : emp.role === 'manager' 
                            ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900' 
                            : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                        }`}>
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {!isAdmin ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                            <Check className="w-3.5 h-3.5" />
                            <span>No Password Required (Instant)</span>
                          </div>
                        ) : !hasStaff ? (
                          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                            <Check className="w-3.5 h-3.5" />
                            <span>No Password (Solo Owner Mode)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-mono text-[11px]">
                            <Lock className="w-3 h-3" />
                            <span>Password Protected</span>
                          </div>
                        )}
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
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setNewOwnerPin(emp.pin || '');
                                setConfirmNewOwnerPin(emp.pin || '');
                                setShowNewOwnerPin(false);
                                setIsOwnerModalOpen(true);
                              }}
                              className="p-1.5 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-400 rounded-lg transition-colors cursor-pointer"
                              title="Set or Change Owner / Admin Security PIN"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1.5 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-400 rounded-lg transition-colors cursor-pointer"
                            title="Edit Role & Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => initiateDelete(emp)}
                            className="p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-lg transition-colors"
                            title="Delete Staff Account"
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
                Complete exclusive control over Store Settings, tax setup, role & staff deletion, and database backups.
              </p>
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span><strong>Store Settings (Admin Only)</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Delete and modify staff roles</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Cloud synchronization & Google Auth</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Password protected when staff exist; auto-bypassed when solo</span>
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
                Supervises store operations, inventory purchasing, daily audit registers, and expense records.
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
                <div className="flex items-center gap-2 text-rose-500 text-[11px] font-semibold">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span>No access to Store Settings</span>
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
                  Staff / Cashier
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Frontline POS</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Front desk point of sale checkout, barcode scanning, customer loyalty search, and receipts. No password required to log in.
              </p>
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Instant 1-Click login (No password)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Sales register & barcode checkout</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Cash, UPI QR, and check payments</span>
                </div>
                <div className="flex items-center gap-2 text-rose-500 text-[11px] font-semibold">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span>No access to Store Settings</span>
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

      {/* MODAL 1: Add/Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 dark:bg-slate-950 px-5 py-4 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-sm">
                  {editingEmpId ? 'Edit Account & Role' : 'Add New Staff Member'}
                </span>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* If adding first staff member (Solo -> Team Mode), require owner to set Owner Password */}
              {!editingEmpId && formData.role !== 'admin' && !hasStaff && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-400 dark:border-amber-700/80 rounded-xl space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Step 1: Set Owner Password / PIN (Required)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-[10px] font-bold">
                      Team Protection
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                    Adding your first staff member activates <strong>Team Mode</strong>. Please set a secure password/PIN for your Owner account ({primaryAdmin?.first_name || 'Admin'}) so your staff cannot access store settings, change inventory prices, or view revenue reports.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-950 dark:text-amber-200 mb-1">
                        Owner Security PIN / Password *
                      </label>
                      <input
                        type={showOwnerPin ? 'text' : 'password'}
                        required
                        maxLength={12}
                        value={ownerPin}
                        onChange={e => setOwnerPin(e.target.value)}
                        placeholder="e.g. 1234 or pass"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-mono focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-amber-950 dark:text-amber-200 mb-1">
                        Confirm Owner PIN / Password *
                      </label>
                      <input
                        type={showOwnerPin ? 'text' : 'password'}
                        required
                        maxLength={12}
                        value={confirmOwnerPin}
                        onChange={e => setConfirmOwnerPin(e.target.value)}
                        placeholder="Re-enter Owner PIN"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-mono focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowOwnerPin(!showOwnerPin)}
                      className="text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      {showOwnerPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showOwnerPin ? 'Hide PIN' : 'Show PIN'}</span>
                    </button>

                    {ownerPin && confirmOwnerPin && ownerPin !== confirmOwnerPin && (
                      <span className="text-rose-600 dark:text-rose-400 font-bold">PINs do not match</span>
                    )}
                    {ownerPin && confirmOwnerPin && ownerPin === confirmOwnerPin && (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Ready
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2 or Regular Form Details */}
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
                    <option value="cashier">Staff / Cashier (No Password Required)</option>
                    <option value="manager">Store Manager (Operations)</option>
                    <option value="admin">Administrator (Password Protected & Settings Access)</option>
                  </select>
                </div>
              </div>

              {formData.role === 'admin' ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Admin Password / PIN *
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
                    Admin password prevents staff from accessing store settings and deleting roles.
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>No password required:</strong> Staff accounts can sign in with a single click.</span>
                </div>
              )}

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
                  {editingEmpId ? 'Save Changes' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete Single Employee Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-600 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-white" />
                <span className="font-bold text-sm">Confirm Account Deletion</span>
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

              <p className="text-xs text-slate-600 dark:text-slate-300">
                Are you sure you want to delete this account? Once deleted, this staff member will no longer appear on the login screen.
              </p>

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
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete ALL Staff Modal (Solo Owner Mode) */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-amber-600 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserX className="w-5 h-5 text-white" />
                <span className="font-bold text-sm">Switch to Solo Owner Mode</span>
              </div>
              <button
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="text-amber-200 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Delete All {staffEmployees.length} Staff Member Accounts</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300/90">
                  This will remove all non-admin staff from the terminal. Only your Store Owner / Admin account will remain.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div className="font-semibold text-slate-900 dark:text-white">What happens next:</div>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li>Because no staff exist in the store, your Admin login will <strong>not require a password</strong>.</li>
                  <li>You will be able to log in with 1-click instantly from the main login screen.</li>
                  <li>You can add staff back at any time from this dashboard.</li>
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteAllModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteAllStaff}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Confirm & Delete All Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Owner Security PIN / Password Management Modal */}
      {isOwnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-purple-700 dark:bg-purple-900 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-white" />
                <span className="font-bold text-sm">Owner / Admin Security Password</span>
              </div>
              <button
                onClick={() => setIsOwnerModalOpen(false)}
                className="text-purple-200 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOwnerPin} className="p-6 space-y-4">
              <div className="p-3.5 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900/60 rounded-xl space-y-1 text-xs text-purple-900 dark:text-purple-200">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Admin Account: {primaryAdmin?.first_name} {primaryAdmin?.last_name} (@{primaryAdmin?.username})</span>
                </div>
                <p className="text-[11px] text-purple-800 dark:text-purple-300/90 leading-relaxed">
                  This password protects your administrative privileges, store settings, profit margins, and prevents staff from deleting records or accounts.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    New Security PIN / Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewOwnerPin(!showNewOwnerPin)}
                    className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {showNewOwnerPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showNewOwnerPin ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewOwnerPin ? 'text' : 'password'}
                    required
                    maxLength={16}
                    value={newOwnerPin}
                    onChange={e => setNewOwnerPin(e.target.value)}
                    placeholder="Enter new owner password or PIN"
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono tracking-wider focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    autoFocus
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password / PIN *
                </label>
                <div className="relative">
                  <input
                    type={showNewOwnerPin ? 'text' : 'password'}
                    required
                    maxLength={16}
                    value={confirmNewOwnerPin}
                    onChange={e => setConfirmNewOwnerPin(e.target.value)}
                    placeholder="Re-enter password or PIN"
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono tracking-wider focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                </div>
                {newOwnerPin && confirmNewOwnerPin && newOwnerPin !== confirmNewOwnerPin && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1">
                    Passwords do not match.
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOwnerModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Owner Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
