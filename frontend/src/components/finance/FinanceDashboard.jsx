import React, { useState, useEffect } from 'react';
import { financeApi } from './api/financeApi';

export default function FinanceDashboard({ setActiveTab }) {
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalParties: 0,
    totalCostCenters: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [accounts, parties, costCenters] = await Promise.all([
        financeApi.getChartOfAccounts().catch(() => []),
        financeApi.getParties().catch(() => []),
        financeApi.getCostCenters().catch(() => []),
      ]);

      setStats({
        totalAccounts: Array.isArray(accounts) ? accounts.length : 0,
        totalParties: Array.isArray(parties) ? parties.length : 0,
        totalCostCenters: Array.isArray(costCenters) ? costCenters.length : 0,
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to fetch dashboard summary metrics. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Finance & Accounting Dashboard</h1>
          <p className="text-sm text-slate-500">Overview of general ledger, parties, cost centers, and transactions</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 text-xs font-semibold bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
        >
          Refresh Metrics
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div 
          onClick={() => setActiveTab && setActiveTab('accounts')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 cursor-pointer transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chart of Accounts</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              📊
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono">
            {loading ? '...' : stats.totalAccounts}
          </div>
          <p className="text-xs text-slate-500 mt-2">Active ledger categories and accounts</p>
        </div>

        <div 
          onClick={() => setActiveTab && setActiveTab('parties')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-400 cursor-pointer transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Parties & Vendors</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              🤝
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono">
            {loading ? '...' : stats.totalParties}
          </div>
          <p className="text-xs text-slate-500 mt-2">Registered clients, vendors, and partners</p>
        </div>

        <div 
          onClick={() => setActiveTab && setActiveTab('overheads')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-amber-400 cursor-pointer transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cost Centers</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
              🏢
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono">
            {loading ? '...' : stats.totalCostCenters}
          </div>
          <p className="text-xs text-slate-500 mt-2">Head office, plants, and depots tracked</p>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab && setActiveTab('journal')}
            className="p-4 text-left border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex flex-col justify-between"
          >
            <div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1">New Journal Entry</h3>
              <p className="text-xs text-slate-500">Record balanced double-entry vouchers with automatic debit/credit verification.</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 mt-4 inline-block">Create Voucher →</span>
          </button>

          <button
            onClick={() => setActiveTab && setActiveTab('reports')}
            className="p-4 text-left border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex flex-col justify-between"
          >
            <div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1">Financial Reports</h3>
              <p className="text-xs text-slate-500">Generate P&L statements, Balance Sheets, and Trial Balances dynamically.</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 mt-4 inline-block">View Reports →</span>
          </button>

          <button
            onClick={() => setActiveTab && setActiveTab('overheads')}
            className="p-4 text-left border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex flex-col justify-between"
          >
            <div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1">Overhead & Salary</h3>
              <p className="text-xs text-slate-500">Manage monthly salaries, utilities, CAPEX, and OPEX across operational units.</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 mt-4 inline-block">Manage Overheads →</span>
          </button>
        </div>
      </div>
    </div>
  );
}