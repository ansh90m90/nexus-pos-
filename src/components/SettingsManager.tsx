import React, { useState, useEffect, useRef } from 'react';
import { 
  Sliders, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle, 
  Volume2, 
  Store, 
  Palette, 
  Moon, 
  Sun, 
  QrCode, 
  Smartphone, 
  Copy, 
  Check, 
  Cloud, 
  ArrowRight, 
  Gift, 
  Award, 
  Sparkles, 
  CheckCheck,
  Globe,
  Coins,
  AlertCircle,
  X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { StoreConfig } from '../types/pos';
import { storage } from '../services/storage';
import { COUNTRY_CURRENCY_PRESETS, getCountryPreset } from '../constants/countries';
import { formatMoney } from '../utils/currency';
import { THEME_COLOR_PALETTES, getThemePalette, applyThemePaletteToDom } from '../constants/themes';

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
  const [showUnsavedToast, setShowUnsavedToast] = useState(false);
  const toastTimeoutRef = useRef<number | null>(null);

  // Check if current form is dirty (modified from saved config)
  const isDirty = JSON.stringify(formData) !== JSON.stringify(config);

  // Trigger floating prompt when settings are changed
  useEffect(() => {
    if (isDirty) {
      setShowUnsavedToast(true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      // Auto dismiss after 8 seconds (can also be saved directly)
      toastTimeoutRef.current = window.setTimeout(() => {
        setShowUnsavedToast(false);
      }, 8000);
    } else {
      setShowUnsavedToast(false);
    }

    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [formData, isDirty]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSaveConfig(formData);
    setSaveSuccess(true);
    setShowUnsavedToast(false);
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
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Visual Theme & Color Combinations</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Customize display mode, acoustic feedback, and 4 curated theme color palettes
              </p>
            </div>
            {formData.color_palette && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 self-start sm:self-auto font-mono">
                Active: {getThemePalette(formData.color_palette).label}
              </span>
            )}
          </div>

          {/* 4 Theme Color Combinations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Curated Theme Color Combinations
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Click any combination to apply immediately
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {THEME_COLOR_PALETTES.map((palette) => {
                const isSelected = (formData.color_palette || 'palette-1') === palette.id;
                const isDark = formData.theme === 'dark';
                const activeColors = isDark ? palette.darkColors : palette.lightColors;
                const activeDescription = isDark ? palette.descriptionDark : palette.descriptionLight;

                return (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, color_palette: palette.id });
                      applyThemePaletteToDom(palette.id, isDark);
                    }}
                    className={`relative p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-850 shadow-md ring-2 ring-slate-900 dark:ring-slate-100'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-xs'
                    }`}
                  >
                    {/* Header with Title & Active Indicator */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black uppercase tracking-wider ${
                            isSelected ? 'text-slate-950 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {palette.label}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            — {palette.name}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                          {activeDescription}
                        </div>
                      </div>

                      {isSelected && (
                        <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    {/* 4 Hex Swatches Grid */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {activeColors.map((hex, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <div
                            className="w-full h-8 rounded-md shadow-inner border border-black/10 dark:border-white/10 transition-transform group-hover:scale-105"
                            style={{ backgroundColor: hex }}
                            title={`Color ${idx + 1}: ${hex}`}
                          />
                          <span className="text-[9px] font-mono font-bold text-slate-600 dark:text-slate-400">
                            {hex.replace('#', '')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Display Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, theme: 'light' });
                    applyThemePaletteToDom(formData.color_palette || 'palette-1', false);
                  }}
                  className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                    formData.theme === 'light'
                      ? 'border-slate-900 dark:border-slate-100 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 ring-2 ring-slate-900 dark:ring-slate-100 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <Sun className="w-4 h-4 opacity-80" />
                  <div>
                    <div className="text-xs font-bold">Clean Light</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">High clarity daytime UI</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, theme: 'dark' });
                    applyThemePaletteToDom(formData.color_palette || 'palette-1', true);
                  }}
                  className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                    formData.theme === 'dark'
                      ? 'border-slate-900 dark:border-slate-100 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 ring-2 ring-slate-900 dark:ring-slate-100 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <Moon className="w-4 h-4 opacity-80" />
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
                    className="rounded border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-slate-500 w-4 h-4"
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
                  className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded text-[11px] font-semibold cursor-pointer"
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
            <Store className="w-4 h-4 opacity-75" />
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
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Store Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-slate-500 focus:outline-none"
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
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Website URL</label>
              <input
                type="text"
                value={formData.website}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Physical Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Country-Based Money & Currency System */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 opacity-80" />
                <span>Country & Currency Money System</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Configure international currency symbol, decimal grouping system (Rupee Lakhs/Crores vs Dollar Millions), and country tax regimes.
              </p>
            </div>

            {/* Live Money Preview */}
            <div className="px-3 py-1.5 bg-slate-900 text-white dark:bg-slate-850 rounded-lg border border-slate-700 flex items-center gap-2 self-start sm:self-auto shrink-0 shadow-xs">
              <Coins className="w-3.5 h-3.5 opacity-80" />
              <div className="text-[10px] uppercase font-bold text-slate-400">Live Format:</div>
              <div className="font-mono font-bold text-xs">
                {formatMoney(154250.75, formData)}
              </div>
            </div>
          </div>

          {/* Quick 1-Click Country Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Quick Country & Money Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'IN', flag: '🇮🇳', label: 'India', money: '₹ Rupee (INR)', tax: 'GST' },
                { id: 'US', flag: '🇺🇸', label: 'United States', money: '$ Dollar (USD)', tax: 'Sales Tax' },
                { id: 'GB', flag: '🇬🇧', label: 'United Kingdom', money: '£ Pound (GBP)', tax: 'VAT' },
                { id: 'EU', flag: '🇪🇺', label: 'European Union', money: '€ Euro (EUR)', tax: 'VAT' },
                { id: 'AE', flag: '🇦🇪', label: 'UAE', money: 'AED Dirham', tax: 'VAT' },
                { id: 'SA', flag: '🇸🇦', label: 'Saudi Arabia', money: 'SAR Riyal', tax: 'VAT' },
                { id: 'CA', flag: '🇨🇦', label: 'Canada', money: 'CA$ Dollar', tax: 'HST' },
                { id: 'AU', flag: '🇦🇺', label: 'Australia', money: 'A$ Dollar', tax: 'GST' },
              ].map(presetItem => {
                const preset = getCountryPreset(presetItem.id);
                const isSelected = formData.country_code === preset.id || 
                  (formData.currency_symbol === preset.currencySymbol && formData.currency_code === preset.currencyCode);
                
                return (
                  <button
                    key={presetItem.id}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        country_code: preset.id,
                        country_name: preset.name,
                        currency_code: preset.currencyCode,
                        currency_symbol: preset.currencySymbol,
                        currency_position: preset.currencyPosition,
                        number_format: preset.numberFormat,
                        tax_name: preset.taxName,
                        default_tax_rate: formData.default_tax_rate || preset.defaultTaxRate,
                      });
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'border-slate-900 dark:border-slate-100 bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-900 dark:ring-slate-100 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xl shrink-0">{presetItem.flag}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{presetItem.label}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-medium truncate">
                        {presetItem.money}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Country Selection & Custom Setup */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Country / Region
              </label>
              <select
                value={formData.country_code || 'IN'}
                onChange={e => {
                  const selectedId = e.target.value;
                  const preset = getCountryPreset(selectedId);
                  setFormData({
                    ...formData,
                    country_code: preset.id,
                    country_name: preset.name,
                    currency_code: preset.currencyCode,
                    currency_symbol: preset.currencySymbol,
                    currency_position: preset.currencyPosition,
                    number_format: preset.numberFormat,
                    tax_name: preset.taxName,
                    default_tax_rate: preset.defaultTaxRate,
                  });
                }}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-slate-500 focus:outline-none"
              >
                {COUNTRY_CURRENCY_PRESETS.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.flag} {c.name} ({c.currencySymbol} - {c.currencyCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Currency Symbol (e.g. ₹, $, £, €)
              </label>
              <input
                type="text"
                value={formData.currency_symbol}
                onChange={e => setFormData({ ...formData, currency_symbol: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-slate-500 focus:outline-none"
                placeholder="₹ or $"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ISO Currency Code (e.g. INR, USD, EUR)
              </label>
              <input
                type="text"
                value={formData.currency_code || 'INR'}
                onChange={e => setFormData({ ...formData, currency_code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono uppercase focus:ring-1 focus:ring-slate-500 focus:outline-none"
                placeholder="INR"
              />
            </div>
          </div>

          {/* Formatting Rules & Tax System */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Number Grouping System
              </label>
              <select
                value={formData.number_format || (formData.currency_symbol === '₹' ? 'indian' : 'standard')}
                onChange={e => setFormData({ ...formData, number_format: e.target.value as 'standard' | 'indian' })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-slate-500 focus:outline-none"
              >
                <option value="indian">Indian (Lakhs & Crores: 12,34,567.00)</option>
                <option value="standard">Standard (Millions & Thousands: 1,234,567.00)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tax Label (e.g. GST, Sales Tax, VAT)
              </label>
              <input
                type="text"
                value={formData.tax_name || 'GST'}
                onChange={e => setFormData({ ...formData, tax_name: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-slate-500 focus:outline-none"
                placeholder="GST"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.default_tax_rate}
                onChange={e => setFormData({ ...formData, default_tax_rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-slate-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Loyalty & Customer Rewards Program */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Gift className="w-4 h-4 opacity-80" />
              <span>Customer Loyalty & Rewards Program</span>
            </h3>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
              formData.enable_loyalty !== false
                ? 'header-badge'
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
                  className="rounded border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-slate-500 w-4 h-4 mt-0.5 sm:mt-0"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>Enable Loyalty Rewards System</span>
                    {formData.enable_loyalty !== false && (
                      <Sparkles className="w-3.5 h-3.5 opacity-80" />
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  formData.enable_loyalty !== false
                    ? 'header-action-btn'
                    : 'header-nav-active'
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
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-slate-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                    Default is 1 point per {formData.currency_symbol}1 total order value
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <Award className="w-3.5 h-3.5 opacity-80" />
                    <span>POS Register Behavior</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    When attached to a sale, customer points display in the cart header. At 50+ points, a 1-click &quot;Redeem 50 pts ({formData.currency_symbol}2.50)&quot; button is available.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-750 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                  <CheckCheck className="w-4 h-4 opacity-80" />
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
              <QrCode className="w-4 h-4 opacity-80" />
              <span>UPI / QR Code Digital Payment Settings</span>
            </h3>
            <span className="header-badge px-2 py-0.5 text-[10px] font-bold rounded-md border">
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
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-slate-500 focus:outline-none"
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
                    placeholder="e.g. Nexus POS Retail"
                    value={formData.upi_payee_name || ''}
                    onChange={e => setFormData({ ...formData, upi_payee_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-slate-500 focus:outline-none"
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
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-slate-500 focus:outline-none"
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
                      <Smartphone className="w-3 h-3 opacity-75" />
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
                  value={`upi://pay?pa=${encodeURIComponent(formData.upi_id || 'osposstore@okhdfcbank')}&pn=${encodeURIComponent(formData.upi_payee_name || formData.company_name || 'Nexus POS')}&am=10.00&cu=INR&tn=${encodeURIComponent(formData.upi_qr_note || 'POS Order Payment')}`}
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
                    className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Copy UPI ID"
                  >
                    {copiedPreviewUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {formData.upi_payee_name || formData.company_name}
                </p>
              </div>

              <span className="header-badge text-[10px] px-2 py-0.5 rounded border font-semibold">
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
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-slate-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Receipt Footer Message</label>
            <textarea
              rows={2}
              value={formData.receipt_footer}
              onChange={e => setFormData({ ...formData, receipt_footer: e.target.value })}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-slate-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="header-nav-active flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </form>

      {/* Floating Bottom Notification / Toast on Settings Change */}
      {showUnsavedToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="bg-slate-900 dark:bg-slate-950 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-4 max-w-md ring-1 ring-white/10">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white leading-snug">
                Unsaved Settings Changes
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                You have modified store configurations.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Now</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUnsavedToast(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Sync & Google Account Card */}
      {onOpenCloudSync && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 header-action-btn rounded-xl shrink-0">
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
            className="header-nav-active flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shadow-xs shrink-0 cursor-pointer"
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
            className="header-action-btn flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Database JSON</span>
          </button>

          <label className="header-action-btn flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 opacity-80" />
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
            className="header-action-btn flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ml-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Products & Customers</span>
          </button>
        </div>
      </div>
    </div>
  );
};
