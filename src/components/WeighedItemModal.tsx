import React, { useState } from 'react';
import { X, Scale, DollarSign, Check } from 'lucide-react';
import { Item, StoreConfig, ItemVariant } from '../types/pos';

interface WeighedItemModalProps {
  item: Item;
  config: StoreConfig;
  isOpen?: boolean;
  onClose: () => void;
  onConfirm: (data: {
    quantity: number; // in decimal base unit (e.g. 0.25 kg)
    unit_price: number;
    weight_in_grams: number;
    target_price_requested?: number;
    variant_id?: string;
    variant_name?: string;
  }) => void;
  initialWeightInGrams?: number;
  initialTargetPrice?: number;
  initialGrams?: number;
  initialPriceRequested?: number;
  selectedVariant?: ItemVariant;
}

export const WeighedItemModal: React.FC<WeighedItemModalProps> = ({
  item,
  config,
  isOpen = true,
  onClose,
  onConfirm,
  initialWeightInGrams,
  initialTargetPrice,
  initialGrams,
  initialPriceRequested,
  selectedVariant: propSelectedVariant,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | null>(
    propSelectedVariant || (item.variants && item.variants.length > 0 ? item.variants[0] : null)
  );

  const startingGrams = initialGrams ?? initialWeightInGrams;
  const startingPrice = initialPriceRequested ?? initialTargetPrice;

  // Active rate per kg/base unit
  const activeRate = selectedVariant ? selectedVariant.unit_price : item.unit_price;
  const unitName = item.unit_name || 'kg';

  // Input states
  const [entryMode, setEntryMode] = useState<'weight' | 'price'>(startingPrice ? 'price' : 'weight');
  const [gramsInput, setGramsInput] = useState<string>(
    startingGrams ? startingGrams.toString() : '500'
  );
  const [priceInput, setPriceInput] = useState<string>(
    startingPrice ? startingPrice.toString() : (activeRate * 0.5).toFixed(2)
  );

  if (!isOpen) return null;

  // Sync calculations whenever grams or price changes
  const handleGramsChange = (valStr: string) => {
    setGramsInput(valStr);
    const grams = parseFloat(valStr) || 0;
    const kg = grams / 1000;
    const calculatedPrice = (kg * activeRate);
    setPriceInput(calculatedPrice > 0 ? calculatedPrice.toFixed(2) : '');
  };

  const handlePriceChange = (valStr: string) => {
    setPriceInput(valStr);
    const price = parseFloat(valStr) || 0;
    if (activeRate > 0) {
      const calculatedGrams = (price / activeRate) * 1000;
      setGramsInput(calculatedGrams > 0 ? calculatedGrams.toFixed(1) : '');
    }
  };

  // Quick weight presets
  const weightPresets = [
    { label: '100g', grams: 100 },
    { label: '250g (Pav)', grams: 250 },
    { label: '500g (Half kg)', grams: 500 },
    { label: '750g', grams: 750 },
    { label: '1 kg', grams: 1000 },
    { label: '2 kg', grams: 2000 },
    { label: '5 kg', grams: 5000 },
  ];

  // Quick price presets (budget asking: e.g. "Give me ₹50 worth of rice")
  const pricePresets = [
    { label: `${config.currency_symbol}10`, price: 10 },
    { label: `${config.currency_symbol}20`, price: 20 },
    { label: `${config.currency_symbol}50`, price: 50 },
    { label: `${config.currency_symbol}100`, price: 100 },
    { label: `${config.currency_symbol}200`, price: 200 },
    { label: `${config.currency_symbol}500`, price: 500 },
  ];

  const currentGrams = parseFloat(gramsInput) || 0;
  const currentTotal = parseFloat(priceInput) || 0;
  const currentKg = currentGrams / 1000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentGrams <= 0) {
      alert('Please enter a valid weight or price.');
      return;
    }

    onConfirm({
      quantity: currentKg,
      unit_price: activeRate,
      weight_in_grams: currentGrams,
      target_price_requested: entryMode === 'price' ? currentTotal : undefined,
      variant_id: selectedVariant?.id,
      variant_name: selectedVariant?.name,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 px-5 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm block leading-tight">Weighed / Open Value (Rashan)</span>
              <span className="text-[11px] text-slate-400">
                {item.name} • Base Rate: <b className="text-amber-300">{config.currency_symbol}{activeRate.toFixed(2)} / {unitName}</b>
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Variant selection (if item has variants like Regular / Premium) */}
        {item.variants && item.variants.length > 0 && (
          <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5 uppercase tracking-wider">
              Select Grade / Variety
            </label>
            <div className="flex flex-wrap gap-2">
              {item.variants.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedVariant(v);
                    // Recalculate price for current grams with new rate
                    const kg = currentGrams / 1000;
                    setPriceInput((kg * v.unit_price).toFixed(2));
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    selectedVariant?.id === v.id
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400'
                  }`}
                >
                  {v.name} ({config.currency_symbol}{v.unit_price.toFixed(2)}/{unitName})
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Mode Switcher: Enter by Weight vs Enter by Asking Budget */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Input Mode
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setEntryMode('weight')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  entryMode === 'weight'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-amber-500" />
                <span>Enter Weight (Grams / Kg)</span>
              </button>

              <button
                type="button"
                onClick={() => setEntryMode('price')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  entryMode === 'price'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span>Enter Customer Price Budget</span>
              </button>
            </div>
          </div>

          {/* Interactive Calculator Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Weight Input Box */}
            <div className={`p-4 rounded-xl border transition-all ${
              entryMode === 'weight' 
                ? 'border-amber-500/80 bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-amber-500/40' 
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-amber-600" />
                  <span>Weight in Grams (g)</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {currentKg >= 1 ? `${currentKg.toFixed(3)} kg` : `${currentGrams} g`}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  autoFocus={entryMode === 'weight'}
                  value={gramsInput}
                  onChange={e => handleGramsChange(e.target.value)}
                  placeholder="e.g. 250, 500, 1000"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                  grams
                </span>
              </div>

              {/* Weight Quick Presets */}
              <div className="flex flex-wrap gap-1 mt-2.5">
                {weightPresets.map(preset => (
                  <button
                    key={preset.grams}
                    type="button"
                    onClick={() => {
                      setEntryMode('weight');
                      handleGramsChange(preset.grams.toString());
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold border transition-colors ${
                      currentGrams === preset.grams
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price / Budget Input Box */}
            <div className={`p-4 rounded-xl border transition-all ${
              entryMode === 'price' 
                ? 'border-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-500/40' 
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Calculated / Budget Total</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  Rate: {config.currency_symbol}{activeRate}/kg
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                  {config.currency_symbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  required
                  autoFocus={entryMode === 'price'}
                  value={priceInput}
                  onChange={e => handlePriceChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Price Quick Presets */}
              <div className="flex flex-wrap gap-1 mt-2.5">
                {pricePresets.map(preset => (
                  <button
                    key={preset.price}
                    type="button"
                    onClick={() => {
                      setEntryMode('price');
                      handlePriceChange(preset.price.toString());
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold border transition-colors ${
                      Math.abs(currentTotal - preset.price) < 0.01
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Summary Calculation Card */}
          <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Customer Receives:</span>
              <span className="text-base font-black text-amber-400 font-mono">
                {currentGrams >= 1000 ? `${(currentGrams / 1000).toFixed(3)} kg` : `${currentGrams.toFixed(0)} grams`}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Formula: {currentGrams}g × ({config.currency_symbol}{activeRate} / 1000g)
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-medium">Total Line Price:</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {config.currency_symbol}{currentTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Add to Cart ({config.currency_symbol}{currentTotal.toFixed(2)})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
