import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Tag, Plus, Check, ChevronDown, X } from 'lucide-react';

interface CategoryComboboxProps {
  value: string;
  onChange: (category: string) => void;
  existingCategories: string[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

const COMMON_SUGGESTIONS = [
  'Grocery & Rashan',
  'Grains & Pulses',
  'Spices & Masala',
  'Oils & Ghee',
  'Bakery & Dairy',
  'Snacks & Beverages',
  'Personal Care',
  'Household Supplies',
  'Fruits & Vegetables',
  'General',
];

export const CategoryCombobox: React.FC<CategoryComboboxProps> = ({
  value,
  onChange,
  existingCategories,
  placeholder = 'Select or type category...',
  required = false,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal input value with prop
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Combine store categories and common suggestions without duplicates
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    existingCategories.forEach(c => {
      const trimmed = c?.trim();
      if (trimmed && trimmed !== 'All') set.add(trimmed);
    });
    COMMON_SUGGESTIONS.forEach(s => set.add(s));
    return Array.from(set);
  }, [existingCategories]);

  // Filter based on input
  const filteredCategories = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return allCategories;
    return allCategories.filter(c => c.toLowerCase().includes(q));
  }, [allCategories, inputValue]);

  const isExactMatch = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    return allCategories.some(c => c.toLowerCase() === q);
  }, [allCategories, inputValue]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // If closed without selecting, commit current input value
        if (inputValue.trim() !== value) {
          onChange(inputValue.trim() || 'General');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, value, onChange]);

  const handleSelect = (category: string) => {
    setInputValue(category);
    onChange(category);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex(prev => Math.min(prev + 1, filteredCategories.length - (isExactMatch ? 1 : 0)));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (isOpen) {
        e.preventDefault();
        if (highlightedIndex < filteredCategories.length) {
          handleSelect(filteredCategories[highlightedIndex]);
        } else if (inputValue.trim()) {
          handleSelect(inputValue.trim());
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Tag className="w-3.5 h-3.5 absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="w-full pl-8 pr-16 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none transition-all"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {inputValue && (
            <button
              type="button"
              onClick={() => {
                setInputValue('');
                onChange('');
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 max-h-56 overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-100">
          {inputValue.trim() && !isExactMatch && (
            <button
              type="button"
              onClick={() => handleSelect(inputValue.trim())}
              className="w-full px-3 py-2 text-left text-xs text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 font-semibold"
            >
              <Plus className="w-3.5 h-3.5 shrink-0 text-sky-500" />
              <span>Use new category: <strong>"{inputValue.trim()}"</strong></span>
            </button>
          )}

          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat, idx) => {
              const isSelected = cat.toLowerCase() === value.trim().toLowerCase();
              const isHighlighted = idx === highlightedIndex;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelect(cat)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition-colors ${
                    isHighlighted
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0 ml-2" />}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-[11px] text-slate-400 text-center">
              Press Enter to add "{inputValue}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
