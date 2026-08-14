import React, { useState } from 'react';
import { Lock, Shield, User, X, LogOut, Check } from 'lucide-react';
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
  const [selectedEmpId, setSelectedEmpId] = useState<string>(currentUser.id);
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  const activeEmployees = employees.filter(e => e.is_active !== false);
  const selectedEmp = activeEmployees.find(e => e.id === selectedEmpId) || activeEmployees[0];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    if (selectedEmp.pin && selectedEmp.pin !== pin.trim()) {
      setError('Incorrect PIN or password. Please try again.');
      return;
    }

    onSelectUser(selectedEmp);
    onClose();
  };

  const handleQuickDigit = (digit: string) => {
    if (pin.length < 8) {
      setPin(prev => prev + digit);
      setError('');
    }
  };

  const handleClearPin = () => {
    setPin('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 dark:bg-slate-950 px-5 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-sky-400" />
            <span className="font-bold text-sm">Switch Staff / Lock Register</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleLogin} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Staff Member / Role
            </label>
            <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-0.5">
              {activeEmployees.map(emp => {
                const isSelected = selectedEmpId === emp.id;
                return (
                  <button
                    type="button"
                    key={emp.id}
                    onClick={() => {
                      setSelectedEmpId(emp.id);
                      setPin('');
                      setError('');
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'border-sky-600 dark:border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-950 dark:text-sky-200 font-bold ring-1 ring-sky-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span className="font-semibold">{emp.first_name} {emp.last_name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-500" />}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                      emp.role === 'admin' 
                        ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900' 
                        : emp.role === 'manager' 
                        ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900' 
                        : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                    }`}>
                      {emp.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Security PIN / Password
              </label>
              {selectedEmp && (
                <span className="text-[11px] text-slate-500 font-mono">
                  {selectedEmp.role === 'admin' ? 'Hint: 1234' : selectedEmp.role === 'manager' ? 'Hint: 5678' : 'Hint: 0000'}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={e => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="Enter PIN"
                className="w-full text-center text-lg tracking-widest font-mono px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                autoFocus
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-1 text-center">
                {error}
              </p>
            )}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(btn => (
              <button
                type="button"
                key={btn}
                onClick={() => {
                  if (btn === 'C') handleClearPin();
                  else if (btn === '⌫') setPin(prev => prev.slice(0, -1));
                  else handleQuickDigit(btn);
                }}
                className="py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600 font-bold text-slate-800 dark:text-slate-200 rounded-lg text-xs transition-colors"
              >
                {btn}
              </button>
            ))}
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="submit"
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-xs font-bold tracking-wide uppercase transition-colors shadow-xs"
            >
              Authenticate / Unlock
            </button>

            {onSignOut && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="w-full py-2 border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out of Terminal</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
