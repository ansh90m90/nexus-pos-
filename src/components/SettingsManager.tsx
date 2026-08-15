import React, { useState } from 'react';
import { Sliders, Save, Download, Upload, RotateCcw, CheckCircle, Volume2, Store, Palette, Moon, Sun, QrCode, Smartphone, Copy, Check, Cloud, ArrowRight, Gift, Award, Sparkles, CheckCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { StoreConfig } from '../types/pos';
import { storage } from '../services/storage';

interface SettingsManagerProps {
  config: StoreConfig;
  onSaveConfig: (config: StoreConfig) => void;
  onReloadAllData: () => void;
  onOpenCloudSync?: () => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  config,
  onSaveConfig,
  onReloadAllData,
  onOpenCloudSync,
}) => {
  const [formData, setFormData] = useState<StoreConfig>(config);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedPreviewUpi, setCopiedPreviewUpi] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDownloadBackup = () => {
    const jsonStr = storage.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ospos_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content && storage.importData(content)) {
        alert('Database restored successfully!');
        onReloadAllData();
      } else {
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearStoreData = () => {
    if (window.confirm('Are you sure you want to erase all products, customers, sales records, and inventory data to start with a clean store?')) {
      storage.clearAllStoreData();
      alert('All products, customers, and transactions cleared.');
      onReloadAllData();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>Store Configuration & Preferences</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Theme mode, receipt customization, currency symbol, default tax rates, and database backup</p>
        </div>

        {saveSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-lg animate-in fade-in border border-emerald-300 dark:border-emerald-800">
            <CheckCircle className="w-4 h-4" />
            <span>Settings Saved!</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Theme & Display Styling */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Palette className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Visual Theme & Appearance</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Display Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, theme: 'light' })}
                  className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                    formData.theme === 'light'
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 ring-1 ring-sky-500 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="text-xs font-bold">Clean Light</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">High clarity daytime UI</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, theme: 'dark' })}
                  className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                    formData.theme === 'dark'
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 ring-1 ring-sky-500 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <Moon className="w-4 h-4 text-sky-400" />
                  <div>
                    <div className="text-xs font-bold">Midnight Dark</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Low-glare high-contrast</div>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Sound & Feedback</label>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.enable_sound}
                    onChange={e => setFormData({ ...formData, enable_sound: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500 w-4 h-4"
                  />
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">Register Audio Feedback</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Beep sound on scans & payments</div>
                    </div>
                  </div>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    storage.saveConfig(formData);
                    import('../services/audio').then(m => {
                      m.sound.setEnabled(formData.enable_sound);
                      m.sound.playSuccess();
                    });
                  }}
                  className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded text-[11px] font-semibold"
                >
                  Test Sound
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Store Profile */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Store className="w-4 h-4 text-slate-500" />
            <span>Business Profile</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company / Store Name *</label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Store Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Store Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Website URL</label>
              <input
                type="text"
                value={formData.website}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Physical Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Sales & Tax Rules */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            POS Tax & Currency Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={formData.currency_symbol}
                onChange={e => setFormData({ ...formData, currency_symbol: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Default Sales Tax (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.default_tax_rate}
                onChange={e => setFormData({ ...formData, default_tax_rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Loyalty & Customer Rewards Program */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-500" />
              <span>Customer Loyalty & Rewards Program</span>
            </h3>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
              formData.enable_loyalty !== false
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
            }`}>
              {formData.enable_loyalty !== false ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control whether customer point accrual and reward redemption are active during checkout transactions.
          </p>

          <div className="space-y-4 pt-1">
            {/* Master Toggle */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-start sm:items-center gap-3 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.enable_loyalty !== false}
                  onChange={e => setFormData({ ...formData, enable_loyalty: e.target.checked })}
                  className="rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500 w-4 h-4 mt-0.5 sm:mt-0"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>Enable Loyalty Rewards System</span>
                    {formData.enable_loyalty !== false && (
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Allow registered customers to accumulate points on purchases and redeem discounts
                  </div>
                </div>
              </label>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, enable_loyalty: !(formData.enable_loyalty !== false) })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  formData.enable_loyalty !== false
                    ? 'bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                }`}
              >
                {formData.enable_loyalty !== false ? 'Disable Loyalty' : 'Enable Loyalty'}
              </button>
            </div>

            {/* Additional Loyalty Settings if Enabled */}
            {formData.enable_loyalty !== false ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Point Earning Ratio (Points per {formData.currency_symbol}1 spent)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formData.loyalty_points_ratio || 1}
                    onChange={e => setFormData({ ...formData, loyalty_points_ratio: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                    Default is 1 point per {formData.currency_symbol}1 total order value
                  </span>
                </div>

                <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                    <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>POS Register Behavior</span>
                  </div>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                    When attached to a sale, customer points display in the cart header. At 50+ points, a 1-click &quot;Redeem 50 pts ({formData.currency_symbol}2.50)&quot; button is available.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-750 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                  <CheckCheck className="w-4 h-4 text-slate-500" />
                  <span>Loyalty is currently turned off</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Points will not be credited or prompted at checkout, and loyalty points banners will be hidden in the register cart for faster streamlined billing.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* UPI / QR Code Payment Configuration */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>UPI / QR Code Digital Payment Settings</span>
            </h3>
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-md border border-emerald-300 dark:border-emerald-800">
              Active in POS
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure your merchant Virtual Payment Address (VPA) / UPI ID. During checkout, POS dynamically generates an instant UPI QR code prefilled with the exact payable amount for Google Pay, PhonePe, Paytm, BHIM, and any bank UPI app.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start pt-1">
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Merchant UPI ID (VPA) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. yourstore@okhdfcbank"
                      value={formData.upi_id || ''}
                      onChange={e => setFormData({ ...formData, upi_id: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                    Supported: @okhdfcbank, @icici, @paytm, @ybl, @axl, etc.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    UPI Payee / Business Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Open Source POS Retail"
                    value={formData.upi_payee_name || ''}
                    onChange={e => setFormData({ ...formData, upi_payee_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                    Shown to customer on their UPI payment screen
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Default Transaction Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. POS Order Payment"
                  value={formData.upi_qr_note || ''}
                  onChange={e => setFormData({ ...formData, upi_qr_note: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Supported Apps Badges */}
              <div>
                <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Customer Compatible Apps
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI', 'Cred', 'Amazon Pay', 'Any Bank UPI App'].map(app => (
                    <span
                      key={app}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[11px] font-medium border border-slate-200 dark:border-slate-700/80 flex items-center gap-1.5"
                    >
                      <Smartphone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{app}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* QR Preview Card */}
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-2.5">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Live QR Preview
              </span>

              <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 inline-block">
                <QRCodeSVG
                  value={`upi://pay?pa=${encodeURIComponent(formData.upi_id || 'osposstore@okhdfcbank')}&pn=${encodeURIComponent(formData.upi_payee_name || formData.company_name || 'OSPOS Retail')}&am=10.00&cu=INR&tn=${encodeURIComponent(formData.upi_qr_note || 'POS Order Payment')}`}
                  size={120}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <div className="space-y-0.5 w-full">
                <div className="flex items-center justify-center gap-1.5">
                  <p className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 truncate max-w-[170px]">
                    {formData.upi_id || 'osposstore@okhdfcbank'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(formData.upi_id || 'osposstore@okhdfcbank');
                        setCopiedPreviewUpi(true);
                        setTimeout(() => setCopiedPreviewUpi(false), 2000);
                      }
                    }}
                    className="p-0.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                    title="Copy UPI ID"
                  >
                    {copiedPreviewUpi ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {formData.upi_payee_name || formData.company_name}
                </p>
              </div>

              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900 font-semibold">
                Dynamic QR with Amount generated at POS
              </span>
            </div>
          </div>
        </div>

        {/* Receipt Branding */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Thermal Receipt Template
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Receipt Header Message</label>
            <textarea
              rows={2}
              value={formData.receipt_header}
              onChange={e => setFormData({ ...formData, receipt_header: e.target.value })}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Receipt Footer Message</label>
            <textarea
              rows={2}
              value={formData.receipt_footer}
              onChange={e => setFormData({ ...formData, receipt_footer: e.target.value })}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </form>

      {/* Cloud Sync & Google Account Card */}
      {onOpenCloudSync && (
        <div className="bg-gradient-to-r from-sky-950/30 to-indigo-950/30 dark:from-sky-950/40 dark:to-indigo-950/40 p-5 rounded-xl border border-sky-300/40 dark:border-sky-800/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-600/20 text-sky-500 rounded-xl border border-sky-500/30 shrink-0">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Nexus Cloud Sync & Multi-Terminal Backup
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
                Connect your Google Account to synchronize catalog items, customer balances, and sales receipts in real-time across tablets, laptops, and back-office dashboards.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenCloudSync}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap shadow-xs shrink-0"
          >
            <span>Open Cloud Settings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Database Maintenance & Backup Section */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          Database Backup & Data Management
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Export your current items, sales history, customer database, and store settings as a JSON archive, or restore from a previously saved file.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-750 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Database JSON</span>
          </button>

          <label className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Restore from File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreBackup}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleClearStoreData}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-semibold transition-colors ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Products & Customers</span>
          </button>
        </div>
      </div>
    </div>
  );
};
