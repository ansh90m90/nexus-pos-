import React, { useState } from 'react';
import { ShieldAlert, Lock, X, Check, User } from 'lucide-react';
import { Employee } from '../types/pos';

interface RoleOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredRole: 'manager' | 'admin';
  actionName: string;
  employees: Employee[];
  onAuthorize: (authorizedUser: Employee) => void;
}

export const RoleOverrideModal: React.FC<RoleOverrideModalProps> = ({
  isOpen,
  onClose,
  requiredRole,
  actionName,
  employees,
  onAuthorize,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const eligibleEmployees = employees.filter(
    e => e.is_active !== false && (requiredRole === 'manager' ? (e.role === 'admin' || e.role === 'manager') : e.role === 'admin')
  );

  const [selectedEmpId, setSelectedEmpId] = useState<string>(eligibleEmployees[0]?.id || '');
  const selectedEmp = eligibleEmployees.find(e => e.id === selectedEmpId) || eligibleEmployees[0];

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) {
      setError('No eligible manager or admin account found.');
      return;
    }

    if (selectedEmp.pin && selectedEmp.pin !== pin.trim()) {
      setError('Invalid authorization PIN code.');
      return;
    }

    onAuthorize(selectedEmp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-amber-600 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-white" />
            <span className="font-bold text-sm">Manager / Admin Override</span>
          </div>
          <button onClick={onClose} className="text-amber-200 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleVerify} className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200">
            <strong>Access Restricted:</strong> {actionName} requires <strong>{requiredRole.toUpperCase()}</strong> authority.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Authorizing Supervisor
            </label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {eligibleEmployees.map(emp => (
                <button
                  type="button"
                  key={emp.id}
                  onClick={() => {
                    setSelectedEmpId(emp.id);
                    setPin('');
                    setError('');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs text-left transition-all ${
                    selectedEmpId === emp.id
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 font-bold text-amber-950 dark:text-amber-200 ring-1 ring-amber-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{emp.first_name} {emp.last_name}</span>
                    {selectedEmpId === emp.id && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700">
                    {emp.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Supervisor Security PIN
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={e => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="Enter supervisor PIN"
                className="w-full text-center text-lg tracking-widest font-mono px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
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

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs"
            >
              Authorize Access
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
