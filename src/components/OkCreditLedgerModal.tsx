import React, { useState, useMemo } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Printer, 
  Phone, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  SlidersHorizontal,
  Calendar,
  Receipt,
  Send
} from 'lucide-react';
import { Customer, Supplier, CreditLedgerEntry, StoreConfig, Sale } from '../types/pos';
import { storage } from '../services/storage';
import { sound } from '../services/audio';

interface OkCreditLedgerModalProps {
  entityType: 'customer' | 'supplier';
  entity: Customer | Supplier;
  config: StoreConfig;
  currentUserName?: string;
  sales?: Sale[];
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedEntity: Customer | Supplier) => void;
}

export const OkCreditLedgerModal: React.FC<OkCreditLedgerModalProps> = ({
  entityType,
  entity,
  config,
  currentUserName = 'Staff Member',
  sales: _sales = [],
  isOpen,
  onClose,
  onUpdated,
}) => {
  if (!isOpen) return null;

  const isCustomer = entityType === 'customer';
  const customer = isCustomer ? (entity as Customer) : null;
  const supplier = !isCustomer ? (entity as Supplier) : null;

  const displayName = isCustomer 
    ? `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() || 'Customer'
    : supplier?.company_name || 'Supplier';

  const subName = isCustomer 
    ? customer?.company_name || customer?.account_number || ''
    : supplier?.agency_name || (supplier?.first_name ? `Contact: ${supplier.first_name} ${supplier.last_name}` : '');

  const phone = entity.phone_number || '';
  const currentBalance = entity.credit_balance || 0;
  const creditLimit = entity.credit_limit || (isCustomer ? 500 : 10000);
  const ledger: CreditLedgerEntry[] = useMemo(() => {
    return entity.credit_ledger || [];
  }, [entity.credit_ledger]);

  const quickAmounts = (config.currency_symbol === '₹' || config.currency_code === 'INR') 
    ? [100, 200, 500, 1000, 2000] 
    : [10, 20, 50, 100, 200];

  // Modal active states
  const [actionModal, setActionModal] = useState<'gave' | 'got' | 'adjust' | 'share' | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareSuccessMsg, setShareSuccessMsg] = useState<string | null>(null);

  // Form states for Gave (Maine Diya) / Got (Maine Liya)
  const [txAmount, setTxAmount] = useState<string>('');
  const [txNote, setTxNote] = useState<string>('');
  const [txPaymentMethod, setTxPaymentMethod] = useState<string>('Cash');

  // Adjust balance/limit states
  const [newLimit, setNewLimit] = useState<string>(creditLimit.toString());
  const [newBalance, setNewBalance] = useState<string>(currentBalance.toString());
  const [adjustReason, setAdjustReason] = useState<string>('Balance reconciliation');

  // WhatsApp share custom phone
  const [customPhone, setCustomPhone] = useState(phone);

  // Clean phone number helper
  const cleanPhone = (p: string) => p.replace(/[^\d+]/g, '');

  // Generate OkCredit WhatsApp statement
  const generateStatementText = () => {
    const today = new Date().toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const storeBrand = (config.company_name && config.company_name !== 'Open Source POS') 
      ? config.company_name 
      : 'Nexus POS';

    if (isCustomer) {
      let msg = `*🧾 ${storeBrand.toUpperCase()} - UDHAR BAHI KHATA REMINDER*\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `👤 *Grahak / Customer:* ${displayName}\n`;
      if (phone) msg += `📞 *Phone:* ${phone}\n`;
      if (customer?.account_number) msg += `🆔 *Account:* ${customer.account_number}\n`;
      msg += `📅 *Statement Date:* ${today}\n\n`;

      if (currentBalance > 0) {
        msg += `🔴 *TOTAL DUE BALANCE (Lene Hain):* ${config.currency_symbol}${currentBalance.toFixed(2)}\n`;
        msg += `💳 *Credit Limit:* ${config.currency_symbol}${creditLimit.toFixed(2)}\n\n`;
      } else {
        msg += `🟢 *TOTAL BALANCE:* ${config.currency_symbol}0.00 (All Clear / Settled)\n\n`;
      }

      if (ledger.length > 0) {
        msg += `*Recent Bahi Khata Entries:*\n`;
        ledger.slice(0, 4).forEach(entry => {
          const isGave = entry.type === 'sale_credit';
          const sign = isGave ? '+' : '-';
          const d = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          msg += `• ${d}: ${entry.note || entry.type} (${sign}${config.currency_symbol}${entry.amount.toFixed(2)})\n`;
        });
        msg += `\n`;
      }

      if (config.upi_id) {
        msg += `📲 *Pay Online via UPI:*\n`;
        msg += `UPI ID: *${config.upi_id}*\n`;
        if (config.upi_payee_name) msg += `Payee: ${config.upi_payee_name}\n`;
        msg += `\n`;
      }

      msg += `Thank you for your business with ${storeBrand}! 🙏\n`;
      msg += `Store Contact: ${config.phone || config.email || storeBrand}\n`;
      return msg;
    } else {
      // Supplier statement
      let msg = `*🧾 ${storeBrand.toUpperCase()} - SUPPLIER LEDGER STATEMENT*\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `🏢 *Supplier / Vendor:* ${displayName}\n`;
      if (supplier?.agency_name) msg += `Agency: ${supplier.agency_name}\n`;
      if (phone) msg += `📞 *Phone:* ${phone}\n`;
      msg += `📅 *Date:* ${today}\n\n`;

      if (currentBalance > 0) {
        msg += `🔴 *PAYABLE BALANCE (Dene Hain):* ${config.currency_symbol}${currentBalance.toFixed(2)}\n\n`;
      } else {
        msg += `🟢 *BALANCE:* ${config.currency_symbol}0.00 (All Cleared)\n\n`;
      }

      if (ledger.length > 0) {
        msg += `*Recent Transactions:*\n`;
        ledger.slice(0, 4).forEach(entry => {
          const isGoods = entry.type === 'sale_credit';
          const sign = isGoods ? '+' : '-';
          const d = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          msg += `• ${d}: ${entry.note || entry.type} (${sign}${config.currency_symbol}${entry.amount.toFixed(2)})\n`;
        });
        msg += `\n`;
      }

      msg += `Shared by ${storeBrand}\n`;
      return msg;
    }
  };

  const handleShareWhatsApp = () => {
    const rawTarget = customPhone.trim() || phone;
    const cleaned = cleanPhone(rawTarget);
    const text = generateStatementText();
    const encoded = encodeURIComponent(text);

    const url = cleaned 
      ? `https://wa.me/${cleaned}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(url, '_blank');
    setShareSuccessMsg('WhatsApp statement launched!');
    setTimeout(() => setShareSuccessMsg(null), 3000);
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generateStatementText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handlePrintPassbook = () => {
    const storeBrand = config.company_name || 'Nexus POS';
    const win = window.open('', '_blank');
    if (!win) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bahi Khata Statement - ${displayName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; max-width: 800px; margin: 0 auto; }
          .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .brand { font-size: 24px; font-weight: 900; color: #0284c7; font-style: italic; }
          .summary-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; }
          .balance-due { font-size: 26px; font-weight: 900; color: #e11d48; font-family: monospace; }
          .balance-settled { font-size: 26px; font-weight: 900; color: #059669; font-family: monospace; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
          th { background: #0f172a; color: white; text-align: left; padding: 8px 10px; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
          .gave { color: #e11d48; font-weight: bold; }
          .got { color: #059669; font-weight: bold; }
          .footer { margin-top: 30px; font-size: 11px; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">${storeBrand}</div>
            <div style="font-size: 14px; font-weight: bold; color: #475569;">DIGITAL BAHI KHATA PASSBOOK</div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748b;">
            Date: ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>

        <div class="summary-card">
          <div>
            <h3 style="margin: 0 0 4px 0;">${displayName}</h3>
            <div style="font-size: 12px; color: #64748b;">Phone: ${phone || 'N/A'}</div>
            ${subName ? `<div style="font-size: 12px; color: #64748b;">Info: ${subName}</div>` : ''}
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b;">
              ${isCustomer ? 'Net Due to Store' : 'Net Payable Balance'}
            </div>
            <div class="${currentBalance > 0 ? 'balance-due' : 'balance-settled'}">
              ${config.currency_symbol}${currentBalance.toFixed(2)}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Details / Note</th>
              <th>Mode / Ref</th>
              <th style="text-align: right;">${isCustomer ? 'Maine Diya (You Gave)' : 'Maine Liya (Bill)'}</th>
              <th style="text-align: right;">${isCustomer ? 'Maine Liya (You Got)' : 'Maine Diya (Paid)'}</th>
              <th style="text-align: right;">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${ledger.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding: 20px;">No transaction entries found</td></tr>' : ''}
            ${ledger.map(entry => {
              const isGave = entry.type === 'sale_credit';
              const isPayment = entry.type === 'payment_received';
              const dateFormatted = new Date(entry.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
              return `
                <tr>
                  <td>${dateFormatted}</td>
                  <td>${entry.note || entry.type}</td>
                  <td>${entry.payment_method || (entry.sale_id ? `Bill #${entry.sale_id}` : '-')}</td>
                  <td style="text-align: right;" class="${isGave ? 'gave' : ''}">${isGave ? `${config.currency_symbol}${entry.amount.toFixed(2)}` : '-'}</td>
                  <td style="text-align: right;" class="${isPayment ? 'got' : ''}">${isPayment ? `${config.currency_symbol}${entry.amount.toFixed(2)}` : '-'}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold;">${config.currency_symbol}${entry.balance_after.toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          Generated via Nexus POS Digital Bahi Khata • Store Contact: ${config.phone || config.email || storeBrand}
        </div>
      </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 400);
  };

  // Submit "You Gave" (Maine Diya)
  const handleSubmitGave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(txAmount);
    if (!val || val <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }

    if (isCustomer) {
      const updated = storage.addCustomerCreditEntry(
        entity.id,
        val,
        'sale_credit',
        txNote.trim() || 'Credit Sale / Item Given (Maine Diya)',
        txPaymentMethod,
        currentUserName
      );
      if (updated) {
        sound.playCashDrawer();
        onUpdated(updated);
      }
    } else {
      // For Supplier, "You Gave" means you paid supplier (Maine Diya payment)
      const updated = storage.addSupplierCreditEntry(
        entity.id,
        val,
        'payment_received',
        txNote.trim() || 'Payment Sent to Vendor (Maine Diya)',
        txPaymentMethod,
        currentUserName
      );
      if (updated) {
        sound.playCashDrawer();
        onUpdated(updated);
      }
    }

    setTxAmount('');
    setTxNote('');
    setActionModal(null);
  };

  // Submit "You Got" (Maine Liya)
  const handleSubmitGot = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(txAmount);
    if (!val || val <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }

    if (isCustomer) {
      // For customer, "You Got" means payment received (Maine Liya)
      const updated = storage.addCustomerCreditEntry(
        entity.id,
        val,
        'payment_received',
        txNote.trim() || 'Payment Received (Maine Liya)',
        txPaymentMethod,
        currentUserName
      );
      if (updated) {
        sound.playSuccess();
        onUpdated(updated);
      }
    } else {
      // For Supplier, "You Got" means Goods / Purchase bill received on credit (Maine Liya bill)
      const updated = storage.addSupplierCreditEntry(
        entity.id,
        val,
        'sale_credit',
        txNote.trim() || 'Stock / Goods Received on Credit (Maine Liya)',
        txPaymentMethod,
        currentUserName
      );
      if (updated) {
        sound.playSuccess();
        onUpdated(updated);
      }
    }

    setTxAmount('');
    setTxNote('');
    setActionModal(null);
  };

  // Submit Adjust Balance / Credit Limit
  const handleSubmitAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    const bal = parseFloat(newBalance);
    const lim = parseFloat(newLimit);
    if (isNaN(bal) || isNaN(lim)) {
      alert('Please enter valid numeric values for balance and limit.');
      return;
    }

    if (isCustomer) {
      const updated = storage.adjustCustomerCredit(
        entity.id,
        bal,
        lim,
        adjustReason.trim() || 'Manual balance/limit reconciliation',
        currentUserName
      );
      if (updated) {
        sound.playSuccess();
        onUpdated(updated);
      }
    } else {
      const updated = storage.adjustSupplierCredit(
        entity.id,
        bal,
        lim,
        adjustReason.trim() || 'Supplier terms adjustment',
        currentUserName
      );
      if (updated) {
        sound.playSuccess();
        onUpdated(updated);
      }
    }

    setActionModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* OkCredit Signature Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shadow-sm ${
              isCustomer 
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                : 'bg-slate-800 text-slate-200 border border-slate-700'
            }`}>
              {displayName.slice(0, 2).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white leading-tight">
                  {displayName}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-slate-800 text-slate-300 border border-slate-700">
                  {isCustomer ? 'Grahak Khata' : 'Vyapari Khata'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                {phone ? (
                  <a href={`tel:${phone}`} className="hover:text-white flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{phone}</span>
                  </a>
                ) : (
                  <span>No phone attached</span>
                )}
                {subName && <span>• {subName}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActionModal('share')}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Share Statement via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={handlePrintPassbook}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
              title="Print Passbook Statement"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActionModal('adjust')}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
              title="Settings & Credit Terms"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* OkCredit Net Balance Banner Card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            currentBalance > 0
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60'
          }`}>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
                {currentBalance > 0 ? (
                  <span className="text-rose-700 dark:text-rose-400 flex items-center gap-1">
                    <ArrowDownLeft className="w-4 h-4" />
                    {isCustomer ? 'Total Due (Lene Hain / You will get)' : 'Total Payable (Dene Hain / You will pay)'}
                  </span>
                ) : (
                  <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Account Settled (All Cleared)
                  </span>
                )}
              </div>

              <div className="text-2xl sm:text-3xl font-black font-mono mt-1">
                <span className={currentBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                  {config.currency_symbol}{currentBalance.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isCustomer ? 'Credit Limit' : 'Vendor Credit Limit'}
              </span>
              <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                {config.currency_symbol}{creditLimit.toFixed(2)}
              </span>
              {isCustomer && (
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Available: {config.currency_symbol}{Math.max(0, creditLimit - currentBalance).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Khata Entries Passbook Timeline */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800">
            <span>Passbook Entries ({ledger.length})</span>
            <span className="flex items-center gap-3">
              <span className="text-rose-600 dark:text-rose-400">{isCustomer ? '🔴 Diya (Gave)' : '🔴 Liya (Bill)'}</span>
              <span className="text-emerald-600 dark:text-emerald-400">{isCustomer ? '🟢 Liya (Got)' : '🟢 Diya (Paid)'}</span>
            </span>
          </div>

          {ledger.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                <Receipt className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Khata Entries Yet</h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Record credit transactions below using <strong className="text-rose-600 font-bold">Gave</strong> or <strong className="text-emerald-600 font-bold">Got</strong> buttons.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {ledger.map(entry => {
                const isGave = entry.type === 'sale_credit';
                const entryDate = new Date(entry.date);
                const dateStr = entryDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                const timeStr = entryDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div 
                    key={entry.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                        isGave 
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {isGave ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {entry.note || (isGave ? 'Credit Sale' : 'Payment Received')}
                          </span>
                          {entry.sale_id && (
                            <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-mono font-bold">
                              #{entry.sale_id}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {dateStr} at {timeStr}
                          </span>
                          {entry.payment_method && (
                            <span>• Mode: <strong className="text-slate-700 dark:text-slate-300">{entry.payment_method}</strong></span>
                          )}
                          {entry.recorded_by && (
                            <span>• By: {entry.recorded_by}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount & Balance column */}
                    <div className="text-right shrink-0">
                      <div className={`text-sm sm:text-base font-black font-mono ${
                        isGave 
                          ? 'text-rose-600 dark:text-rose-400' 
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {isGave ? '+' : '-'}{config.currency_symbol}{entry.amount.toFixed(2)}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        Bal: {config.currency_symbol}{entry.balance_after.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* OkCredit Signature Bottom Dual Action Bar */}
        <div className="p-3 sm:p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3 shrink-0">
          {/* YOU GAVE (Maine Diya) Button */}
          <button
            type="button"
            onClick={() => {
              setTxAmount('');
              setTxNote('');
              setActionModal('gave');
            }}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <div className="text-left leading-tight">
              <span className="block text-[10px] opacity-80 uppercase tracking-wider">{isCustomer ? 'Maine Diya' : 'Vendor Payment'}</span>
              <span>{isCustomer ? `YOU GAVE ${config.currency_symbol}` : `YOU PAID ${config.currency_symbol}`}</span>
            </div>
          </button>

          {/* YOU GOT (Maine Liya) Button */}
          <button
            type="button"
            onClick={() => {
              setTxAmount('');
              setTxNote('');
              setActionModal('got');
            }}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
            <div className="text-left leading-tight">
              <span className="block text-[10px] opacity-80 uppercase tracking-wider">{isCustomer ? 'Maine Liya' : 'Stock Received'}</span>
              <span>{isCustomer ? `YOU GOT ${config.currency_symbol}` : `YOU RECEIVED ${config.currency_symbol}`}</span>
            </div>
          </button>
        </div>

      </div>

      {/* Sub-modal: Record Entry (Gave / Got) */}
      {(actionModal === 'gave' || actionModal === 'got') && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl text-white ${actionModal === 'gave' ? 'bg-rose-600' : 'bg-emerald-600'}`}>
                  {actionModal === 'gave' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {actionModal === 'gave' 
                      ? (isCustomer ? 'Record Udhar / Credit (Maine Diya)' : 'Record Payment to Supplier')
                      : (isCustomer ? 'Record Payment Received (Maine Liya)' : 'Record Stock / Bill Received')}
                  </h4>
                  <span className="text-xs text-slate-500">{displayName}</span>
                </div>
              </div>
              <button onClick={() => setActionModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={actionModal === 'gave' ? handleSubmitGave : handleSubmitGot} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Amount ({config.currency_symbol}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold font-mono text-slate-400 text-base">
                    {config.currency_symbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    autoFocus
                    placeholder="0.00"
                    value={txAmount}
                    onChange={e => setTxAmount(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-lg font-black font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {quickAmounts.map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTxAmount(amt.toString())}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      +{config.currency_symbol}{amt}
                    </button>
                  ))}
                  {currentBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => setTxAmount(currentBalance.toFixed(2))}
                      className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[11px] font-mono font-bold"
                    >
                      Full Due ({config.currency_symbol}{currentBalance.toFixed(2)})
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method / Channel
                </label>
                <select
                  value={txPaymentMethod}
                  onChange={e => setTxPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100"
                >
                  <option value="Cash">Cash Payment</option>
                  <option value="UPI / QR Code">UPI / QR Code / GPay / PhonePe</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                  <option value="Cheque">Cheque / Demand Draft</option>
                  <option value="Store Credit">On Account Credit</option>
                </select>
              </div>

              {/* Note / Bill Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Item Note / Bill Ref
                </label>
                <input
                  type="text"
                  placeholder={actionModal === 'gave' ? 'e.g. Grocery items, Milk bill, Order #12' : 'e.g. Cleared via PhonePe UPI, Cash deposit'}
                  value={txNote}
                  onChange={e => setTxNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-black text-white shadow-md transition-all ${
                    actionModal === 'gave' 
                      ? 'bg-rose-600 hover:bg-rose-700' 
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-modal: WhatsApp Share & Statement Generator */}
      {actionModal === 'share' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-600 text-white">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Send WhatsApp Bahi Khata Statement
                  </h4>
                  <span className="text-xs text-slate-500">Nexus POS Instant Mobile Reminder</span>
                </div>
              </div>
              <button onClick={() => setActionModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {shareSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs rounded-xl font-bold">
                {shareSuccessMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Recipient WhatsApp Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={customPhone}
                  onChange={e => setCustomPhone(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Message Preview */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
                <span>Message Preview</span>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>
              <textarea
                readOnly
                rows={7}
                value={generateStatementText()}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 select-all"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal: Adjust Credit Terms & Balance */}
      {actionModal === 'adjust' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-800 text-sky-400">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Adjust Khata Balance & Limit
                  </h4>
                  <span className="text-xs text-slate-500">{displayName}</span>
                </div>
              </div>
              <button onClick={() => setActionModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdjust} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Corrected Balance ({config.currency_symbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={newBalance}
                  onChange={e => setNewBalance(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Credit Limit ({config.currency_symbol})
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={newLimit}
                  onChange={e => setNewLimit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  placeholder="e.g. Month-end reconciliation, credit limit raise"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-colors"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
