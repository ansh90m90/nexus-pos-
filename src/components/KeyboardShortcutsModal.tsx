import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ onClose }) => {
  const shortcuts = [
    { key: 'F1', desc: 'Open this Keyboard Shortcuts cheat sheet' },
    { key: 'F2', desc: 'Focus SKU / Barcode input scanner' },
    { key: 'F4', desc: 'Open Checkout / Tender Payment dialog' },
    { key: 'F8', desc: 'Suspend / Hold current transaction' },
    { key: 'F9', desc: 'Switch Cashier / Lock register terminal' },
    { key: 'Esc', desc: 'Close any active modal or clear barcode input' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 px-5 py-3.5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-sm">POS Keyboard Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Speed up transactions with rapid hardware keyboard hotkeys:
          </p>

          <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
            {shortcuts.map(s => (
              <div key={s.key} className="pt-2 first:pt-0 flex items-center justify-between gap-4">
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {s.desc}
                </span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shadow-2xs shrink-0">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-100 dark:border-sky-900/50 text-[11px] text-sky-800 dark:text-sky-300 flex items-center gap-2 mt-4">
            <Command className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>Barcode scanners with USB/Bluetooth HID act as keyboard input.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-850 px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
