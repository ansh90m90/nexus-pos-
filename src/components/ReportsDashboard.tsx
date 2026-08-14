import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  CreditCard, 
  Download, 
  RotateCcw, 
  Receipt, 
  Users, 
  PieChart, 
  Layers
} from 'lucide-react';
import { Sale, StoreConfig } from '../types/pos';

interface ReportsDashboardProps {
  sales: Sale[];
  config: StoreConfig;
  onRefundSale: (saleId: string) => void;
  onShowReceipt: (sale: Sale) => void;
}

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({
  sales,
  config,
  onRefundSale,
  onShowReceipt,
}) => {
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [activeReportTab, setActiveReportTab] = useState<'overview' | 'sales_log' | 'categories' | 'cashiers'>('overview');

  // Filter sales by date range
  const filteredSales = useMemo(() => {
    const now = new Date().getTime();
    return sales.filter(sale => {
      const saleTime = new Date(sale.sale_time).getTime();
      if (dateFilter === 'today') {
        return now - saleTime <= 86400000;
      } else if (dateFilter === '7days') {
        return now - saleTime <= 86400000 * 7;
      } else if (dateFilter === '30days') {
        return now - saleTime <= 86400000 * 30;
      }
      return true;
    });
  }, [sales, dateFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let grossSales = 0;
    let totalTax = 0;
    let totalDiscounts = 0;
    let totalCOGS = 0; // Cost of goods sold
    let completedTransactions = 0;
    let refundedCount = 0;

    const paymentTotals: Record<string, number> = {
      'Cash': 0,
      'UPI / QR Code': 0,
      'Check': 0,
      'Gift Card': 0,
    };

    const categorySales: Record<string, { count: number; total: number }> = {};
    const cashierSales: Record<string, { count: number; total: number }> = {};
    const itemRankings: Record<string, { name: string; qty: number; revenue: number }> = {};

    for (const sale of filteredSales) {
      if (sale.status === 'refunded') {
        refundedCount += 1;
        continue;
      }

      completedTransactions += 1;
      grossSales += sale.total;
      totalTax += sale.tax_total;
      totalDiscounts += sale.discount_total;

      // Track payments
      for (const p of sale.payments) {
        const netPaid = p.payment_type === 'Cash' ? (p.payment_amount - sale.change_due) : p.payment_amount;
        paymentTotals[p.payment_type] = (paymentTotals[p.payment_type] || 0) + netPaid;
      }

      // Track cashier
      const cashierName = sale.employee_name || 'Staff';
      if (!cashierSales[cashierName]) {
        cashierSales[cashierName] = { count: 0, total: 0 };
      }
      cashierSales[cashierName].count += 1;
      cashierSales[cashierName].total += sale.total;

      // Track items, categories, and COGS
      for (const item of sale.items) {
        totalCOGS += (item.cost_price || 0) * item.quantity;

        // Category
        const cat = item.category || 'General';
        if (!categorySales[cat]) {
          categorySales[cat] = { count: 0, total: 0 };
        }
        categorySales[cat].count += item.quantity;
        categorySales[cat].total += item.total;

        // Item Ranking
        if (!itemRankings[item.item_id]) {
          itemRankings[item.item_id] = { name: item.name, qty: 0, revenue: 0 };
        }
        itemRankings[item.item_id].qty += item.quantity;
        itemRankings[item.item_id].revenue += item.total;
      }
    }

    const netSales = grossSales - totalTax;
    const grossProfit = netSales - totalCOGS;
    const profitMargin = netSales > 0 ? ((grossProfit / netSales) * 100).toFixed(1) : '0';
    const averageOrderValue = completedTransactions > 0 ? (grossSales / completedTransactions) : 0;

    return {
      grossSales,
      netSales,
      totalTax,
      totalDiscounts,
      totalCOGS,
      grossProfit,
      profitMargin,
      completedTransactions,
      refundedCount,
      averageOrderValue,
      paymentTotals,
      categorySales,
      cashierSales,
      topItems: Object.values(itemRankings).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    };
  }, [filteredSales]);

  const handleExportSalesReport = () => {
    const headers = ['Sale ID', 'Date/Time', 'Cashier', 'Customer', 'Items Count', 'Subtotal', 'Tax', 'Total', 'Payment', 'Status'];
    const rows = filteredSales.map(s => [
      `"${s.id}"`,
      `"${s.sale_time}"`,
      `"${s.employee_name}"`,
      `"${s.customer_name || 'Walk-in'}"`,
      s.items.reduce((a, i) => a + i.quantity, 0),
      s.subtotal.toFixed(2),
      s.tax_total.toFixed(2),
      s.total.toFixed(2),
      `"${s.payments.map(p => p.payment_type).join(', ')}"`,
      `"${s.status}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_report_${dateFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header & Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>Store Reports & Sales Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Comprehensive revenue breakdown, profit margins, and transaction log</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-bold">
            {(['all', 'today', '7days', '30days'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateFilter(range)}
                className={`px-3 py-1 rounded-md transition-all ${
                  dateFilter === range
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {range === 'all' ? 'All Time' : range === 'today' ? 'Today' : range === '7days' ? 'Last 7 Days' : 'Last 30 Days'}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportSalesReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            Gross Revenue
          </span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
            {config.currency_symbol}{metrics.grossSales.toFixed(2)}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{metrics.completedTransactions} sales completed</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            Estimated Gross Profit
          </span>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {config.currency_symbol}{metrics.grossProfit.toFixed(2)}
          </p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">{metrics.profitMargin}% gross margin</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            Average Basket Size
          </span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
            {config.currency_symbol}{metrics.averageOrderValue.toFixed(2)}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Per checkout transaction</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            Collected Sales Tax
          </span>
          <p className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">
            {config.currency_symbol}{metrics.totalTax.toFixed(2)}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Default rate: {config.default_tax_rate}%</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-bold text-slate-600 dark:text-slate-400">
        <button
          onClick={() => setActiveReportTab('overview')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeReportTab === 'overview'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Category & Payment Breakdown</span>
        </button>

        <button
          onClick={() => setActiveReportTab('sales_log')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeReportTab === 'sales_log'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Detailed Transaction Log ({filteredSales.length})</span>
        </button>

        <button
          onClick={() => setActiveReportTab('cashiers')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeReportTab === 'cashiers'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Cashier Performance</span>
        </button>
      </div>

      {activeReportTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Top Selling Products */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Top 5 Best Selling Items</span>
            </h3>
            <div className="space-y-3">
              {metrics.topItems.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">No item sales recorded.</p>
              ) : (
                metrics.topItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-mono font-bold text-[10px] text-slate-600 dark:text-slate-300">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 dark:text-white block">
                        {config.currency_symbol}{item.revenue.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{item.qty} sold</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sales by Category */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Revenue by Category</span>
            </h3>
            <div className="space-y-3">
              {Object.keys(metrics.categorySales).length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">No categories recorded.</p>
              ) : (
                Object.entries(metrics.categorySales).map(([cat, data]) => {
                  const percent = metrics.grossSales > 0 ? ((data.total / metrics.grossSales) * 100).toFixed(0) : '0';
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-800 dark:text-slate-200">{cat}</span>
                        <span className="font-mono text-slate-900 dark:text-white">{config.currency_symbol}{data.total.toFixed(2)} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-sky-500 h-full rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sales by Payment Method */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Payment Tender Breakdown</span>
            </h3>
            <div className="space-y-3">
              {Object.entries(metrics.paymentTotals).map(([tender, amt]) => {
                const percent = metrics.grossSales > 0 ? ((amt / metrics.grossSales) * 100).toFixed(0) : '0';
                return (
                  <div key={tender} className="flex justify-between items-center text-xs py-1 border-b border-slate-50 dark:border-slate-800/80 last:border-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{tender}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">({percent}%)</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {config.currency_symbol}{amt.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeReportTab === 'sales_log' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Cashier</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4">Tender</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400 dark:text-slate-500">
                      No sales found in this date range.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">{sale.id}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{new Date(sale.sale_time).toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">{sale.employee_name}</td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-semibold">{sale.customer_name || 'Walk-in'}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-700 dark:text-slate-300">
                        {sale.items.reduce((a, i) => a + i.quantity, 0)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {sale.payments.map(p => p.payment_type).join(', ')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                        {config.currency_symbol}{sale.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          sale.status === 'completed'
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                            : sale.status === 'refunded'
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                        }`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onShowReceipt(sale)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                            title="View / Print Receipt"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                          {sale.status === 'completed' && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Issue refund for order ${sale.id}? Inventory will be restocked.`)) {
                                  onRefundSale(sale.id);
                                }
                              }}
                              className="p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-lg transition-colors"
                              title="Refund / Void Sale"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReportTab === 'cashiers' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4 text-center">Transactions Processed</th>
                  <th className="py-3 px-4 text-right">Total Revenue Handled</th>
                  <th className="py-3 px-4 text-right">Avg Order Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {Object.entries(metrics.cashierSales).map(([name, data]) => (
                  <tr key={name} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{name}</td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">{data.count}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {config.currency_symbol}{data.total.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                      {config.currency_symbol}{(data.total / data.count).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
