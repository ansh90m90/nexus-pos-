import React from 'react';
import { X, Layers, Plus } from 'lucide-react';
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
        <div className="bg-slate-900 dark:bg-slate-950 px-5 py-3.5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm block leading-tight">Choose Variant</span>
              <span className="text-[11px] text-slate-400">{item.name}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select size, pack, or variety for this item:
          </p>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {variants.map(variant => (
              <button
                key={variant.id}
                type="button"
                onClick={() => {
                  onSelectVariant(variant);
                  onClose();
                }}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:border-sky-500 dark:hover:border-sky-500 border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-center justify-between transition-all group text-left"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400">
                    {variant.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    {variant.item_number && (
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        {variant.item_number}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      • {variant.quantity} in stock
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-sky-700 dark:text-sky-400 font-mono">
                    {config.currency_symbol}{variant.unit_price.toFixed(2)}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 group-hover:bg-sky-600 group-hover:text-white flex items-center justify-center transition-colors text-slate-500 shadow-2xs">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
