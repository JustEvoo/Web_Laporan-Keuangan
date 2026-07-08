import React, { useState, useEffect } from 'react';
import { Account, JournalEntry } from './types';
import { initialAccounts, initialJournalEntries } from './initialData';
import { getAccountingSummary } from './utils';
import DashboardView from './components/DashboardView';
import JournalView from './components/JournalView';
import LedgerView from './components/LedgerView';
import FinancialStatements from './components/FinancialStatements';
import { 
  LayoutDashboard, 
  BookOpen, 
  Layers, 
  FileSpreadsheet, 
  RefreshCw, 
  User, 
  Activity,
  Menu,
  X,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Navigation State
  const [currentView, setCurrentView] = useState<'dashboard' | 'journal' | 'ledger' | 'statements'>('dashboard');
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<string | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Accounting Database State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize Data from LocalStorage or Seed Data
  useEffect(() => {
    const storedAccounts = localStorage.getItem('indoledger_accounts');
    const storedEntries = localStorage.getItem('indoledger_journal_entries');

    if (storedAccounts && storedEntries) {
      try {
        setAccounts(JSON.parse(storedAccounts));
        setEntries(JSON.parse(storedEntries));
      } catch (err) {
        console.error('Failed to parse stored accounting data, reverting to seed:', err);
        setAccounts(initialAccounts);
        setEntries(initialJournalEntries);
      }
    } else {
      // Fallback to beautiful pre-packaged Indonesian demo data
      setAccounts(initialAccounts);
      setEntries(initialJournalEntries);
      localStorage.setItem('indoledger_accounts', JSON.stringify(initialAccounts));
      localStorage.setItem('indoledger_journal_entries', JSON.stringify(initialJournalEntries));
    }
    setIsLoaded(true);
  }, []);

  // Save changes to localStorage whenever entries state changes
  const handleAddEntry = (newEntry: JournalEntry) => {
    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
    localStorage.setItem('indoledger_journal_entries', JSON.stringify(updatedEntries));
  };

  // Reset core data to defaults
  const handleResetData = () => {
    if (window.confirm('Apakah Anda yakin ingin menyetel ulang data pembukuan ke contoh bawaan IndoLedger? Semua transaksi baru akan dihapus.')) {
      setAccounts(initialAccounts);
      setEntries(initialJournalEntries);
      localStorage.setItem('indoledger_accounts', JSON.stringify(initialAccounts));
      localStorage.setItem('indoledger_journal_entries', JSON.stringify(initialJournalEntries));
      setCurrentView('dashboard');
    }
  };

  // Redirect to Ledger from Dashboard
  const handleSelectAccountFromDashboard = (accountCode: string) => {
    setSelectedLedgerAccount(accountCode);
    setCurrentView('ledger');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center font-mono text-xs text-neutral-400">
        <Activity className="h-6 w-6 animate-pulse text-neutral-900 mb-2" />
        Memuat Core Ledger Engine...
      </div>
    );
  }

  const summary = getAccountingSummary(accounts, entries);

  // Navigation Items definition
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'journal', name: 'Jurnal Umum', icon: BookOpen },
    { id: 'ledger', name: 'Buku Besar', icon: Layers },
    { id: 'statements', name: 'Laporan Keuangan', icon: FileSpreadsheet },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* Sidebar - Desktop Layout */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center text-white font-mono font-bold tracking-tight text-sm shadow-xs">
            IL
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-950 tracking-tight">
              INDOLEDGER
            </h1>
            <p className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">
              Modern ERP Suite
            </p>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
            Menu Utama
          </div>
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  if (item.id !== 'ledger') {
                    setSelectedLedgerAccount(undefined);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs transition-colors font-mono ${
                  isActive 
                    ? 'bg-slate-100 text-slate-900 font-bold shadow-xs' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </button>
            );
          })}

          {/* Core Engine Status Display */}
          <div className="pt-6">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
              Status Sistem
            </div>
            <div className="bg-slate-50 border border-slate-200/60 rounded-md p-3 space-y-2 text-[10px] font-mono text-slate-500 mx-1">
              <div className="flex justify-between items-center">
                <span>Jurnal:</span>
                <span className="font-bold text-slate-900">{entries.length} entri</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Persamaan:</span>
                <span className={`font-bold flex items-center gap-1 ${summary.isBalanced ? 'text-emerald-600' : 'text-amber-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${summary.isBalanced ? 'bg-emerald-600' : 'bg-amber-500'}`}></span>
                  {summary.isBalanced ? 'MATCH' : 'SELISIH'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Versi:</span>
                <span className="text-slate-400">v1.2.0</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Sidebar Footer User Section */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between font-mono">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-bold text-xs text-slate-700">
              AD
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-800">Admin IndoLedger</div>
              <div className="text-[9px] text-slate-400">Pro ERP Account</div>
            </div>
          </div>
          <button
            onClick={handleResetData}
            title="Reset data ke contoh bawaan"
            className="p-1.5 hover:bg-slate-50 border border-slate-200 rounded text-slate-400 hover:text-slate-900 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-slate-900 text-white rounded flex items-center justify-center font-mono font-bold text-xs">
            IL
          </div>
          <div>
            <h1 className="text-xs font-extrabold text-slate-950 tracking-tight">INDOLEDGER</h1>
            <p className="text-[8px] font-mono tracking-widest text-slate-400 uppercase">Modern ERP</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleResetData}
            title="Sistem ulang data"
            className="p-2 hover:bg-slate-100 rounded text-slate-500"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded hover:bg-slate-100 text-slate-500 focus:outline-hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-b border-slate-200 bg-white overflow-hidden shadow-inner sticky top-13 z-35"
          >
            <div className="px-2 pt-2 pb-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setMobileMenuOpen(false);
                      if (item.id !== 'ledger') {
                        setSelectedLedgerAccount(undefined);
                      }
                    }}
                    className={`w-full px-3 py-2.5 rounded-md text-xs font-mono flex items-center gap-2 ${
                      isActive 
                        ? 'bg-slate-900 text-white font-semibold' 
                        : 'text-slate-500 hover:text-slate-955 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 h-screen overflow-hidden">
        
        {/* Desktop Header */}
        <header className="hidden md:flex h-14 bg-white border-b border-slate-200 px-8 items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {navItems.find(item => item.id === currentView)?.name || 'Dashboard'}
            </h2>
            <span className="text-slate-300">|</span>
            <span className="text-[10px] font-mono text-slate-400">
              Akun: Active & Local Storage Persisted
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded text-[10px]">
              <span className="text-slate-400">STATUS PERSAMAAN:</span>
              <span className={`font-bold flex items-center gap-1 ${summary.isBalanced ? 'text-emerald-600' : 'text-amber-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${summary.isBalanced ? 'bg-emerald-600' : 'bg-amber-500'}`}></span>
                {summary.isBalanced ? 'SEIMBANG' : 'ADA SELISIH'}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6 md:p-8 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {currentView === 'dashboard' && (
                <DashboardView 
                  accounts={accounts} 
                  entries={entries} 
                  onNavigate={setCurrentView}
                  onSelectAccount={handleSelectAccountFromDashboard}
                />
              )}
              
              {currentView === 'journal' && (
                <JournalView 
                  accounts={accounts} 
                  entries={entries} 
                  onAddEntry={handleAddEntry}
                  onResetData={handleResetData}
                />
              )}
              
              {currentView === 'ledger' && (
                <LedgerView 
                  accounts={accounts} 
                  entries={entries} 
                  selectedAccountCode={selectedLedgerAccount}
                  onSelectAccount={setSelectedLedgerAccount}
                />
              )}
              
              {currentView === 'statements' && (
                <FinancialStatements 
                  accounts={accounts} 
                  entries={entries} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Modern Compact Footer inside main content area */}
        <footer className="bg-white border-t border-slate-200 py-3.5 text-center font-mono text-[10px] text-slate-400 print:hidden shrink-0">
          <div className="px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>IndoLedger ERP — Core Ledger Engine: v1.2.0</span>
            <span>© 2026 IndoLedger Modern ERP. High-Density Aesthetic.</span>
          </div>
        </footer>
      </main>

    </div>
  );
}
