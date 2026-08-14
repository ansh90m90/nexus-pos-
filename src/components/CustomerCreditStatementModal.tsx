import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  MessageSquare, 
  Smartphone, 
  Copy, 
  Check, 
  Printer, 
  CreditCard, 
  DollarSign, 
  Phone, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PlusCircle, 
  Edit2, 
  QrCode,
  Send
} from 'lucide-react';
import { Customer, Sale, StoreConfig } from '../types/pos';
import { storage } from '../services/storage';

interface CustomerCreditStatementModalProps {
  customer: Customer;
  sales: Sale[];
  config: StoreConfig;
  currentUserName: string;
  onClose: () => void;
  onCustomerUpdated: (updatedCustomer: Customer) => void;
}

export const CustomerCreditStatementModal: React.FC<CustomerCreditStatementModalProps> = ({
  customer,
  sales: _sales,
  config,
  currentUserName,
  onClose,
  onCustomerUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'statement' | 'record_payment' | 'manage_limit'>('statement');
  const [copied, setCopied] = useState(false);
  const [customPhone, setCustomPhone] = useState(customer.phone_number || '');
  const [shareSuccessMsg, setShareSuccessMsg] = useState<string | null>(null);

  // Payment Recording State
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<string>('Cash');
  const [payNote, setPayNote] = useState<string>('Payment received towards balance');

  // Limit Adjustment State
  const [newLimit, setNewLimit] = useState<string>((customer.credit_limit || 500).toString());
  const [newBalance, setNewBalance] = useState<string>((customer.credit_balance || 0).toString());
  const [adjustNote, setAdjustNote] = useState<string>('Credit terms update');

  const creditBalance = customer.credit_balance || 0;
  const creditLimit = customer.credit_limit || 500;
  const availableCredit = Math.max(0, creditLimit - creditBalance);
  const ledger = customer.credit_ledger || [];

  // Generate plain text formatted statement for WhatsApp & SMS
  const generateStatementText = (): string => {
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let text = `*🧾 ${config.company_name.toUpperCase()} - ACCOUNT STATEMENT*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👤 *Customer:* ${customer.first_name} ${customer.last_name}\n`;
    if (customer.account_number) text += `🆔 *Account No:* ${customer.account_number}\n`;
    if (customer.phone_number) text += `📞 *Phone:* ${customer.phone_number}\n`;
    text += `📅 *Date:* ${dateStr}\n\n`;

    text += `💰 *OUTSTANDING DUE BALANCE:* ${config.currency_symbol}${creditBalance.toFixed(2)}\n`;
    text += `💳 *Credit Limit:* ${config.currency_symbol}${creditLimit.toFixed(2)}\n`;
    text += `✨ *Available Credit:* ${config.currency_symbol}${availableCredit.toFixed(2)}\n`;
    text += `⭐ *Loyalty Points:* ${customer.points} pts\n\n`;

    if (ledger.length > 0) {
      text += `*Recent Credit Transactions:*\n`;
      ledger.slice(0, 4).forEach(entry => {
        const sign = entry.type === 'payment_received' ? '-' : '+';
        const d = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        text += `• ${d}: ${entry.note || entry.type} (${sign}${config.currency_symbol}${entry.amount.toFixed(2)})\n`;
      });
      text += `\n`;
    }

    if (config.upi_id) {
      text += `📲 *Pay via UPI:* ${config.upi_id}\n`;
      if (config.upi_payee_name) text += `Payee: ${config.upi_payee_name}\n`;
    }

    text += `\nThank you for shopping with us! 🙏\n`;
    text += `Store Contact: ${config.phone || config.email || config.company_name}\n`;
    if (config.website) text += `🌐 ${config.website}\n`;

    return text;
  };

  const cleanPhoneNumber = (phone: string): string => {
    return phone.replace(/[^\d+]/g, '');
  };

  // 1. Share via WhatsApp
  const handleShareWhatsApp = () => {
    const rawPhone = customPhone.trim() || customer.phone_number;
    const cleaned = cleanPhoneNumber(rawPhone);
    const message = generateStatementText();
    const encoded = encodeURIComponent(message);

    // If country code is not present and phone length is 10 digits, we can prepend or let WhatsApp handle
    const targetUrl = cleaned 
      ? `https://wa.me/${cleaned}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(targetUrl, '_blank');
    showNotification('Statement opened in WhatsApp!');
  };

  // 2. Share via Phone SMS / Text Messages
  const handleShareSMS = () => {
    const rawPhone = customPhone.trim() || customer.phone_number;
    const cleaned = cleanPhoneNumber(rawPhone);
    const message = generateStatementText();
    const encoded = encodeURIComponent(message);

    // iOS and Android SMS URI format support
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const delimiter = isIOS ? '&' : '?';
    const smsUrl = cleaned 
      ? `sms:${cleaned}${delimiter}body=${encoded}`
      : `sms:${delimiter}body=${encoded}`;

    window.location.href = smsUrl;
    showNotification('Statement opened in Messages app!');
  };

  // 3. Native Mobile Device Share Sheet
  const handleNativeShare = async () => {
    const message = generateStatementText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${config.company_name} - Credit Statement for ${customer.first_name}`,
          text: message,
        });
        showNotification('Shared successfully!');
      } catch (err) {
        if ((err as any)?.name !== 'AbortError') {
          handleCopyText();
        }
      }
    } else {
      handleCopyText();
    }
  };

  // 4. Copy to Clipboard
  const handleCopyText = () => {
    const message = generateStatementText();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message).then(() => {
        setCopied(true);
        showNotification('Statement copied to clipboard!');
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  // 5. Print Statement
  const handlePrint = () => {
    window.print();
  };

  const showNotification = (msg: string) => {
    setShareSuccessMsg(msg);
    setTimeout(() => setShareSuccessMsg(null), 3000);
  };

  // Handle Recording Payment
  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    const updated = storage.recordCustomerCreditPayment(
      customer.id,
      amt,
      payMethod,
      payNote.trim() || 'Payment received towards balance',
      currentUserName
    );

    if (updated) {
      onCustomerUpdated(updated);
      setPayAmount('');
      setActiveTab('statement');
      showNotification(`Recorded ${config.currency_symbol}${amt.toFixed(2)} payment successfully!`);
    }
  };

  // Handle Limit & Balance Adjustment
  const handleAdjustLimitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(newLimit);
    const balance = parseFloat(newBalance);

    if (isNaN(limit) || isNaN(balance)) {
      alert('Please enter valid numerical values.');
      return;
    }

    const updated = storage.adjustCustomerCredit(
      customer.id,
      balance,
      limit,
      adjustNote.trim() || 'Manual adjustment',
      currentUserName
    );

    if (updated) {
      onCustomerUpdated(updated);
      setActiveTab('statement');
      showNotification('Credit terms updated successfully!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="bg-slate-900 dark:bg-slate-950 px-5 py-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Customer Credit Statement</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                  {customer.account_number || 'ACC-CRM'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {customer.first_name} {customer.last_name} • {customer.phone_number || 'No phone'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-850 px-4 pt-2 border-b border-slate-200 dark:border-slate-800 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('statement')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'statement'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-900 rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Statement & Sharing</span>
          </button>

          <button
            onClick={() => setActiveTab('record_payment')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'record_payment'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Record Payment / Clear Due</span>
          </button>

          <button
            onClick={() => setActiveTab('manage_limit')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'manage_limit'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Adjust Credit Limit</span>
          </button>
        </div>

        {/* Success Toast */}
        {shareSuccessMsg && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-center gap-2 animate-in fade-in duration-150 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            <span>{shareSuccessMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: STATEMENT & SHARING */}
          {activeTab === 'statement' && (
            <div className="space-y-4">
              
              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`p-4 rounded-xl border ${
                  creditBalance > 0 
                    ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-200' 
                    : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200'
                }`}>
                  <span className="text-[11px] font-bold uppercase tracking-wider block opacity-75">
                    Outstanding Due Balance
                  </span>
                  <div className="text-2xl font-black font-mono mt-1">
                    {config.currency_symbol}{creditBalance.toFixed(2)}
                  </div>
                  <span className="text-[10px] mt-1 block font-medium opacity-80">
                    {creditBalance > 0 ? 'Payment pending from customer' : 'Account is fully settled'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Credit Limit / Available
                  </span>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {config.currency_symbol}{availableCredit.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                    Total limit: {config.currency_symbol}{creditLimit.toFixed(2)}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Loyalty & Lifetime Spend
                  </span>
                  <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                    {customer.points} <span className="text-xs font-normal text-slate-500">pts</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                    Lifetime: {config.currency_symbol}{customer.total_spent.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Instant Multi-Channel Sharing Actions */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 dark:from-sky-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-sky-200/80 dark:border-sky-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Instant Share Statement to Phone & WhatsApp
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    Direct Send
                  </span>
                </div>

                {/* Recipient Phone Input */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={customPhone}
                      onChange={e => setCustomPhone(e.target.value)}
                      placeholder="Recipient Phone (e.g. +1 555-234-5678)"
                      className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Sharing Buttons Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {/* WhatsApp Button */}
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-[1.02]"
                    title="Send statement via WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>

                  {/* Phone SMS Button */}
                  <button
                    onClick={handleShareSMS}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-[1.02]"
                    title="Send via Phone Text Messages (SMS)"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>SMS / Text</span>
                  </button>

                  {/* Phone Native Share Sheet */}
                  <button
                    onClick={handleNativeShare}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-[1.02]"
                    title="Open device native share dialog"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share App</span>
                  </button>

                  {/* Copy Button */}
                  <button
                    onClick={handleCopyText}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                    title="Copy statement message"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                </div>
              </div>

              {/* Statement Preview Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{config.company_name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{config.address}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">Statement Preview</span>
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline mt-0.5 ml-auto"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>

                {/* Ledger & History Table */}
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
                    <span>Credit Transactions & Settlement Ledger</span>
                    <span className="text-[10px] font-normal text-slate-500">Showing last {ledger.length} entries</span>
                  </h5>

                  {ledger.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      No previous credit entries recorded for this account.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {ledger.map(entry => {
                        const isPayment = entry.type === 'payment_received';
                        return (
                          <div
                            key={entry.id}
                            className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-[11px]"
                          >
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded-full ${
                                isPayment 
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' 
                                  : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                              }`}>
                                {isPayment ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                                  {entry.note || (isPayment ? 'Payment Received' : 'On Account Purchase')}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                  {new Date(entry.date).toLocaleString()} {entry.recorded_by ? `• By ${entry.recorded_by}` : ''}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className={`font-mono font-bold ${
                                isPayment ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}>
                                {isPayment ? '-' : '+'}{config.currency_symbol}{entry.amount.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                Bal: {config.currency_symbol}{entry.balance_after.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Payment Instructions & UPI Note */}
                {config.upi_id && (
                  <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 flex items-center justify-between text-[11px] text-sky-900 dark:text-sky-200">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span><strong>UPI ID for payment:</strong> {config.upi_id}</span>
                    </div>
                    <span className="font-semibold">{config.upi_payee_name || config.company_name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RECORD PAYMENT / SETTLE DUE */}
          {activeTab === 'record_payment' && (
            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                <div>
                  <strong>Current Outstanding Due:</strong> {config.currency_symbol}{creditBalance.toFixed(2)}
                </div>
                <button
                  type="button"
                  onClick={() => setPayAmount(creditBalance.toFixed(2))}
                  className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 transition-colors"
                >
                  Pay Full Balance
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount Received ({config.currency_symbol}) *
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Cash', 'UPI / QR Code', 'Check', 'Bank Transfer'].map(mode => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setPayMethod(mode)}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                        payMethod === mode
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction Reference / Notes
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={e => setPayNote(e.target.value)}
                  placeholder="e.g. UPI txn ref / Cash counter receipt"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('statement')}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Record Payment & Settle
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ADJUST CREDIT LIMIT & BALANCE */}
          {activeTab === 'manage_limit' && (
            <form onSubmit={handleAdjustLimitSubmit} className="space-y-4">
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                <strong>Account Adjustments:</strong> Set custom credit limit terms and reconcile account balance.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Credit Limit ({config.currency_symbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newLimit}
                    onChange={e => setNewLimit(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Outstanding Balance ({config.currency_symbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newBalance}
                    onChange={e => setNewBalance(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={e => setAdjustNote(e.target.value)}
                  placeholder="e.g. VIP approved limit upgrade"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('statement')}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Save Credit Terms
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Smartphone className="w-3.5 h-3.5 text-sky-500" />
            <span>Mobile statement sharing enabled</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
