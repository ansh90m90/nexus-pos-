import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Store, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Check, 
  Sparkles, 
  Laptop, 
  Users, 
  LogIn, 
  ArrowRight
} from 'lucide-react';
import { Employee, StoreConfig } from '../types/pos';
import { storage } from '../services/storage';

interface AuthGatewayProps {
  employees: Employee[];
  config: StoreConfig | null;
  isFirstTime?: boolean;
  onLoginSuccess: (user: Employee) => void;
  onRegisterStaff?: (newEmp: Omit<Employee, 'id'>) => Employee;
  onGoogleSignIn?: () => Promise<void>;
  onCompleteFirstTimeSetup?: () => void;
}

export const AuthGateway: React.FC<AuthGatewayProps> = ({
  employees,
  config,
  isFirstTime = false,
  onLoginSuccess,
  onRegisterStaff,
  onGoogleSignIn,
  onCompleteFirstTimeSetup,
}) => {
  const activeEmployees = employees.filter(e => e.is_active !== false);
  const remembered = storage.getRememberedUser();

  // Find admin and staff members
  const adminEmployees = activeEmployees.filter(e => e.role === 'admin');
  const staffEmployees = activeEmployees.filter(e => e.role !== 'admin');
  const hasStaff = staffEmployees.length > 0;

  // Selected employee ID for login
  const defaultSelectedId = remembered?.id || adminEmployees[0]?.id || activeEmployees[0]?.id || '';
  const [selectedEmpId, setSelectedEmpId] = useState<string>(defaultSelectedId);
  const [pin, setPin] = useState<string>('');
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);
  const [showPin, setShowPin] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  // Tab state: only allow 'first_time_setup' if isFirstTime is true!
  const [activeTab, setActiveTab] = useState<'signin' | 'first_time_setup'>('signin');

  // Form state for creating staff (only available during first-time setup)
  const [newStaff, setNewStaff] = useState<{
    first_name: string;
    last_name: string;
    username: string;
    role: 'admin' | 'cashier' | 'manager';
    pin: string;
    email: string;
    phone_number: string;
  }>({
    first_name: '',
    last_name: '',
    username: '',
    role: 'admin',
    pin: '1234',
    email: '',
    phone_number: '',
  });
  const [newStaffSuccess, setNewStaffSuccess] = useState<string | null>(null);

  const selectedEmployee = activeEmployees.find(e => e.id === selectedEmpId) || activeEmployees[0];
  const isSelectedAdmin = selectedEmployee?.role === 'admin';

  // Rule: Staff accounts NEVER require a password.
  // Rule: Admin account requires password ONLY IF staff exists. If no staff, admin does NOT require password!
  const isPasswordRequiredForSelected = isSelectedAdmin ? hasStaff : false;

  const handleSignIn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!selectedEmployee) {
      setError('Please select an account to sign in.');
      return;
    }

    // Check password if required
    if (isPasswordRequiredForSelected) {
      if (!pin.trim()) {
        setError(`Please enter the administrator password/PIN for ${selectedEmployee.first_name}.`);
        return;
      }
      if (selectedEmployee.pin && selectedEmployee.pin !== pin.trim()) {
        setError(`Incorrect password/PIN code for ${selectedEmployee.first_name}. Please try again.`);
        return;
      }
    }

    // Mark first time setup as complete upon successful login
    storage.markFirstTimeSetupComplete();
    if (onCompleteFirstTimeSetup) {
      onCompleteFirstTimeSetup();
    }

    // Save device recognition preference
    storage.setDeviceRemembered(rememberDevice, selectedEmployee);
    onLoginSuccess(selectedEmployee);
  };

  const handleQuickStaffLogin = (emp: Employee) => {
    setError(null);
    setSelectedEmpId(emp.id);

    // If staff account or admin in solo mode (no staff), instant 1-click login!
    const empIsAdmin = emp.role === 'admin';
    const empRequiresPass = empIsAdmin ? hasStaff : false;

    if (!empRequiresPass) {
      storage.markFirstTimeSetupComplete();
      if (onCompleteFirstTimeSetup) {
        onCompleteFirstTimeSetup();
      }
      storage.setDeviceRemembered(rememberDevice, emp);
      onLoginSuccess(emp);
    } else {
      setPin('');
    }
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

  const handleGoogleClick = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      if (onGoogleSignIn) {
        await onGoogleSignIn();
      } else {
        // Fallback simulated Google sign-in
        const googleAdmin: Employee = {
          id: 'emp-google-owner',
          first_name: 'Store Owner',
          last_name: '(Google)',
          username: 'owner',
          role: 'admin',
          pin: '1234',
          email: 'pushpasingh1985a@gmail.com',
          phone_number: '555-0100',
          is_active: true,
        };
        storage.markFirstTimeSetupComplete();
        storage.setDeviceRemembered(true, googleAdmin);
        onLoginSuccess(googleAdmin);
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(err?.message || 'Google sign in was cancelled or failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleCreateInitialStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.first_name.trim() || !newStaff.username.trim()) {
      setError('First name and username are required.');
      return;
    }

    if (newStaff.role === 'admin' && !newStaff.pin.trim()) {
      setError('Admin account requires a security PIN or password.');
      return;
    }

    if (onRegisterStaff) {
      const created = onRegisterStaff({
        ...newStaff,
        is_active: true,
      });

      storage.markFirstTimeSetupComplete();
      if (onCompleteFirstTimeSetup) {
        onCompleteFirstTimeSetup();
      }

      setNewStaffSuccess(`Account created for ${created.first_name} (${created.role.toUpperCase()})`);
      setSelectedEmpId(created.id);
      setActiveTab('signin');
      setError(null);

      // Auto sign in if newly created
      setTimeout(() => {
        onLoginSuccess(created);
      }, 600);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white font-sans">
      {/* Top Navigation / Brand Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-4 sm:px-6 py-3.5 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-black text-base sm:text-lg shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white truncate max-w-[180px] sm:max-w-md">
                  {config?.company_name || 'Nexus POS Retail'}
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 shrink-0">
                  v3.4.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden xs:block">
                Point of Sale Terminal & Account Sign In
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs font-semibold text-slate-300">
                {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center justify-end gap-1">
                <Laptop className="w-3 h-3 text-emerald-400" />
                <span>Device: {storage.getDeviceId().substring(0, 10)}</span>
              </div>
            </div>
            <div className="h-7 w-px bg-slate-800 hidden md:block" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs font-semibold shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] sm:text-xs">Secure POS</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Navigation Bar / Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/80">
            <button
              onClick={() => { setActiveTab('signin'); setError(null); }}
              style={{ backgroundColor: activeTab === 'signin' ? '#11172a' : undefined }}
              className={`flex-1 py-3 px-3 sm:px-4 text-xs font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${
                activeTab === 'signin'
                  ? 'border-sky-500 text-sky-400 bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span className="truncate">Sign In to Register</span>
            </button>

            {/* CREATE STAFF OPTION IS ONLY DISPLAYED IF FIRST-TIME SETUP */}
            {isFirstTime && (
              <button
                onClick={() => { setActiveTab('first_time_setup'); setError(null); }}
                style={{ backgroundColor: '#2a384a' }}
                className={`flex-1 py-3 px-3 sm:px-4 text-xs font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${
                  activeTab === 'first_time_setup'
                    ? 'border-emerald-500 text-emerald-400 bg-slate-900/60'
                    : 'border-transparent text-emerald-400/70 hover:text-emerald-300'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="truncate">First-Time Setup</span>
              </button>
            )}
          </div>

          {/* First-time Welcome Banner */}
          {isFirstTime && activeTab === 'signin' && (
            <div style={{ backgroundColor: '#2a384a' }} className="bg-sky-950/60 border-b border-sky-800/50 p-3 sm:p-4 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sky-200">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">First-time terminal sign in detected.</div>
                  <div className="text-slate-300 text-[11px]">Select your account below or continue with Google to start.</div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('first_time_setup')}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold whitespace-nowrap shadow-xs w-full sm:w-auto"
              >
                Add Staff Account
              </button>
            </div>
          )}

          {/* Success Notification */}
          {newStaffSuccess && (
            <div className="bg-emerald-950/80 border-b border-emerald-800 text-emerald-200 px-4 py-3 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{newStaffSuccess}</span>
              </div>
              <button onClick={() => setNewStaffSuccess(null)} className="text-emerald-400 hover:text-white font-bold p-1">✕</button>
            </div>
          )}

          {/* TAB 1: SIGN IN VIEW */}
          {activeTab === 'signin' && (
            <div style={{ backgroundColor: '#2a384a' }} className="p-4 sm:p-6 lg:p-8 space-y-6">
              
              {/* PRIMARY OPTION 1: Continue with Google */}
              <div className="max-w-md mx-auto space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={isGoogleLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 sm:py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all border border-slate-300 hover:shadow-lg disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                >
                  {isGoogleLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  )}
                  <span className="truncate">Continue with Google (Owner / Admin)</span>
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    Or select terminal profile
                  </span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>
              </div>

              {/* SECTION: ACCOUNTS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                
                {/* Left Column: Staff & Admin Account Selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-sky-400" />
                      <span>Select Account ({activeEmployees.length})</span>
                    </label>

                    {!hasStaff ? (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded">
                        Solo Owner Mode
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        {staffEmployees.length} Staff • {adminEmployees.length} Admin
                      </span>
                    )}
                  </div>

                  {/* Account List */}
                  <div className="space-y-2 max-h-72 md:max-h-80 overflow-y-auto pr-0.5">
                    {activeEmployees.map(emp => {
                      const isSelected = selectedEmpId === emp.id;
                      const isAdmin = emp.role === 'admin';
                      const isStaffNoPass = !isAdmin;
                      const isSoloAdminNoPass = isAdmin && !hasStaff;

                      return (
                        <div
                          key={emp.id}
                          onClick={() => {
                            setSelectedEmpId(emp.id);
                            setPin('');
                            setError(null);
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'border-sky-500 bg-sky-950/40 ring-1 ring-sky-500 shadow-md'
                              : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/70'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                isAdmin
                                  ? 'bg-purple-900/60 text-purple-300 border border-purple-700/60'
                                  : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                              }`}>
                                {emp.first_name[0]}{emp.last_name ? emp.last_name[0] : ''}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-white text-xs flex items-center gap-1 truncate">
                                  <span className="truncate">{emp.first_name} {emp.last_name}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono truncate">
                                  @{emp.username}
                                </div>
                              </div>
                            </div>

                            <div className="text-right flex flex-col items-end gap-1 shrink-0">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                                isAdmin
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}>
                                {emp.role}
                              </span>

                              {/* Password Requirement Badge */}
                              {isStaffNoPass ? (
                                <span className="text-[10px] text-emerald-400 font-semibold">
                                  Instant Access
                                </span>
                              ) : isSoloAdminNoPass ? (
                                <span className="text-[10px] text-amber-300 font-semibold">
                                  No Password (Solo)
                                </span>
                              ) : (
                                <span className="text-[10px] text-purple-300 font-semibold flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5" />
                                  PIN Required
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Instant Login Button for Staff and Solo Admin */}
                          {(isStaffNoPass || isSoloAdminNoPass) && (
                            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                              <span className="text-[10px] text-slate-400 truncate">
                                {isStaffNoPass ? 'Staff 1-Click Access' : 'Solo Owner 1-Click Access'}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickStaffLogin(emp);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs shrink-0 active:scale-95"
                              >
                                <span>Sign In</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Authentication Panel */}
                <div className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <form onSubmit={handleSignIn} className="space-y-3.5">
                    
                    {/* Selected User Header */}
                    {selectedEmployee && (
                      <div className="p-2.5 sm:p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelectedAdmin
                              ? 'bg-purple-900/60 text-purple-300'
                              : 'bg-emerald-900/60 text-emerald-300'
                          }`}>
                            {selectedEmployee.first_name[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">
                              {selectedEmployee.first_name} {selectedEmployee.last_name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              Role: {selectedEmployee.role.toUpperCase()}
                            </div>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                          isSelectedAdmin
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {selectedEmployee.role}
                        </span>
                      </div>
                    )}

                    {/* PASSWORD PROMPT LOGIC */}
                    {!isPasswordRequiredForSelected ? (
                      <div className="p-3.5 sm:p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-xl space-y-1.5 text-center">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-emerald-300">
                          {isSelectedAdmin
                            ? 'Solo Owner Mode: Password Not Required'
                            : 'Staff Account: Password Not Required'}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {isSelectedAdmin
                            ? 'No staff accounts exist yet. Admin signs in instantly with zero password required.'
                            : 'Staff accounts can sign in directly to operate the cash register without entering a PIN.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-purple-400" />
                            <span>Administrator Password / PIN *</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                          >
                            {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showPin ? 'Hide' : 'Show'}</span>
                          </button>
                        </div>

                        <div className="relative">
                          <input
                            type={showPin ? 'text' : 'password'}
                            value={pin}
                            onChange={e => {
                              setPin(e.target.value);
                              setError(null);
                            }}
                            placeholder="Enter admin password (Default: 1234)"
                            className="w-full text-center text-sm sm:text-base tracking-widest font-mono px-3 py-2 sm:py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                            autoFocus
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 block text-center">
                          Admin PIN protects Settings & Inventory from staff.
                        </span>

                        {/* Numeric Keypad */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(digit => (
                            <button
                              key={digit}
                              type="button"
                              onClick={() => {
                                if (digit === 'C') handleClearPin();
                                else if (digit === '⌫') setPin(prev => prev.slice(0, -1));
                                else handleKeypadDigit(digit);
                              }}
                              className="py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-700 text-slate-200 font-mono font-bold text-xs sm:text-sm rounded-lg border border-slate-800 transition-colors shadow-2xs"
                            >
                              {digit}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="p-2.5 sm:p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span className="truncate">{error}</span>
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        type="submit"
                        className={`w-full py-2.5 sm:py-3 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
                          !isPasswordRequiredForSelected
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                            : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-950/40'
                        }`}
                      >
                        <LogIn className="w-4 h-4" />
                        <span className="truncate">
                          {!isPasswordRequiredForSelected
                            ? `Sign In as ${selectedEmployee?.first_name || 'User'} (Instant)`
                            : `Unlock & Sign In as ${selectedEmployee?.first_name || 'Admin'}`}
                        </span>
                      </button>
                    </div>

                    {/* Remember Device Control */}
                    <div className="flex items-center justify-center p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                      <label className="flex items-center gap-2 text-[11px] text-slate-300 font-medium cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberDevice}
                          onChange={e => setRememberDevice(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <span>Remember this terminal device for fast sign in</span>
                      </label>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FIRST-TIME SETUP & CREATE STAFF */}
          {isFirstTime && activeTab === 'first_time_setup' && (
            <div className="p-4 sm:p-6 lg:p-8 space-y-5">
              <div className="max-w-xl mx-auto space-y-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Create Initial Store Account / Staff</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Configure the store administrator or add your staff member.
                    Staff accounts do not require passwords; Admin accounts require a password once staff exist.
                  </p>
                </div>

                <form onSubmit={handleCreateInitialStaff} className="space-y-3.5 bg-slate-950/80 p-4 sm:p-6 rounded-2xl border border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={newStaff.first_name}
                        onChange={e => setNewStaff({ ...newStaff, first_name: e.target.value })}
                        placeholder="e.g. John"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={newStaff.last_name}
                        onChange={e => setNewStaff({ ...newStaff, last_name: e.target.value })}
                        placeholder="e.g. Doe"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Username *</label>
                      <input
                        type="text"
                        required
                        value={newStaff.username}
                        onChange={e => setNewStaff({ ...newStaff, username: e.target.value.toLowerCase().trim() })}
                        placeholder="e.g. johndoe"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Account Role *</label>
                      <select
                        value={newStaff.role}
                        onChange={e => setNewStaff({ ...newStaff, role: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs font-semibold focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="admin">Administrator / Store Owner</option>
                        <option value="cashier">Staff / Cashier (No Password)</option>
                        <option value="manager">Store Manager</option>
                      </select>
                    </div>
                  </div>

                  {newStaff.role === 'admin' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Admin Security PIN / Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={newStaff.pin}
                        onChange={e => setNewStaff({ ...newStaff, pin: e.target.value })}
                        placeholder="e.g. 1234"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Admin password protects Settings from staff.
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Email</label>
                      <input
                        type="email"
                        value={newStaff.email}
                        onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                        placeholder="john@store.com"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Phone</label>
                      <input
                        type="text"
                        value={newStaff.phone_number}
                        onChange={e => setNewStaff({ ...newStaff, phone_number: e.target.value })}
                        placeholder="555-0100"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs">
                      {error}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('signin')}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                    >
                      Back to Sign In
                    </button>
                    <button
                      type="submit"
                      className="px-4 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs"
                    >
                      Create & Launch POS
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* System Rules & Protection Summary Footer */}
          <div className="px-4 sm:px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] text-slate-400">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span>Staff: Instant 1-Click</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                <span>Admin: PIN Protected</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span>Settings: Admin Only</span>
              </span>
            </div>

            <div className="text-slate-500 font-mono text-[10px] shrink-0">
              Nexus POS Terminal
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 text-center text-xs text-slate-600 border-t border-slate-900 px-4">
        Authorized Retail POS Terminal • Open Source Point of Sale System
      </footer>
    </div>
  );
};
