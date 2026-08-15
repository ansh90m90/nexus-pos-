import React, { useState } from 'react';
import { Lock, Shield, X, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Employee } from '../types/pos';

interface LoginModalProps {
  employees: Employee[];
  currentUser: Employee;
  onSelectUser: (user: Employee) => void;
  onClose: () => void;
  onSignOut?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  employees,
  currentUser,
  onSelectUser,
  onClose,
  onSignOut,
}) => {
  const activeEmployees = employees.filter(e => e.is_active !== false);
  const staffEmployees = activeEmployees.filter(e => e.role !== 'admin');
  const hasStaff = staffEmployees.length > 0;

  const [selectedEmpId, setSelectedEmpId] = useState<string>(currentUser.id);
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const selectedEmp = activeEmployees.find(e => e.id === selectedEmpId) || activeEmployees[0];
  const isSelectedAdmin = selectedEmp?.role === 'admin';
  const isPasswordRequired = isSelectedAdmin ? hasStaff : false;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    if (isPasswordRequired) {
      if (!pin.trim()) {
        setError('Please enter administrator password / PIN.');
        return;
      }
      if (selectedEmp.pin && selectedEmp.pin !== pin.trim()) {
        setError('Incorrect PIN. Please try again.');
        return;
      }
    }

    onSelectUser(selectedEmp);
    onClose();
  };

  const handleInstantSwitch = (emp: Employee) => {
    const isAdmin = emp.role === 'admin';
    const requiresPass = isAdmin ? hasStaff : false;

    if (!requiresPass) {
      onSelectUser(emp);
      onClose();
    } else {
      setSelectedEmpId(emp.id);
      setPin('');
      setError('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 px-4 sm:px-5 py-3.5 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
            <span className="font-bold text-sm">Switch POS Account</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleLogin} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Profile ({activeEmployees.length})
              </label>
              <span className="text-[10px] text-slate-400">
                Tap profile to switch
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 max-h-48 sm:max-h-56 overflow-y-auto pr-0.5">
              {activeEmployees.map(emp => {
                const isSelected = selectedEmpId === emp.id;
                const isAdmin = emp.role === 'admin';
                const isStaff = !isAdmin;
                const isSoloAdmin = isAdmin && !hasStaff;
                const isCurrentActive = currentUser.id === emp.id;

                return (
                  <div
                    key={emp.id}
                    onClick={() => handleInstantSwitch(emp)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-sky-600 dark:border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-950 dark:text-sky-200 font-bold ring-1 ring-sky-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isAdmin
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        {emp.first_name[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold flex items-center gap-1.5 truncate">
                          <span className="truncate">{emp.first_name} {emp.last_name}</span>
                          {isCurrentActive && (
                            <span className="text-[9px] px-1 py-0.2 bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300 font-normal">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">@{emp.username}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider ${
                        isAdmin 
                          ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900' 
                          : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      }`}>
                        {emp.role}
                      </span>
                      
                      {(isStaff || isSoloAdmin) ? (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <span>Instant</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-purple-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Password Prompt only if Admin and staff exist */}
          {isPasswordRequired ? (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-purple-500" />
                  <span>Admin PIN Required</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPin ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={12}
                  value={pin}
                  onChange={e => {
                    setPin(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter admin PIN (Default: 1234)"
                  className="w-full text-center text-sm sm:text-base tracking-widest font-mono px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold text-center">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {isSelectedAdmin ? 'Solo Owner Mode: Instant switch.' : 'Staff Account: Instant 1-click switch.'}
              </span>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline w-full sm:w-auto text-left"
              >
                Sign Out to Login Screen
              </button>
            )}
            <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-initial px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Switch Account
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
