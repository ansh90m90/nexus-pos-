import React, { useState, useMemo } from 'react';
import { DollarSign, Calculator, History } from 'lucide-react';
import { Cashup, Sale, StoreConfig, Employee } from '../types/pos';
import { sound } from '../services/audio';

interface CashupsManagerProps {
  cashups: Cashup[];
  sales: Sale[];
  currentUser: Employee;
  config: StoreConfig;
  onAddCashup: (c: Omit<Cashup, 'id'>) => Cashup;
  onUpdateCashup?: (id: string, c: Partial<Cashup>) => void;
}

export const CashupsManager: React.FC<CashupsManagerProps> = ({
  cashups,
  sales,
  currentUser,
  config,
  onAddCashup,
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [openingFloat, setOpeningFloat] = useState<number>(200.0);
  const [cashIn, setCashIn] = useState<number>(0);
  const [cashOut, setCashOut] = useState<number>(0);
  const [cashupNotes, setCashupNotes] = useState<string>('');

  // Currency Denomination Counts
  const [denoms, setDenoms] = useState({
    hundreds: 0,
    fifties: 0,
    twenties: 0,
    tens: 0,
    fives: 0,
    ones: 0,
    quarters: 0,
    dimes: 0,
    nickels: 0,
    pennies: 0,
  });

  // Calculate Today's Cash Sales from sales log
  const todayCashSales = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return sales
      .filter(s => s.status === 'completed' && s.sale_time.startsWith(today))
      .reduce((acc, s) => {
        const cashPayment = s.payments.find(p => p.payment_type === 'Cash');
        return acc + (cashPayment ? cashPayment.payment_amount - s.change_due : 0);
      }, 0);
  }, [sales]);

  // Counted Cash from denominations
  const totalCountedCash = useMemo(() => {
    return (
      denoms.hundreds * 100 +
      denoms.fifties * 50 +
      denoms.twenties * 20 +
      denoms.tens * 10 +
      denoms.fives * 5 +
      denoms.ones * 1 +
      denoms.quarters * 0.25 +
      denoms.dimes * 0.10 +
      denoms.nickels * 0.05 +
      denoms.pennies * 0.01
    );
  }, [denoms]);

  // Expected in drawer = Opening float + cash sales + cash in - cash out
  const expectedInDrawer = openingFloat + todayCashSales + cashIn - cashOut;
  const discrepancy = totalCountedCash - expectedInDrawer;

  const handleCloseRegister = () => {
    if (window.confirm('Are you sure you want to close out the daily register and submit cashup?')) {
      onAddCashup({
        open_time: new Date().toISOString(),
        close_time: new Date().toISOString(),
        open_employee_id: currentUser.id,
        open_employee_name: `${currentUser.first_name} ${currentUser.last_name}`,
        close_employee_id: currentUser.id,
        close_employee_name: `${currentUser.first_name} ${currentUser.last_name}`,
        opening_amount: openingFloat,
        cash_sales: todayCashSales,
        cash_in: cashIn,
        cash_out: cashOut,
        counted_cash: totalCountedCash,
        difference: discrepancy,
        notes: cashupNotes || undefined,
        status: 'closed',
      });

      sound.playSuccess();
      alert('Register successfully closed and cashup log recorded.');
      setActiveTab('history');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Daily Cashup & Register Drawer Audit</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Balance opening float, register cash sales, and close daily shifts</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'current'
                ? 'bg-sky-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Active Shift Cashup</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'history'
                ? 'bg-sky-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Past Cashups ({cashups.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'current' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Cash Denomination Calculator */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Physical Cash Drawer Count Calculator
              </h3>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                Total Counted: {config.currency_symbol}{totalCountedCash.toFixed(2)}
              </span>
            </div>

            {/* Bills Grid */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Currency Bills
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {[
                  { label: '$100', key: 'hundreds', val: 100 },
                  { label: '$50', key: 'fifties', val: 50 },
                  { label: '$20', key: 'twenties', val: 20 },
                  { label: '$10', key: 'tens', val: 10 },
                  { label: '$5', key: 'fives', val: 5 },
                  { label: '$1', key: 'ones', val: 1 },
                ].map(item => (
                  <div key={item.key} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">{item.label}</span>
                    <input
                      type="number"
                      min="0"
                      value={denoms[item.key as keyof typeof denoms] || ''}
                      placeholder="0"
                      onChange={e => setDenoms({ ...denoms, [item.key]: parseInt(e.target.value) || 0 })}
                      className="w-full text-center px-1 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block mt-1">
                      ${((denoms[item.key as keyof typeof denoms] || 0) * item.val).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coins Grid */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Loose Coins & Rolls
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: 'Quarters (25¢)', key: 'quarters', val: 0.25 },
                  { label: 'Dimes (10¢)', key: 'dimes', val: 0.10 },
                  { label: 'Nickels (5¢)', key: 'nickels', val: 0.05 },
                  { label: 'Pennies (1¢)', key: 'pennies', val: 0.01 },
                ].map(item => (
                  <div key={item.key} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">{item.label}</span>
                    <input
                      type="number"
                      min="0"
                      value={denoms[item.key as keyof typeof denoms] || ''}
                      placeholder="0"
                      onChange={e => setDenoms({ ...denoms, [item.key]: parseInt(e.target.value) || 0 })}
                      className="w-full text-center px-1 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block mt-1">
                      ${((denoms[item.key as keyof typeof denoms] || 0) * item.val).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDenoms({ hundreds: 0, fifties: 0, twenties: 0, tens: 0, fives: 0, ones: 0, quarters: 0, dimes: 0, nickels: 0, pennies: 0 })}
                className="px-3 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-xs font-bold transition-colors"
              >
                Reset Counts
              </button>
            </div>
          </div>

          {/* Right 1 Col: Balance Summary & Register Closeout */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Register Balance Breakdown
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Opening Float / Starting Cash
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={openingFloat}
                    onChange={e => setOpeningFloat(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <span>Today's Cash Sales:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    +{config.currency_symbol}{todayCashSales.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Cash In (Float Add)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cashIn}
                      onChange={e => setCashIn(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Cash Out (Drop/Paid)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cashOut}
                      onChange={e => setCashOut(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 border border-slate-200 dark:border-slate-750">
                  <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium">
                    <span>Expected Drawer Total:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{config.currency_symbol}{expectedInDrawer.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium">
                    <span>Counted Cash Total:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{config.currency_symbol}{totalCountedCash.toFixed(2)}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 dark:text-white">Difference (Over/Short):</span>
                    <span className={`font-mono text-sm font-black ${
                      Math.abs(discrepancy) < 0.01 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : discrepancy > 0 
                        ? 'text-sky-600 dark:text-sky-400' 
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {discrepancy >= 0 ? '+' : ''}{config.currency_symbol}{discrepancy.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Shift Notes / Discrepancy Reason
                  </label>
                  <textarea
                    rows={2}
                    value={cashupNotes}
                    onChange={e => setCashupNotes(e.target.value)}
                    placeholder="Register balanced, shift handover notes..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleCloseRegister}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
                >
                  Submit & Close Shift Register
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* History View */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300">
            Cashup Log Archive
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Cashup ID</th>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Closed By</th>
                  <th className="py-3 px-4 text-right">Opening Float</th>
                  <th className="py-3 px-4 text-right">Cash Sales</th>
                  <th className="py-3 px-4 text-right">Counted Cash</th>
                  <th className="py-3 px-4 text-right">Difference</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {cashups.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 dark:text-slate-500">
                      No cashup history recorded.
                    </td>
                  </tr>
                ) : (
                  cashups.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">{c.id}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{new Date(c.open_time).toLocaleString()}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{c.close_employee_name || c.open_employee_name}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                        {config.currency_symbol}{c.opening_amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900 dark:text-slate-100 font-bold">
                        {config.currency_symbol}{c.cash_sales.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                        {config.currency_symbol}{c.counted_cash.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={Math.abs(c.difference) < 0.01 ? 'text-emerald-600 dark:text-emerald-400' : c.difference > 0 ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600 dark:text-rose-400'}>
                          {c.difference >= 0 ? '+' : ''}{config.currency_symbol}{c.difference.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 italic max-w-xs truncate">{c.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
