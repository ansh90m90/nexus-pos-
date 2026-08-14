import React from 'react';
import { X, Printer } from 'lucide-react';
import { Item, StoreConfig } from '../types/pos';

interface BarcodeLabelModalProps {
  items: Item[];
  config: StoreConfig;
  onClose: () => void;
}

export const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({
  items,
  config,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 dark:bg-slate-950 px-5 py-3.5 text-white flex items-center justify-between border-b border-slate-800">
          <span className="font-bold text-sm">Printable Barcode Sheet ({items.length} items)</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-950/50 max-h-[75vh] overflow-y-auto">
          <div id="printable-barcodes" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            {items.map(item => (
              <div 
                key={item.id} 
                className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center flex flex-col items-center justify-between bg-white dark:bg-slate-800/80 shadow-xs"
              >
                <div className="w-full">
                  <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 truncate">{config.company_name}</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">{item.name}</p>
                  <p className="text-[11px] font-black text-sky-600 dark:text-sky-400 mt-0.5">
                    {config.currency_symbol}{item.unit_price.toFixed(2)}
                  </p>
                </div>

                {/* Simulated Barcode Lines */}
                <div className="my-2 py-1 px-2 border-y border-slate-200 dark:border-slate-700 w-full flex flex-col items-center">
                  <div className="h-9 w-full flex items-center justify-center gap-[2px]">
                    {[2, 1, 3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 4, 1, 2, 1, 3, 1].map((w, i) => (
                      <div 
                        key={i} 
                        className="bg-slate-900 dark:bg-slate-100 h-full"
                        style={{ width: `${w * 1.5}px` }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[10px] tracking-widest text-slate-800 dark:text-slate-300 font-bold mt-1">
                    {item.item_number}
                  </span>
                </div>

                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase">{item.category}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Barcodes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
