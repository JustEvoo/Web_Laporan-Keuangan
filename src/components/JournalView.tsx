import React, { useState } from 'react';
import { Account, JournalEntry, JournalLine } from '../types';
import { validateJournalEntry } from '../utils';
import { formatRupiah } from '../initialData';
import { Plus, Trash2, Calendar, FileText, Check, AlertTriangle, RefreshCw, Layers } from 'lucide-react';

interface JournalViewProps {
  accounts: Account[];
  entries: JournalEntry[];
  onAddEntry: (entry: JournalEntry) => void;
  onResetData: () => void;
}

interface NewLineState {
  accountCode: string;
  debit: string;
  credit: string;
}

export default function JournalView({ accounts, entries, onAddEntry, onResetData }: JournalViewProps) {
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form states for custom entry
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<NewLineState[]>([
    { accountCode: '', debit: '', credit: '' },
    { accountCode: '', debit: '', credit: '' }
  ]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto-generate reference code based on current entry count
  const generateRef = () => {
    const nextNum = entries.length + 1;
    return `JV-2026-${String(nextNum).padStart(3, '0')}`;
  };

  // Open form with pre-generated reference
  const handleOpenForm = () => {
    setReference(generateRef());
    setLines([
      { accountCode: '', debit: '', credit: '' },
      { accountCode: '', debit: '', credit: '' }
    ]);
    setDescription('');
    setValidationError(null);
    setShowForm(true);
  };

  // Add line to journal builder
  const addLine = () => {
    setLines([...lines, { accountCode: '', debit: '', credit: '' }]);
  };

  // Remove line from journal builder
  const removeLine = (index: number) => {
    if (lines.length <= 2) return; // Minimum 2 lines
    const newLines = [...lines];
    newLines.splice(index, 1);
    setLines(newLines);
  };

  // Update line field
  const updateLine = (index: number, field: keyof NewLineState, value: string) => {
    const newLines = [...lines];
    
    if (field === 'debit') {
      newLines[index].debit = value;
      // If debit is typed, clear credit on this line to enforce accounting logic
      if (value) newLines[index].credit = '';
    } else if (field === 'credit') {
      newLines[index].credit = value;
      // If credit is typed, clear debit on this line
      if (value) newLines[index].debit = '';
    } else {
      newLines[index][field] = value;
    }

    setLines(newLines);
  };

  // Calculate live debit/credit totals
  const totalDebits = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredits = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const discrepancy = Math.abs(totalDebits - totalCredits);
  const isBalanced = totalDebits > 0 && discrepancy < 0.01;

  // Save the custom journal entry
  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();

    // Map string values to numbers
    const mappedLines = lines.map((l, index) => ({
      accountCode: l.accountCode,
      debit: parseFloat(l.debit) || 0,
      credit: parseFloat(l.credit) || 0
    }));

    // Validate the entry
    const validation = validateJournalEntry(mappedLines);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Terjadi kesalahan validasi.');
      return;
    }

    // Format new entry
    const newEntry: JournalEntry = {
      id: `TX-${Date.now()}`,
      date,
      reference,
      description,
      lines: mappedLines.map((l, idx) => ({
        id: `L-${Date.now()}-${idx}`,
        accountCode: l.accountCode,
        debit: l.debit,
        credit: l.credit
      }))
    };

    onAddEntry(newEntry);
    setShowForm(false);
    setValidationError(null);
  };

  // Quick templates for instant entry
  const applyTemplate = (type: 'revenue' | 'expense' | 'capital') => {
    const templateRef = generateRef();
    let templateDesc = '';
    let templateLines: NewLineState[] = [];

    switch (type) {
      case 'revenue':
        templateDesc = 'Penerimaan Pendapatan Jasa Penjualan Produk';
        templateLines = [
          { accountCode: '1-1000', debit: '15000000', credit: '' }, // Debit: Kas
          { accountCode: '4-1100', debit: '', credit: '15000000' }  // Credit: Pendapatan Produk
        ];
        break;
      case 'expense':
        templateDesc = 'Pembayaran Tagihan Listrik & Internet Bulanan';
        templateLines = [
          { accountCode: '5-1200', debit: '3500000', credit: '' },  // Debit: Beban Utilitas
          { accountCode: '1-1100', debit: '', credit: '3500000' }   // Credit: Bank Mandiri
        ];
        break;
      case 'capital':
        templateDesc = 'Suntikan Modal Kerja Tambahan Investor';
        templateLines = [
          { accountCode: '1-1100', debit: '50000000', credit: '' }, // Debit: Bank Mandiri
          { accountCode: '3-1000', debit: '', credit: '50000000' }  // Credit: Modal Saham
        ];
        break;
    }

    setDate(new Date().toISOString().split('T')[0]);
    setReference(templateRef);
    setDescription(templateDesc);
    setLines(templateLines);
    setShowForm(true);
    setValidationError(null);
  };

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    // Search Term matching
    const matchesSearch = 
      entry.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.lines.some(l => {
        const acc = accounts.find(a => a.code === l.accountCode);
        return l.accountCode.includes(searchTerm) || (acc && acc.name.toLowerCase().includes(searchTerm.toLowerCase()));
      });

    // Date Filters
    const matchesStartDate = startDate ? entry.date >= startDate : true;
    const matchesEndDate = endDate ? entry.date <= endDate : true;

    return matchesSearch && matchesStartDate && matchesEndDate;
  }).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold font-sans tracking-tight text-slate-950 uppercase">Buku Jurnal Umum</h2>
          <p className="text-[11px] text-slate-500">Pencatatan kronologis semua transaksi keuangan menggunakan double-entry.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onResetData}
            title="Reset data ke contoh bawaan"
            className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 rounded transition-all flex items-center justify-center"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleOpenForm}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-mono rounded shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="h-3 w-3" />
            Catat Jurnal Baru
          </button>
        </div>
      </div>

      {/* Dynamic Journal Entry Builder Modal/Form */}
      {showForm && (
        <div className="bg-white border border-slate-300 rounded shadow-xs p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-950"></div>
          
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-xs text-slate-900 font-sans uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Pencatatan Entri Jurnal Umum
            </h3>
            <button 
              onClick={() => setShowForm(false)}
              className="text-[10px] text-slate-400 hover:text-slate-900 font-mono"
            >
              [Tutup]
            </button>
          </div>

          {/* Quick templates inside builder */}
          <div className="mb-3 flex flex-wrap items-center gap-1.5 bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 mr-1">Templat Cepat:</span>
            <button 
              type="button"
              onClick={() => applyTemplate('revenue')}
              className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 text-[9px] font-mono text-slate-800 rounded-sm transition-all"
            >
              + Penerimaan Kas (Pendapatan)
            </button>
            <button 
              type="button"
              onClick={() => applyTemplate('expense')}
              className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 text-[9px] font-mono text-slate-800 rounded-sm transition-all"
            >
              + Pengeluaran Kas (Beban)
            </button>
            <button 
              type="button"
              onClick={() => applyTemplate('capital')}
              className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 text-[9px] font-mono text-slate-800 rounded-sm transition-all"
            >
              + Suntikan Modal Saham
            </button>
          </div>

          <form onSubmit={handleSubmitEntry} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Tanggal Transaksi</label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2 h-3 w-3 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-mono focus:border-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">No. Voucher (Referensi)</label>
                <div className="relative">
                  <FileText className="absolute left-2 top-2 h-3 w-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="JV-YYYY-XXX"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-mono focus:border-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Memo / Keterangan Jurnal</label>
                <input
                  type="text"
                  required
                  placeholder="Deskripsi singkat transaksi keuangan..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[11px] focus:border-slate-900 focus:outline-hidden font-sans"
                />
              </div>
            </div>

            {/* Dynamic ledger lines list */}
            <div className="space-y-1.5 mt-3">
              <div className="grid grid-cols-12 gap-2 text-[9px] font-mono text-slate-400 uppercase tracking-wider pb-0.5 px-1">
                <div className="col-span-6 md:col-span-5">Pilih Akun Rekening</div>
                <div className="col-span-3 md:col-span-3 text-right">Debit (Rp)</div>
                <div className="col-span-3 md:col-span-3 text-right">Kredit (Rp)</div>
                <div className="hidden md:block md:col-span-1"></div>
              </div>

              {lines.map((line, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  {/* Account Selector */}
                  <div className="col-span-12 md:col-span-5">
                    <select
                      required
                      value={line.accountCode}
                      onChange={(e) => updateLine(index, 'accountCode', e.target.value)}
                      className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-[11px] font-mono focus:border-slate-900 focus:outline-hidden"
                    >
                      <option value="">-- Pilih Akun Rekening --</option>
                      {accounts.map(acc => (
                        <option key={acc.code} value={acc.code}>
                          {acc.code} - {acc.name} ({acc.type.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Debit Input */}
                  <div className="col-span-5 md:col-span-3 relative">
                    <span className="absolute left-2 top-1.5 text-[9px] font-mono text-slate-400">Rp</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      disabled={!!line.credit}
                      value={line.debit}
                      onChange={(e) => updateLine(index, 'debit', e.target.value)}
                      className="w-full pl-6 pr-1.5 py-1 text-right bg-white disabled:bg-slate-50 border border-slate-300 rounded text-[11px] font-mono focus:border-slate-900 focus:outline-hidden"
                    />
                  </div>

                  {/* Credit Input */}
                  <div className="col-span-5 md:col-span-3 relative">
                    <span className="absolute left-2 top-1.5 text-[9px] font-mono text-slate-400">Rp</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      disabled={!!line.debit}
                      value={line.credit}
                      onChange={(e) => updateLine(index, 'credit', e.target.value)}
                      className="w-full pl-6 pr-1.5 py-1 text-right bg-white disabled:bg-slate-50 border border-slate-300 rounded text-[11px] font-mono focus:border-slate-900 focus:outline-hidden"
                    />
                  </div>

                  {/* Delete button */}
                  <div className="col-span-2 md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      disabled={lines.length <= 2}
                      onClick={() => removeLine(index)}
                      className="p-1 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addLine}
              className="mt-1.5 text-[10px] font-mono text-slate-600 hover:text-slate-950 hover:underline flex items-center gap-1 focus:outline-hidden"
            >
              + Tambah Baris Akun
            </button>

            {/* Validation Display & Action Buttons */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Balances Status */}
              <div className="flex gap-4 font-mono text-[10px]">
                <div>
                  <span className="text-slate-400 block text-[8px] uppercase">Total Debet</span>
                  <span className="font-semibold text-slate-900">{formatRupiah(totalDebits)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[8px] uppercase">Total Kredit</span>
                  <span className="font-semibold text-slate-900">{formatRupiah(totalCredits)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[8px] uppercase">Selisih Seimbang</span>
                  <span className={`font-semibold ${isBalanced ? 'text-emerald-600' : 'text-red-500'}`}>
                    {discrepancy === 0 ? 'Rp 0 (Balanced)' : `Rp ${new Intl.NumberFormat('id-ID').format(discrepancy)}`}
                  </span>
                </div>
              </div>

              {/* Action and Alert Area */}
              <div className="flex items-center gap-2">
                {validationError && (
                  <div className="text-[10px] text-red-500 flex items-center gap-1 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-sm">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}
                {isBalanced && !validationError && (
                  <div className="text-[10px] text-emerald-600 flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-sm font-mono">
                    <Check className="h-3 w-3" />
                    <span>Seimbang & Siap</span>
                  </div>
                )}
                
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-[11px] font-mono rounded transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!isBalanced}
                    className="px-4 py-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[11px] font-mono rounded shadow-xs transition-all"
                  >
                    Simpan Jurnal
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Filtering and Search Controls */}
      <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-[9px] font-mono text-slate-400 uppercase mb-0.5">Cari Keterangan / Kode Akun / Ref</label>
            <input
              type="text"
              placeholder="Ketik kata kunci pencarian..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] focus:border-slate-900 focus:bg-white focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-[9px] font-mono text-slate-400 uppercase mb-0.5">Mulai Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono focus:border-slate-900 focus:bg-white focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-[9px] font-mono text-slate-400 uppercase mb-0.5">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono focus:border-slate-900 focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Journal Table List */}
      <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            Daftar Jurnal Umum ({filteredEntries.length} Transaksi)
          </span>
          {searchTerm || startDate || endDate ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setStartDate('');
                setEndDate('');
              }}
              className="text-[9px] font-mono text-slate-400 hover:text-slate-900 hover:underline"
            >
              Reset Filter
            </button>
          ) : null}
        </div>

        {filteredEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[9px] font-mono text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-2 px-3 w-28">Tanggal</th>
                  <th className="py-2 px-3 w-28">No. Voucher</th>
                  <th className="py-2 px-3">Keterangan / Akun Rekening</th>
                  <th className="py-2 px-3 text-right w-36">Debet (Rp)</th>
                  <th className="py-2 px-3 text-right w-36">Kredit (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <React.Fragment key={entry.id}>
                    {/* Header Row */}
                    <tr className="border-b border-slate-100 bg-slate-50/20 font-sans text-[11px]">
                      <td className="py-1.5 px-3 font-mono text-slate-500 font-medium">
                        {entry.date}
                      </td>
                      <td className="py-1.5 px-3 font-mono font-semibold text-slate-900">
                        {entry.reference}
                      </td>
                      <td className="py-1.5 px-3 text-slate-900 font-medium font-sans" colSpan={3}>
                        {entry.description}
                      </td>
                    </tr>
                    {/* Line Items Rows */}
                    {entry.lines.map((line, lIdx) => {
                      const acc = accounts.find(a => a.code === line.accountCode);
                      return (
                        <tr 
                          key={line.id} 
                          className="border-b border-slate-50 hover:bg-slate-50/40 text-[11px] transition-colors"
                        >
                          <td className="py-1 px-3"></td>
                          <td className="py-1 px-3"></td>
                          <td className="py-1 px-3">
                            <div className={`flex items-center gap-2 ${line.credit > 0 ? 'pl-6' : ''}`}>
                              <span className="font-mono text-slate-400 text-[10px]">{line.accountCode}</span>
                              <span className={line.credit > 0 ? 'text-slate-500 italic' : 'text-slate-800 font-medium'}>
                                {acc ? acc.name : 'Akun Tidak Ditemukan'}
                              </span>
                            </div>
                          </td>
                          <td className="py-1 px-3 text-right font-mono text-slate-800">
                            {line.debit > 0 ? formatRupiah(line.debit) : '—'}
                          </td>
                          <td className="py-1 px-3 text-right font-mono text-slate-800">
                            {line.credit > 0 ? formatRupiah(line.credit) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-[10px] font-mono text-slate-400">
            Tidak ada data jurnal umum yang sesuai dengan filter pencarian.
          </div>
        )}
      </div>
    </div>
  );
}
