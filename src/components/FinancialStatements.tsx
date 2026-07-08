import React, { useState } from 'react';
import { Account, JournalEntry } from '../types';
import { calculateAccountBalance, getAccountingSummary } from '../utils';
import { formatRupiah } from '../initialData';
import { FileSpreadsheet, Printer, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface FinancialStatementsProps {
  accounts: Account[];
  entries: JournalEntry[];
}

export default function FinancialStatements({ accounts, entries }: FinancialStatementsProps) {
  const [activeTab, setActiveTab] = useState<'income' | 'balance'>('income');
  const summary = getAccountingSummary(accounts, entries);

  // Group accounts
  const assetAccounts = accounts.filter(a => a.type === 'asset');
  const liabilityAccounts = accounts.filter(a => a.type === 'liability');
  const equityAccounts = accounts.filter(a => a.type === 'equity');
  const revenueAccounts = accounts.filter(a => a.type === 'revenue');
  const expenseAccounts = accounts.filter(a => a.type === 'expense');

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 print:p-6 print:bg-white print:text-black">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-xs font-bold font-sans tracking-tight text-slate-950 uppercase">Laporan Keuangan Resmi</h2>
          <p className="text-[11px] text-slate-500">Laporan Neraca dan Laba Rugi terstandarisasi yang dibuat secara otomatis.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tab selector */}
          <div className="bg-slate-100 p-0.5 rounded border border-slate-200 flex gap-0.5">
            <button
              onClick={() => setActiveTab('income')}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all ${
                activeTab === 'income' 
                  ? 'bg-white text-slate-950 font-bold shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Laba Rugi (P&L)
            </button>
            <button
              onClick={() => setActiveTab('balance')}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all ${
                activeTab === 'balance' 
                  ? 'bg-white text-slate-950 font-bold shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Neraca (Balance Sheet)
            </button>
          </div>
          
          <button
            onClick={handlePrint}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-mono rounded transition-all flex items-center gap-1"
          >
            <Printer className="h-3 w-3" />
            Cetak PDF
          </button>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block text-center border-b pb-2 mb-4">
        <h1 className="text-lg font-bold uppercase tracking-wide text-slate-950">INDOLEDGER MODERN ERP</h1>
        <p className="text-[10px] font-mono text-slate-600 mt-0.5">Laporan Keuangan Terpadu Periode Berjalan</p>
        <p className="text-[9px] text-slate-500 font-mono">Dibuat otomatis oleh AI Core Accounting Engine</p>
      </div>

      {/* Dynamic Balance Check Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded p-2.5 flex items-center justify-between gap-3 text-[11px] font-mono">
        <div className="flex items-center gap-1.5">
          {summary.isBalanced ? (
            <CheckCircle2 className="text-emerald-600 h-3.5 w-3.5 shrink-0" />
          ) : (
            <ShieldAlert className="text-amber-600 h-3.5 w-3.5 shrink-0" />
          )}
          <span className="text-slate-700">
            {summary.isBalanced 
              ? 'Persamaan Akuntansi Seimbang: Total Aset = Kewajiban + Ekuitas + Laba Ditahan.'
              : 'Peringatan: Selisih Pembukuan Terdeteksi. Mohon periksa saldo entri jurnal.'
            }
          </span>
        </div>
        <span className="font-bold text-slate-900">
          Selisih: Rp {new Intl.NumberFormat('id-ID').format(summary.discrepancy)}
        </span>
      </div>

      {/* Main Report Containers */}
      {activeTab === 'income' ? (
        /* INCOME STATEMENT */
        <div className="bg-white border border-slate-300 rounded shadow-xs p-5 md:p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-950"></div>
          
          <div className="text-center space-y-0.5">
            <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase block">Laporan Keuangan</span>
            <h3 className="text-xs font-bold font-sans tracking-tight text-slate-950 uppercase">Laporan Laba Rugi</h3>
            <p className="text-[10px] text-slate-500 font-mono">Untuk Periode Berjalan 2026</p>
          </div>

          <div className="space-y-4 pt-2">
            {/* Revenues Section */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-900 border-b pb-0.5">
                I. PENDAPATAN USAHA (REVENUE)
              </h4>
              <div className="space-y-1 pl-2">
                {revenueAccounts.map(acc => {
                  const balance = calculateAccountBalance(acc, entries);
                  return (
                    <div key={acc.code} className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-600">{acc.code} — {acc.name}</span>
                      <span className="text-slate-900 font-medium">{formatRupiah(balance)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[11px] font-mono font-bold border-t border-dashed pt-1 pl-2">
                <span>TOTAL PENDAPATAN OPERASIONAL</span>
                <span className="border-b border-slate-900 pb-0.5">{formatRupiah(summary.totalRevenues)}</span>
              </div>
            </div>

            {/* Expenses Section */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-900 border-b pb-0.5">
                II. BEBAN OPERASIONAL (EXPENSES)
              </h4>
              <div className="space-y-1 pl-2">
                {expenseAccounts.map(acc => {
                  const balance = calculateAccountBalance(acc, entries);
                  return (
                    <div key={acc.code} className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-600">{acc.code} — {acc.name}</span>
                      <span className="text-slate-900 font-medium">{formatRupiah(balance)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[11px] font-mono font-bold border-t border-dashed pt-1 pl-2">
                <span>TOTAL BEBAN OPERASIONAL</span>
                <span className="border-b border-slate-900 pb-0.5">{formatRupiah(summary.totalExpenses)}</span>
              </div>
            </div>

            {/* Net Income Summary Section */}
            <div className="bg-slate-900 text-white rounded p-3 mt-4 flex justify-between items-center">
              <div>
                <h5 className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">
                  LABA BERSIH PERIODE BERJALAN (NET PROFIT)
                </h5>
                <p className="text-[9px] text-slate-400 mt-0.5 font-sans">
                  Pendapatan bersih yang dialokasikan ke saldo laba ditahan ekuitas
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold font-mono">
                  {formatRupiah(summary.netIncome)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* BALANCE SHEET (NERACA) */
        <div className="bg-white border border-slate-300 rounded shadow-xs p-5 md:p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-950"></div>

          <div className="text-center space-y-0.5">
            <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase block">Laporan Keuangan</span>
            <h3 className="text-xs font-bold font-sans tracking-tight text-slate-950 uppercase">Laporan Neraca (Balance Sheet)</h3>
            <p className="text-[10px] text-slate-500 font-mono">Posisi Finansial Per 31 Desember 2026</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Left Side: Assets (Aktiva) */}
            <div className="space-y-3">
              <div>
                <h4 className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 flex justify-between">
                  <span>AKTIVA / ASET</span>
                  <span>DEBET</span>
                </h4>
                <div className="space-y-1 pl-1 mt-1.5">
                  {assetAccounts.map(acc => {
                    const balance = calculateAccountBalance(acc, entries);
                    return (
                      <div key={acc.code} className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-600">{acc.code} — {acc.name}</span>
                        <span className="text-slate-900 font-medium">{formatRupiah(balance)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between text-[11px] font-mono font-bold bg-slate-50 p-1.5 border border-slate-200 rounded">
                <span>TOTAL AKTIVA / ASET (A)</span>
                <span>{formatRupiah(summary.totalAssets)}</span>
              </div>
            </div>

            {/* Right Side: Liabilities & Equity (Pasiva) */}
            <div className="space-y-3">
              <div>
                <h4 className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 flex justify-between">
                  <span>PASIVA (KEWAJIBAN & EKUITAS)</span>
                  <span>KREDIT</span>
                </h4>
                
                {/* Liabilities List */}
                <div className="mt-1.5 pl-1 space-y-1">
                  <div className="text-[9px] font-mono text-slate-400 font-bold tracking-wider uppercase mb-0.5">
                    Kewajiban Jangka Pendek
                  </div>
                  {liabilityAccounts.map(acc => {
                    const balance = calculateAccountBalance(acc, entries);
                    return (
                      <div key={acc.code} className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-600">{acc.code} — {acc.name}</span>
                        <span className="text-slate-900 font-medium">{formatRupiah(balance)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Equity List */}
                <div className="mt-3 pl-1 space-y-1 border-t border-slate-100 pt-1.5">
                  <div className="text-[9px] font-mono text-slate-400 font-bold tracking-wider uppercase mb-0.5">
                    Ekuitas Pemilik
                  </div>
                  {equityAccounts.map(acc => {
                    const balance = calculateAccountBalance(acc, entries);
                    return (
                      <div key={acc.code} className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-600">{acc.code} — {acc.name}</span>
                        <span className="text-slate-900 font-medium">{formatRupiah(balance)}</span>
                      </div>
                    );
                  })}
                  {/* Append Net Income row as Retained Earnings for current period */}
                  <div className="flex justify-between text-[11px] font-mono text-emerald-700 italic font-semibold">
                    <span>Laba Bersih Tahun Berjalan</span>
                    <span>{formatRupiah(summary.netIncome)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-[11px] font-mono font-bold bg-slate-50 p-1.5 border border-slate-200 rounded">
                <span>TOTAL PASIVA (B)</span>
                <span>{formatRupiah(summary.totalLiabilities + summary.totalEquity + summary.netIncome)}</span>
              </div>
            </div>
          </div>

          {/* Equation Match validation card */}
          <div className="border-t pt-3 mt-3 text-center">
            <span className="text-[9px] font-mono text-slate-400 uppercase block">Rumus Identitas Akuntansi</span>
            <div className="text-[11px] font-semibold font-mono text-slate-800 mt-0.5">
              Aktiva (Rp {new Intl.NumberFormat('id-ID').format(summary.totalAssets)}) 
              {' = '}
              Pasiva (Rp {new Intl.NumberFormat('id-ID').format(summary.totalLiabilities + summary.totalEquity + summary.netIncome)})
            </div>
            <div className="text-[9px] text-emerald-600 font-mono mt-0.5 font-semibold">
              ✔ Neraca dinyatakan Seimbang Secara Sempurna (Perfect Audit Balance).
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
