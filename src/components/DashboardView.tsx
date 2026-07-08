import React from 'react';
import { Account, JournalEntry } from '../types';
import { getAccountingSummary, calculateAccountBalance } from '../utils';
import { formatRupiah } from '../initialData';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Database,
  Building2,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardViewProps {
  accounts: Account[];
  entries: JournalEntry[];
  onNavigate: (view: 'dashboard' | 'journal' | 'ledger' | 'statements') => void;
  onSelectAccount?: (accountCode: string) => void;
}

export default function DashboardView({ accounts, entries, onNavigate, onSelectAccount }: DashboardViewProps) {
  const summary = getAccountingSummary(accounts, entries);

  // Prepare chart data for Revenue vs Expenses
  // Let's group by date to show daily totals
  const dailyDataMap: { [date: string]: { date: string; revenue: number; expense: number } } = {};
  
  // Initialize with some dates from entries to keep it clean
  const sortedDates = [...new Set(entries.map(e => e.date))].sort();
  sortedDates.forEach(d => {
    dailyDataMap[d] = { date: d, revenue: 0, expense: 0 };
  });

  entries.forEach(entry => {
    const date = entry.date;
    if (!dailyDataMap[date]) {
      dailyDataMap[date] = { date, revenue: 0, expense: 0 };
    }

    entry.lines.forEach(line => {
      const acc = accounts.find(a => a.code === line.accountCode);
      if (acc) {
        if (acc.type === 'revenue') {
          dailyDataMap[date].revenue += line.credit - line.debit;
        } else if (acc.type === 'expense') {
          dailyDataMap[date].expense += line.debit - line.credit;
        }
      }
    });
  });

  const chartData = Object.values(dailyDataMap).sort((a, b) => a.date.localeCompare(b.date));

  // Prepare Asset Allocation Chart
  const assetAccounts = accounts.filter(a => a.type === 'asset');
  const assetAllocData = assetAccounts
    .map(acc => ({
      name: acc.name,
      code: acc.code,
      value: calculateAccountBalance(acc, entries)
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  // Format short date for chart (e.g. 2026-07-01 -> 01 Jul)
  const formatChartDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parts[2];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const monthIdx = parseInt(parts[1], 10) - 1;
        return `${day} ${monthNames[monthIdx] || parts[1]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formattedChartData = chartData.map(d => ({
    ...d,
    formattedDate: formatChartDate(d.date)
  }));

  // Get recent 4 entries
  const recentEntries = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Top Banner with Balance Integrity */}
      <div id="balance-integrity-banner" className="bg-slate-900 text-white rounded p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">IndoLedger Modern ERP</span>
          <h2 className="text-xl font-bold font-sans tracking-tight mt-0.5">Dashboard Akuntansi</h2>
          <p className="text-slate-400 text-xs mt-1 max-w-xl">
            Sistem akuntansi double-entry real-time seimbang. Semua jurnal langsung terekam dan mempengaruhi neraca secara presisi.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-800/80 p-2.5 rounded border border-slate-700 min-w-[240px]">
          {summary.isBalanced ? (
            <CheckCircle2 className="text-emerald-400 h-5 w-5 shrink-0" id="balanced-icon" />
          ) : (
            <AlertCircle className="text-amber-400 h-5 w-5 shrink-0" id="unbalanced-icon" />
          )}
          <div className="flex-1">
            <div className="text-[9px] font-mono text-slate-400 uppercase">Status Persamaan Neraca</div>
            <div className="text-xs font-semibold tracking-wide">
              {summary.isBalanced ? 'SEIMBANG (BALANCED)' : 'BELUM SEIMBANG'}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
              Aset = Kewajiban + Ekuitas
            </div>
          </div>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div id="kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Laba Bersih */}
        <div id="kpi-net-income" className="bg-white border border-slate-200 rounded p-4 flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-mono uppercase tracking-wider">Laba Bersih</span>
            <div className="p-1 rounded bg-slate-50 text-slate-900">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold font-sans tracking-tight text-slate-900">
              {formatRupiah(summary.netIncome)}
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              Pendapatan dikurangi beban berjalan
            </p>
          </div>
        </div>

        {/* KPI: Posisi Kas */}
        <div id="kpi-cash" className="bg-white border border-slate-200 rounded p-4 flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-mono uppercase tracking-wider">Kas & Bank</span>
            <div className="p-1 rounded bg-slate-50 text-slate-900">
              <Wallet className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold font-sans tracking-tight text-slate-900">
              {formatRupiah(summary.cashPosition)}
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              Kas fisik & Rekening Bank Mandiri
            </p>
          </div>
        </div>

        {/* KPI: Total Aset */}
        <div id="kpi-assets" className="bg-white border border-slate-200 rounded p-4 flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-mono uppercase tracking-wider">Total Aset</span>
            <div className="p-1 rounded bg-slate-50 text-slate-900">
              <Building2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold font-sans tracking-tight text-slate-900">
              {formatRupiah(summary.totalAssets)}
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              Semua sumber daya bernilai ekonomi
            </p>
          </div>
        </div>

        {/* KPI: Kewajiban & Ekuitas */}
        <div id="kpi-liabilities-equity" className="bg-white border border-slate-200 rounded p-4 flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-mono uppercase tracking-wider">Pasiva Modal</span>
            <div className="p-1 rounded bg-slate-50 text-slate-900">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold font-sans tracking-tight text-slate-900">
              {formatRupiah(summary.totalLiabilities + summary.totalEquity)}
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              Kewajiban & Ekuitas pendana aset
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div id="dashboard-charts-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Trend Chart - Revenue vs Expense */}
        <div id="trend-chart-card" className="lg:col-span-2 bg-white border border-slate-200 rounded p-4 flex flex-col">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-xs font-bold font-sans text-slate-950 uppercase tracking-wider">Tren Pendapatan & Beban</h3>
              <p className="text-[11px] text-slate-500">Performa finansial harian dari transaksi Buku Jurnal</p>
            </div>
            <div className="flex gap-3 text-[10px] font-mono">
              <div className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 bg-slate-900 rounded-xs"></span>
                <span>Pendapatan</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 bg-slate-400 rounded-xs"></span>
                <span>Beban</span>
              </div>
            </div>
          </div>
          
          <div className="h-64 w-full mt-1">
            {formattedChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={formattedChartData}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#64748b" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="formattedDate" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
                    tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(0)}Jt`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#1e293b', 
                      color: '#ffffff',
                      borderRadius: '3px',
                      fontSize: '11px',
                      fontFamily: 'monospace'
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#cbd5e1' }}
                    formatter={(value: any) => [formatRupiah(Number(value)), '']}
                  />
                  <Area 
                    name="Pendapatan" 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#0f172a" 
                    strokeWidth={1.5}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                  <Area 
                    name="Beban" 
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#64748b" 
                    strokeWidth={1.25}
                    strokeDasharray="4 4"
                    fillOpacity={1} 
                    fill="url(#colorExpense)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[10px] text-slate-400 font-mono">
                Belum ada data transaksi pendapatan dan beban
              </div>
            )}
          </div>
        </div>

        {/* Asset Distribution Breakdown */}
        <div id="asset-breakdown-card" className="bg-white border border-slate-200 rounded p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold font-sans text-slate-950 uppercase tracking-wider">Struktur Harta Aktiva</h3>
            <p className="text-[11px] text-slate-500 mb-3">Distribusi kas, persediaan & aset tetap</p>
            
            <div className="space-y-2.5 mt-2">
              {assetAllocData.slice(0, 5).map((asset, idx) => {
                const totalAssetsValue = summary.totalAssets || 1;
                const percentage = (asset.value / totalAssetsValue) * 100;
                
                return (
                  <div key={asset.code} className="space-y-0.5">
                    <div className="flex justify-between text-[11px]">
                      <button 
                        onClick={() => onSelectAccount && onSelectAccount(asset.code)}
                        className="font-mono text-slate-600 hover:text-slate-900 text-left hover:underline focus:outline-hidden"
                      >
                        {asset.code} - {asset.name}
                      </button>
                      <span className="font-semibold text-slate-900 font-mono">{formatRupiah(asset.value)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <div 
                        className="bg-slate-900 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
                      ></div>
                    </div>
                    <div className="text-[9px] text-right text-slate-400 font-mono">
                      {percentage.toFixed(1)}% dari total aset
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3">
            <button 
              onClick={() => onNavigate('statements')}
              className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-700 hover:text-slate-950 rounded transition-all flex items-center justify-center gap-1"
            >
              Lihat Laporan Neraca Lengkap
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Lower Grid: Recent Journal Activity & Account Snapshot */}
      <div id="lower-dashboard-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Entries */}
        <div id="recent-entries-card" className="lg:col-span-2 bg-white border border-slate-200 rounded p-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-xs font-bold font-sans text-slate-950 uppercase tracking-wider">Aktivitas Jurnal Terbaru</h3>
              <p className="text-[11px] text-slate-500">Daftar transaksi umum yang baru dicatat</p>
            </div>
            <button 
              onClick={() => onNavigate('journal')}
              className="text-[10px] font-mono text-slate-600 hover:text-slate-950 hover:underline flex items-center gap-0.5"
            >
              Kelola Jurnal
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                  <th className="py-2 px-2">Tanggal</th>
                  <th className="py-2 px-2">No. Jurnal</th>
                  <th className="py-2 px-2">Keterangan</th>
                  <th className="py-2 px-2 text-right">Total Transaksi</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((entry) => {
                  const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
                  
                  return (
                    <tr 
                      key={entry.id} 
                      className="border-b border-slate-50 hover:bg-slate-50 text-[11px] transition-colors"
                    >
                      <td className="py-2 px-2 font-mono text-slate-500">{entry.date}</td>
                      <td className="py-2 px-2 font-mono font-medium text-slate-900">{entry.reference}</td>
                      <td className="py-2 px-2 text-slate-700 font-sans max-w-xs truncate">
                        {entry.description}
                      </td>
                      <td className="py-2 px-2 text-right font-semibold font-mono text-slate-900">
                        {formatRupiah(totalDebit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Account Types Mini Card */}
        <div id="account-snapshot-card" className="bg-white border border-slate-200 rounded p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold font-sans text-slate-950 uppercase tracking-wider">Ringkasan Klasifikasi Akun</h3>
            <p className="text-[11px] text-slate-500 mb-3">Total saldo agregat real-time per klasifikasi</p>

            <div className="space-y-2.5 mt-2 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Aset (Harta)</span>
                <span className="font-semibold text-slate-950">{formatRupiah(summary.totalAssets)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Kewajiban (Utang)</span>
                <span className="font-semibold text-slate-950">{formatRupiah(summary.totalLiabilities)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Ekuitas (Modal)</span>
                <span className="font-semibold text-slate-950">{formatRupiah(summary.totalEquity)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Pendapatan Usaha</span>
                <span className="font-semibold text-emerald-600">+{formatRupiah(summary.totalRevenues)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Beban Operasional</span>
                <span className="font-semibold text-slate-600">-{formatRupiah(summary.totalExpenses)}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3">
            <button 
              onClick={() => onNavigate('ledger')}
              className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-mono rounded transition-all flex items-center justify-center gap-1"
            >
              Buka Buku Besar (Ledger)
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
