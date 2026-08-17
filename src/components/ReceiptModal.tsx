import React from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import { Sale, StoreConfig } from '../types/pos';

interface ReceiptModalProps {
  sale: Sale;
  config: StoreConfig;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  config,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.sale_time).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 dark:bg-slate-950 px-5 py-3.5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Sale Completed</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Paper Area */}
        <div className="p-6 bg-slate-50 dark:bg-slate-950/50 overflow-y-auto max-h-[70vh]">
          <div 
            id="printable-receipt"
            className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs font-mono text-xs text-slate-800 dark:text-slate-200 space-y-3"
          >
            {/* Header */}
            <div className="text-center border-b border-dashed border-slate-300 dark:border-slate-700 pb-3">
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-wider">
                {config.company_name}
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 whitespace-pre-line mt-1">
                {config.address}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Tel: {config.phone}</p>
              {config.receipt_header && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-2 whitespace-pre-line">
                  {config.receipt_header}
                </p>
              )}
            </div>

            {/* Meta */}
            <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-300 dark:border-slate-700 pb-2">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Receipt #:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{sale.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Date/Time:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Cashier:</span>
                <span>{sale.employee_name}</span>
              </div>
              {sale.customer_name && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Customer:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{sale.customer_name}</span>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="space-y-1.5 border-b border-dashed border-slate-300 dark:border-slate-700 pb-3">
              <div className="flex justify-between font-bold text-slate-600 dark:text-slate-400 text-[10px] uppercase pb-1">
                <span className="w-1/2">Item</span>
                <span className="w-1/6 text-center">Qty</span>
                <span className="w-1/6 text-right">Price</span>
                <span className="w-1/6 text-right">Total</span>
              </div>

              {sale.items.map((item, idx) => {
                const isWeighted = item.item_type === 'weighted';
                const weightDisplay = isWeighted && item.weight_in_grams 
                  ? (item.weight_in_grams >= 1000 ? `${(item.weight_in_grams/1000).toFixed(3)}kg` : `${item.weight_in_grams.toFixed(0)}g`)
                  : null;

                return (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between">
                      <div className="w-1/2 pr-1">
                        <span className="truncate font-medium block">
                          {item.name}
                          {item.variant_name && <span className="text-[10px] text-slate-500"> ({item.variant_name})</span>}
                        </span>
                        {weightDisplay && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-normal">
                            Wt: {weightDisplay} @ {config.currency_symbol}{item.unit_price.toFixed(2)}/kg
                          </span>
                        )}
                      </div>
                      <span className="w-1/6 text-center font-bold">
                        {isWeighted ? (item.quantity < 1 ? item.quantity.toFixed(3) : item.quantity) : item.quantity}
                      </span>
                      <span className="w-1/6 text-right">{config.currency_symbol}{item.unit_price.toFixed(2)}</span>
                      <span className="w-1/6 text-right font-bold text-slate-900 dark:text-white">{config.currency_symbol}{item.total.toFixed(2)}</span>
                    </div>
                    {item.discount_percent > 0 && (
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 italic pl-2">
                        Disc: {item.discount_percent}% off
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 dark:border-slate-700 pb-2">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Subtotal:</span>
                <span>{config.currency_symbol}{sale.subtotal.toFixed(2)}</span>
              </div>
              {sale.discount_total > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount:</span>
                  <span>-{config.currency_symbol}{sale.discount_total.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{config.tax_name || 'Tax'} ({config.default_tax_rate}%):</span>
                <span>{config.currency_symbol}{sale.tax_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>TOTAL:</span>
                <span>{config.currency_symbol}{sale.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payments */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 dark:border-slate-700 pb-2">
              {sale.payments.map((p, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{p.payment_type} Tendered:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{config.currency_symbol}{p.payment_amount.toFixed(2)}</span>
                  </div>
                  {p.transaction_ref && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 italic pl-2">
                      Ref / UTR: {p.transaction_ref}
                    </div>
                  )}
                </div>
              ))}
              {sale.change_due > 0 && (
                <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 pt-0.5">
                  <span>Change Due:</span>
                  <span>{config.currency_symbol}{sale.change_due.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Barcode & Footer */}
            <div className="text-center pt-2 space-y-2">
              <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] tracking-widest uppercase border border-slate-200 dark:border-slate-700 font-bold">
                * {sale.id} *
              </div>
              {config.receipt_footer && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-pre-line">
                  {config.receipt_footer}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
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
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
