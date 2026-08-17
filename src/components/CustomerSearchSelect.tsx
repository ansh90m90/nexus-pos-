import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, User, UserPlus, X, Check, Phone } from 'lucide-react';
import { Customer, StoreConfig } from '../types/pos';
import { searchCustomers } from '../utils/fuzzySearch';

interface CustomerSearchSelectProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
  onAddNewCustomer: () => void;
  config: StoreConfig;
}

export const CustomerSearchSelect: React.FC<CustomerSearchSelectProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onAddNewCustomer,
  config,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Fuzzy-searched customer results with typo tolerance
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return customers.slice(0, 30); // show top 30 initially
    }
    return searchCustomers(customers, searchQuery);
  }, [customers, searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelect = (id: string) => {
    onSelectCustomer(id);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Selected Customer Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium transition-all shadow-2xs text-left cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          <User className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
          {selectedCustomer ? (
            <span className="font-bold truncate text-slate-900 dark:text-slate-100">
              {selectedCustomer.first_name} {selectedCustomer.last_name}
              {selectedCustomer.phone_number && (
                <span className="text-slate-400 font-normal ml-1 text-[11px]">
                  ({selectedCustomer.phone_number})
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400 truncate">
              Walk-in Customer (Guest)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedCustomer && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onSelectCustomer('');
              }}
              className="p-0.5 text-slate-400 hover:text-rose-500 rounded transition-colors"
              title="Clear customer"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <span className="text-[10px] text-slate-400 font-bold ml-0.5">▼</span>
        </div>
      </button>

      {/* Dropdown with Real-Time Fuzzy Search */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-full sm:min-w-[320px] max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Header */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type name, phone or misspelling (e.g. raahul)..."
                className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1 flex items-center justify-between">
                <span>Fuzzy matching on typo & phonetics</span>
                <span className="font-semibold">{searchResults.length} found</span>
              </div>
            )}
          </div>

          {/* Results List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-thin">
            {/* Walk-in guest option */}
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer text-xs ${
                !selectedCustomerId
                  ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-900 dark:text-sky-200 font-bold'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Walk-in Customer (Guest)</span>
              </div>
              {!selectedCustomerId && <Check className="w-3.5 h-3.5 text-sky-600" />}
            </button>

            {searchResults.map((c) => {
              const isSelected = c.id === selectedCustomerId;
              const hasDue = (c.credit_balance || 0) > 0;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c.id)}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-900 dark:text-sky-200 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold flex items-center gap-1.5 truncate">
                      <span>{c.first_name} {c.last_name}</span>
                      {config.enable_loyalty !== false && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-normal">
                          ⭐ {c.points || 0}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {c.phone_number && (
                        <span className="flex items-center gap-0.5">
                          <Phone className="w-2.5 h-2.5" />
                          <span>{c.phone_number}</span>
                        </span>
                      )}
                      {c.account_number && (
                        <span>Acc: {c.account_number}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {hasDue && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-mono">
                        Due: {config.currency_symbol}{(c.credit_balance || 0).toFixed(0)}
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />}
                  </div>
                </button>
              );
            })}

            {searchResults.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400">
                <p>No customer found matching "{searchQuery}"</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onAddNewCustomer();
                  }}
                  className="mt-2 text-sky-600 dark:text-sky-400 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Create new customer</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-2 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[10px] text-slate-400">{customers.length} total customers</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onAddNewCustomer();
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-[11px] font-bold transition-colors shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-3 h-3" />
              <span>+ Add Customer</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
