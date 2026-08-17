import React from 'react';
import { X, Layers, Plus, FileText } from 'lucide-react';
import { Item, ItemVariant, StoreConfig } from '../types/pos';

interface VariantSelectModalProps {
  item: Item;
  config: StoreConfig;
  isOpen?: boolean;
  onClose: () => void;
  onSelectVariant: (variant: ItemVariant) => void;
}

export const VariantSelectModal: React.FC<VariantSelectModalProps> = ({
  item,
  config,
  isOpen = true,
  onClose,
  onSelectVariant,
}) => {
  if (!isOpen) return null;

  const variants = item.variants || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 px-5 py-3.5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm block leading-tight text-white">Select Variant</span>
              <span className="text-[11px] text-slate-400 truncate max-w-xs block">{item.name}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
            <span>Choose from <strong className="text-slate-800 dark:text-slate-200">{variants.length}</strong> options:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px]">{item.category}</span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {variants.map(variant => {
              const isOutOfStock = (variant.quantity ?? 0) <= 0;
              const isLowStock = !isOutOfStock && (variant.quantity ?? 0) <= (variant.reorder_level ?? 5);

              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => {
                    onSelectVariant(variant);
                    onClose();
                  }}
                  className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all group text-left cursor-pointer ${
                    isOutOfStock 
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-400' 
                      : 'bg-white dark:bg-slate-850 hover:bg-sky-50/50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-750 hover:border-sky-300 dark:hover:border-slate-600 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-2">
                    <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                      isOutOfStock 
                        ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300' 
                        : 'bg-sky-50 dark:bg-slate-750 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-slate-700'
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {variant.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {variant.item_number && (
                          <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {variant.item_number}
                          </span>
                        )}
                        <span className={`text-[11px] font-semibold ${
                          isOutOfStock 
                            ? 'text-rose-600 dark:text-rose-400 font-bold' 
                            : isLowStock
                            ? 'text-amber-600 dark:text-amber-400 font-bold'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          • {variant.quantity ?? 0} in stock
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900 dark:text-white font-mono block">
                        {config.currency_symbol}{variant.unit_price.toFixed(2)}
                      </span>
                      {isOutOfStock && (
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block">
                          Out of stock
                        </span>
                      )}
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-2xs ${
                      isOutOfStock
                        ? 'bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300'
                        : 'bg-slate-100 dark:bg-slate-750 group-hover:bg-sky-600 group-hover:text-white dark:group-hover:bg-sky-500 dark:group-hover:text-white text-slate-700 dark:text-slate-300'
                    }`}>
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

