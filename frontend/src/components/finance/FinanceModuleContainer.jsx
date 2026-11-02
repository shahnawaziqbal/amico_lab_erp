import React, { useState } from 'react';
import FinanceDashboard from './FinanceDashboard';
import ChartOfAccountsView from './ChartOfAccountsView';
import PartyRegistryView from './PartyRegistryView';
import JournalEntryForm from './JournalEntryForm';
import CostCenterOverheadView from './CostCenterOverheadView';
import FinancialReportsView from './FinancialReportsView';

export default function FinanceModuleContainer() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'accounts', label: 'Chart of Accounts', icon: '📁' },
    { id: 'parties', label: 'Parties & Vendors', icon: '🤝' },
    { id: 'journal', label: 'Journal Entries', icon: '📝' },
    { id: 'overheads', label: 'Cost Centers & Overheads', icon: '🏢' },
    { id: 'reports', label: 'Financial Reports', icon: '📈' },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header & Horizontal Submenu Navigation */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Module Title Section */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm font-semibold flex items-center justify-center">
                <span className="text-lg">⚖️</span>
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  Finance & Accounting
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Double-Entry Engine • Enterprise Ledger
                </p>
              </div>
            </div>

            {/* Version Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync Active
            </div>
          </div>

          {/* Horizontal Navigation Bar */}
          <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="transition-all duration-200 ease-in-out">
          {activeTab === 'dashboard' && <FinanceDashboard setActiveTab={setActiveTab} />}
          {activeTab === 'accounts' && <ChartOfAccountsView />}
          {activeTab === 'parties' && <PartyRegistryView />}
          {activeTab === 'journal' && <JournalEntryForm />}
          {activeTab === 'overheads' && <CostCenterOverheadView />}
          {activeTab === 'reports' && <FinancialReportsView />}
        </div>
      </main>
    </div>
  );
}