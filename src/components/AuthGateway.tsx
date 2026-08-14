import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  KeyRound, 
  Store, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Check,
  ChevronRight,
  Shield,
  Layers,
  Sparkles,
  Smartphone,
  Laptop
} from 'lucide-react';
import { Employee, StoreConfig } from '../types/pos';
import { storage } from '../services/storage';

interface AuthGatewayProps {
  employees: Employee[];
  config: StoreConfig | null;
  onLoginSuccess: (user: Employee) => void;
  onRegisterStaff: (newEmp: Omit<Employee, 'id'>) => Employee;
}

export const AuthGateway: React.FC<AuthGatewayProps> = ({
  employees,
  config,
  onLoginSuccess,
  onRegisterStaff,
}) => {
  const remembered = storage.getRememberedUser();
  const [selectedEmpId, setSelectedEmpId] = useState<string>(remembered?.id || employees[0]?.id || '');
  const [pin, setPin] = useState<string>('');
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);
  const [showPin, setShowPin] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'signin' | 'new_staff' | 'roles_info'>('signin');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | 'admin' | 'manager' | 'cashier'>('all');

  // Form state for creating a new staff account / role directly from login
  const [newStaff, setNewStaff] = useState<{
    first_name: string;
    last_name: string;
    username: string;
    role: 'admin' | 'manager' | 'cashier';
    pin: string;
    email: string;
    phone_number: string;
  }>({
    first_name: '',
    last_name: '',
    username: '',
    role: 'cashier',
    pin: '1234',
    email: '',
    phone_number: '',
  });
  const [newStaffSuccess, setNewStaffSuccess] = useState<string | null>(null);

  const selectedEmployee = employees.find(e => e.id === selectedEmpId) || employees[0];

  const filteredEmployees = employees.filter(e => {
    if (selectedRoleFilter === 'all') return true;
    return e.role === selectedRoleFilter;
  });

  const handleSignIn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!selectedEmployee) {
      setError('Please select a staff member to sign in.');
      return;
    }

    if (selectedEmployee.pin && selectedEmployee.pin !== pin.trim()) {
      setError('Invalid password/PIN code for ' + selectedEmployee.first_name + '. Please try again.');
      return;
    }

    // Save device recognition preference
    storage.setDeviceRemembered(rememberDevice, selectedEmployee);
    onLoginSuccess(selectedEmployee);
  };

  const handleKeypadDigit = (digit: string) => {
    if (pin.length < 8) {
      setPin(prev => prev + digit);
      setError(null);
    }
  };

  const handleClearPin = () => {
    setPin('');
    setError(null);
  };

  const handleQuickFill = (empId: string, empPin: string) => {
    setSelectedEmpId(empId);
    setPin(empPin);
    setError(null);
  };

  const handleCreateNewStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.first_name.trim() || !newStaff.username.trim()) {
      setError('First name and username are required.');
      return;
    }
    if (!newStaff.pin.trim()) {
      setError('A security PIN or password is required.');
      return;
    }

    const created = onRegisterStaff({
      ...newStaff,
      is_active: true,
    });

    setNewStaffSuccess(`Account created for ${created.first_name} (${created.role.toUpperCase()}) with PIN: ${created.pin}`);
    setSelectedEmpId(created.id);
    setPin(created.pin);
    setActiveTab('signin');
    setError(null);

    // Reset form
    setNewStaff({
      first_name: '',
      last_name: '',
      username: '',
      role: 'cashier',
      pin: '1234',
      email: '',
      phone_number: '',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white font-sans">
      {/* Top Banner */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-black text-lg">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-white">
                  {config?.company_name || 'Nexus POS'}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  v3.4.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Authorized Personnel Terminal Authentication & Role Gateway
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-300">
                {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center justify-end gap-1">
                <Laptop className="w-3 h-3 text-emerald-400" />
                <span>Device ID: {storage.getDeviceId().substring(0, 14)}</span>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800 mx-2 hidden sm:block" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Terminal Security Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/50">
            <button
              onClick={() => { setActiveTab('signin'); setError(null); }}
              className={`flex-1 py-3.5 px-4 text-xs font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${
                activeTab === 'signin'
                  ? 'border-sky-500 text-sky-400 bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Select Staff & Sign In</span>
            </button>

            <button
              onClick={() => { setActiveTab('new_staff'); setError(null); }}
              className={`flex-1 py-3.5 px-4 text-xs font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${
                activeTab === 'new_staff'
                  ? 'border-sky-500 text-sky-400 bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Role / Staff</span>
            </button>

            <button
              onClick={() => { setActiveTab('roles_info'); setError(null); }}
              className={`flex-1 py-3.5 px-4 text-xs font-bold flex items-center justify-center gap-2 transition-colors border-b-2 hidden md:flex ${
                activeTab === 'roles_info'
                  ? 'border-sky-500 text-sky-400 bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Role Permissions Matrix</span>
            </button>
          </div>

          {remembered && activeTab === 'signin' && (
            <div className="bg-sky-950/60 border-b border-sky-800 text-sky-200 px-5 py-2.5 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-sky-400 shrink-0" />
                <span><strong>Device Recognized:</strong> Last signed in as <strong>{remembered.first_name} {remembered.last_name}</strong> ({remembered.role.toUpperCase()})</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedEmpId(remembered.id);
                  setPin(remembered.pin);
                }}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-bold transition-colors"
              >
                Auto-Fill {remembered.first_name}
              </button>
            </div>
          )}

          {newStaffSuccess && (
            <div className="bg-emerald-950/80 border-b border-emerald-800 text-emerald-200 px-5 py-3 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{newStaffSuccess}</span>
              </div>
              <button
                onClick={() => setNewStaffSuccess(null)}
                className="text-emerald-400 hover:text-white text-xs font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* TAB 1: Select Staff & Sign In */}
          {activeTab === 'signin' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
              {/* Left Column: Role Filter & Staff Member Selector */}
              <div className="lg:col-span-6 p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      1. Select Role / Staff Profile
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {filteredEmployees.length} registered
                    </span>
                  </div>

                  {/* Role Quick Filter Chips */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSelectedRoleFilter('all')}
                      className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-colors ${
                        selectedRoleFilter === 'all'
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRoleFilter('admin')}
                      className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-colors ${
                        selectedRoleFilter === 'admin'
                          ? 'bg-purple-900/60 text-purple-200 border border-purple-700/60'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Admins
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRoleFilter('manager')}
                      className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-colors ${
                        selectedRoleFilter === 'manager'
                          ? 'bg-blue-900/60 text-blue-200 border border-blue-700/60'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Managers
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRoleFilter('cashier')}
                      className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-colors ${
                        selectedRoleFilter === 'cashier'
                          ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-700/60'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Cashiers
                    </button>
                  </div>

                  {/* Staff List */}
                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {filteredEmployees.map(emp => {
                      const isSelected = selectedEmpId === emp.id;
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            setSelectedEmpId(emp.id);
                            setPin('');
                            setError(null);
                          }}
                          className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between group ${
                            isSelected
                              ? 'bg-sky-950/40 border-sky-500 ring-1 ring-sky-500 shadow-md'
                              : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                              emp.role === 'admin'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : emp.role === 'manager'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}>
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-xs text-white flex items-center gap-1.5">
                                <span>{emp.first_name} {emp.last_name}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                @{emp.username}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              emp.role === 'admin'
                                ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50'
                                : emp.role === 'manager'
                                ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
                                : 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
                            }`}>
                              {emp.role}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Demo Quick-Select Credentials helper */}
                <div className="pt-3 border-t border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Quick-Select Demo Roles:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {employees.find(e => e.role === 'admin') && (
                      <button
                        type="button"
                        onClick={() => {
                          const admin = employees.find(e => e.role === 'admin')!;
                          handleQuickFill(admin.id, admin.pin);
                        }}
                        className="p-2 rounded-lg bg-purple-950/40 border border-purple-800/60 hover:bg-purple-900/40 text-left transition-colors"
                      >
                        <div className="text-[11px] font-bold text-purple-300">Admin</div>
                        <div className="text-[10px] font-mono text-purple-400">PIN: 1234</div>
                      </button>
                    )}
                    {employees.find(e => e.role === 'manager') && (
                      <button
                        type="button"
                        onClick={() => {
                          const mgr = employees.find(e => e.role === 'manager')!;
                          handleQuickFill(mgr.id, mgr.pin);
                        }}
                        className="p-2 rounded-lg bg-blue-950/40 border border-blue-800/60 hover:bg-blue-900/40 text-left transition-colors"
                      >
                        <div className="text-[11px] font-bold text-blue-300">Manager</div>
                        <div className="text-[10px] font-mono text-blue-400">PIN: 5678</div>
                      </button>
                    )}
                    {employees.find(e => e.role === 'cashier') && (
                      <button
                        type="button"
                        onClick={() => {
                          const csh = employees.find(e => e.role === 'cashier')!;
                          handleQuickFill(csh.id, csh.pin);
                        }}
                        className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/40 text-left transition-colors"
                      >
                        <div className="text-[11px] font-bold text-emerald-300">Cashier</div>
                        <div className="text-[10px] font-mono text-emerald-400">PIN: 0000</div>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Password & PIN Authentication */}
              <div className="lg:col-span-6 p-5 sm:p-6 flex flex-col justify-between space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        2. Security PIN / Password
                      </label>
                      {selectedEmployee && (
                        <span className="text-xs text-sky-400 font-bold">
                          Logging in as {selectedEmployee.first_name}
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type={showPin ? 'text' : 'password'}
                        value={pin}
                        onChange={e => {
                          setPin(e.target.value);
                          setError(null);
                        }}
                        maxLength={12}
                        placeholder="Enter PIN or Password"
                        className="w-full text-center text-xl tracking-widest font-mono py-3 px-10 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder:tracking-normal placeholder:text-slate-600 placeholder:text-sm"
                        autoFocus
                      />
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-4" />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3.5 top-4 text-slate-500 hover:text-slate-300"
                        title={showPin ? 'Hide PIN' : 'Reveal PIN'}
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Remember Device Toggle */}
                    <div className="mt-2.5 flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberDevice}
                          onChange={e => setRememberDevice(e.target.checked)}
                          className="w-4 h-4 text-sky-600 rounded bg-slate-900 border-slate-700 focus:ring-sky-500 focus:ring-1"
                        />
                        <span>Remember this device (stay signed in)</span>
                      </label>
                      <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                    </div>

                    {error && (
                      <div className="mt-2 p-2 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>

                  {/* On-screen Keypad for touchscreens / fast entry */}
                  <div className="grid grid-cols-3 gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(btn => (
                      <button
                        key={btn}
                        type="button"
                        onClick={() => {
                          if (btn === 'C') handleClearPin();
                          else if (btn === '⌫') setPin(prev => prev.slice(0, -1));
                          else handleKeypadDigit(btn);
                        }}
                        className="py-3 bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-white font-bold text-sm rounded-xl border border-slate-700/60 transition-colors"
                      >
                        {btn}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>Authenticate & Access Register</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </form>

                {selectedEmployee && (
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-sky-400" />
                      <span>Role: <strong className="text-white capitalize">{selectedEmployee.role}</strong></span>
                    </div>
                    <span>
                      {selectedEmployee.role === 'admin' 
                        ? 'Full System Authority' 
                        : selectedEmployee.role === 'manager' 
                        ? 'Inventory & Cashups' 
                        : 'Register & Checkout'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Register New Staff Account & Role */}
          {activeTab === 'new_staff' && (
            <form onSubmit={handleCreateNewStaff} className="p-6 space-y-4 max-w-2xl mx-auto">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-sky-400" />
                  <span>Create New Employee & Role Credentials</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Assign a specific role (Admin, Manager, Cashier) and define their personal security PIN / Password.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newStaff.first_name}
                    onChange={e => setNewStaff({ ...newStaff, first_name: e.target.value })}
                    placeholder="e.g. Jordan"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newStaff.last_name}
                    onChange={e => setNewStaff({ ...newStaff, last_name: e.target.value })}
                    placeholder="e.g. Taylor"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={newStaff.username}
                    onChange={e => setNewStaff({ ...newStaff, username: e.target.value.toLowerCase().trim() })}
                    placeholder="e.g. jt_pos"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Select Role Level *</label>
                  <select
                    value={newStaff.role}
                    onChange={e => setNewStaff({ ...newStaff, role: e.target.value as Employee['role'] })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="cashier">Cashier — Register & Customers</option>
                    <option value="manager">Store Manager — Inventory, Receivings, Reports</option>
                    <option value="admin">Administrator — Full System Authority & Role Deletion</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Assign Security PIN / Password *
                </label>
                <input
                  type="password"
                  required
                  maxLength={8}
                  value={newStaff.pin}
                  onChange={e => setNewStaff({ ...newStaff, pin: e.target.value })}
                  placeholder="e.g. 4321"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-lg text-xs font-mono tracking-widest focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Staff member will enter this code at the terminal login screen to unlock the register.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newStaff.email}
                    onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                    placeholder="staff@store.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newStaff.phone_number}
                    onChange={e => setNewStaff({ ...newStaff, phone_number: e.target.value })}
                    placeholder="555-0199"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('signin')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-colors shadow-md"
                >
                  Save & Switch to Sign In
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Role Permissions Matrix */}
          {activeTab === 'roles_info' && (
            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <span>Role-Based Access Control (RBAC) Architecture</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Summary of privileges enforced throughout the Nexus POS system for each security tier.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Admin Role */}
                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700/60 text-xs font-bold uppercase">
                      Administrator
                    </span>
                    <span className="text-[10px] text-purple-300 font-mono">Tier 1</span>
                  </div>
                  <p className="text-xs text-purple-200/80">
                    Highest authority level with full administrative jurisdiction.
                  </p>
                  <ul className="text-xs space-y-1.5 text-purple-200/90 font-medium">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span><strong>Delete Roles & Staff accounts</strong></span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Edit store tax rates & currency</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Configure Cloud Sync & Google Auth</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Full system backup, export & reset</span>
                    </li>
                  </ul>
                </div>

                {/* Manager Role */}
                <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-700/60 text-xs font-bold uppercase">
                      Store Manager
                    </span>
                    <span className="text-[10px] text-blue-300 font-mono">Tier 2</span>
                  </div>
                  <p className="text-xs text-blue-200/80">
                    Store operations, inventory purchasing, daily audits, and expenses.
                  </p>
                  <ul className="text-xs space-y-1.5 text-blue-200/90 font-medium">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Stock receiving & inventory adjustments</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Supplier directory & purchase intake</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Daily cashup drawer reconciliations</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Expense logging & sales reports</span>
                    </li>
                  </ul>
                </div>

                {/* Cashier Role */}
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700/60 text-xs font-bold uppercase">
                      Frontline Cashier
                    </span>
                    <span className="text-[10px] text-emerald-300 font-mono">Tier 3</span>
                  </div>
                  <p className="text-xs text-emerald-200/80">
                    Fast checkout register and customer relationship service.
                  </p>
                  <ul className="text-xs space-y-1.5 text-emerald-200/90 font-medium">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Point of Sale checkout & barcode scan</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Customer loyalty points & search</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Cash, UPI QR, Customer Credit & Card</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Holding and resuming active cart sales</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('signin')}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer info */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-3 text-center text-xs text-slate-500">
        <span>Protected Nexus POS Terminal • Role Access Control & Encrypted Local Storage</span>
      </footer>
    </div>
  );
};
