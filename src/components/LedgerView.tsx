import React, { useState, useEffect } from 'react';
import { Account, JournalEntry } from '../types';
import { formatRupiah } from '../initialData';
import { BookOpen, Calendar, ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';

interface LedgerViewProps {
  accounts: Account[];
  entries: JournalEntry[];
  selectedAccountCode?: string;
  onSelectAccount?: (code: string) => void;
}

interface LedgerLine {
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export default function LedgerView({ accounts, entries, selectedAccountCode, onSelectAccount }: LedgerViewProps) {
  const [activeAccountCode, setActiveAccountCode] = useState<string>(accounts[0]?.code || '');

  // Synchronize with external selection if available (e.g. from Dashboard click)
  useEffect(() => {
    if (selectedAccountCode) {
      setActiveAccountCode(selectedAccountCode);
    }
  }, [selectedAccountCode]);

  const activeAccount = accounts.find(a => a.code === activeAccountCode) || accounts[0];

  if (!activeAccount) {
    return <div className="p-8 text-center text-xs font-mono text-neutral-400">Belum ada akun terdefinisi.</div>;
  }

  // Find all journal transactions affecting the active account, sorted chronologically
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  const ledgerLines: LedgerLine[] = [];
  let currentBalance = activeAccount.initialBalance;

  // Track summary details
  let totalDebit = 0;
  let totalCredit = 0;

  for (const entry of sortedEntries) {
    for (const line of entry.lines) {
      if (line.accountCode === activeAccount.code) {
        // Adjust current balance based on account classification and normal balance rules
        if (activeAccount.normalBalance === 'debit') {
          currentBalance += line.debit - line.credit;
        } else {
          currentBalance += line.credit - line.debit;
        }

        totalDebit += line.debit;
        totalCredit += line.credit;

        ledgerLines.push({
          date: entry.date,
          reference: entry.reference,
          description: entry.description,
          debit: line.debit,
          credit: line.credit,
          runningBalance: currentBalance
        });
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold font-sans tracking-tight text-slate-950 uppercase">Buku Besar (General Ledger)</h2>
          <p className="text-[11px] text-slate-500">Mutasi mendetail dan saldo berjalan dari setiap rekening akuntansi.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Pilih Rekening:</span>
          <select
            value={activeAccountCode}
            onChange={(e) => {
              setActiveAccountCode(e.target.value);
              if (onSelectAccount) onSelectAccount(e.target.value);
            }}
            className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-mono font-semibold text-slate-900 focus:border-slate-950 focus:outline-hidden"
          >
            {accounts.map(acc => (
              <option key={acc.code} value={acc.code}>
                {acc.code} - {acc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Account Profile Card */}
      <div className="bg-slate-900 text-white border border-slate-800 rounded p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 space-y-1">
          <div className="text-[9px] font-mono tracking-wider text-slate-400 uppercase">Informasi Akun Rekening</div>
          <h3 className="text-sm font-bold font-sans text-white">{activeAccount.name}</h3>
          <div className="flex items-center gap-3 text-[10px] font-mono mt-1">
            <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-300">
              KODE: {activeAccount.code}
            </span>
            <span className="text-slate-400 uppercase">
              TIPE: {activeAccount.type}
            </span>
          </div>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4 flex flex-col justify-between">
          <div className="text-[9px] font-mono tracking-wider text-slate-400 uppercase">Saldo Awal (Opening)</div>
          <div className="text-sm font-semibold font-mono tracking-tight text-slate-200 mt-1">
            {formatRupiah(activeAccount.initialBalance)}
          </div>
          <div className="text-[9px] text-slate-500 font-mono">
            Posisi awal buku besar periode
          </div>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4 flex flex-col justify-between">
          <div className="text-[9px] font-mono tracking-wider text-slate-400 uppercase">Saldo Akhir (Current)</div>
          <div className="text-sm font-bold font-mono tracking-tight text-white mt-1">
            {formatRupiah(activeAccount.initialBalance + (activeAccount.normalBalance === 'debit' ? (totalDebit - totalCredit) : (totalCredit - totalDebit)))}
          </div>
          <div className="text-[9px] text-slate-500 font-mono uppercase">
            Saldo Normal: {activeAccount.normalBalance}
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
        <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-slate-400" />
            Kartu Mutasi Buku Besar ({ledgerLines.length} Mutasi)
          </span>
          <span className="text-[9px] font-mono text-slate-400 uppercase">
            Sistem Otomatis Real-time
          </span>
        </div>

        {ledgerLines.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[9px] font-mono text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-1.5 px-3 w-28">Tanggal</th>
                  <th className="py-1.5 px-3 w-28">No. Voucher</th>
                  <th className="py-1.5 px-3">Deskripsi / Memo Jurnal</th>
                  <th className="py-1.5 px-3 text-right w-32">Debet (Rp)</th>
                  <th className="py-1.5 px-3 text-right w-32">Kredit (Rp)</th>
                  <th className="py-1.5 px-3 text-right w-40">Saldo Berjalan (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {/* Seed opening row */}
                <tr className="border-b border-slate-100 bg-slate-50/10 text-[11px] font-mono">
                  <td className="py-1 px-3 text-slate-400">—</td>
                  <td className="py-1 px-3 text-slate-400 font-semibold">SALDO AWAL</td>
                  <td className="py-1 px-3 text-slate-500 italic font-sans">Saldo pembukuan awal buku besar</td>
                  <td className="py-1 px-3 text-right text-slate-400">—</td>
                  <td className="py-1 px-3 text-right text-slate-400">—</td>
                  <td className="py-1 px-3 text-right font-medium text-slate-900">
                    {formatRupiah(activeAccount.initialBalance)}
                  </td>
                </tr>

                {ledgerLines.map((line, idx) => (
                  <tr 
                    key={idx} 
                    className="border-b border-slate-50 hover:bg-slate-50/40 text-[11px] transition-colors font-mono"
                  >
                    <td className="py-1 px-3 text-slate-500">{line.date}</td>
                    <td className="py-1 px-3 font-semibold text-slate-900">{line.reference}</td>
                    <td className="py-1 px-3 font-sans text-slate-700">{line.description}</td>
                    <td className="py-1 px-3 text-right text-slate-800">
                      {line.debit > 0 ? formatRupiah(line.debit) : '—'}
                    </td>
                    <td className="py-1 px-3 text-right text-slate-800">
                      {line.credit > 0 ? formatRupiah(line.credit) : '—'}
                    </td>
                    <td className="py-1 px-3 text-right font-bold text-slate-950">
                      {formatRupiah(line.runningBalance)}
                    </td>
                  </tr>
                ))}

                {/* Aggregation Summary Footer */}
                <tr className="bg-slate-50 text-[11px] font-mono font-semibold border-t border-slate-200">
                  <td className="py-2 px-3" colSpan={3}>TOTAL MUTASI PERIODE</td>
                  <td className="py-2 px-3 text-right text-slate-950">{formatRupiah(totalDebit)}</td>
                  <td className="py-2 px-3 text-right text-slate-950">{formatRupiah(totalCredit)}</td>
                  <td className="py-2 px-3 text-right text-slate-900">
                    Net: {formatRupiah(activeAccount.normalBalance === 'debit' ? (totalDebit - totalCredit) : (totalCredit - totalDebit))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 px-3">
            <p className="text-[11px] font-mono text-slate-400">Tidak ada mutasi transaksi pada periode ini.</p>
            <p className="text-[10px] font-mono text-slate-400 mt-1">
              Saldo Rekening saat ini tetap pada saldo awal: <span className="font-semibold">{formatRupiah(activeAccount.initialBalance)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
