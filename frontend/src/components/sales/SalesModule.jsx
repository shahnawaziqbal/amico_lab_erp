import React, { useState, useEffect } from 'react';
import { Building2, CheckCircle2, ShoppingCart, Layers, Award, TrendingUp, Users, DollarSign } from 'lucide-react';
import axios from 'axios';
import FoEvaluationContainer from './FoEvaluationContainer';
import NewFieldOrderForm from './NewFieldOrderForm';
import AccountsPipeline from './AccountsPipeline';

const DEPOT_LIST = [
  'All 13 Depots',
  'Depot - Dhaka (DK)',
  'Depot - Mymensingh (MYM)',
  'Depot - Dinajpur (DIN)',
  'Depot - Rajshahi (RAJ)',
  'Depot - Bogura (BOG)',
  'Depot - Chittagong (CTG)',
  'Depot - Comilla (COM)',
  'Depot - Noakhali (NOA)',
  'Depot - Sylhet (SYL)',
  'Depot - Barisal (BAR)',
  'Depot - Faridpur (FAR)',
  'Depot - Jessore (JES)',
  'Depot - Kushtia (KUS)'
];

export default function SalesModule({ activeDepotFilter = 'All 13 Depots' }) {
  const [selectedDepotFilter, setSelectedDepotFilter] = useState(activeDepotFilter);
  const [successToast, setSuccessToast] = useState('');
  const [activeTab, setActiveTab] = useState('evaluation_template');
  
  const [products, setProducts] = useState([]);
  const [fieldOfficers, setFieldOfficers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const systemDate = '2026-10-13';

  useEffect(() => {
    fetchMasterDatabaseData();
  }, [selectedDepotFilter]);

  async function fetchMasterDatabaseData() {
    setLoading(true);
    try {
      const [prodRes, foRes, jeRes, accRes] = await Promise.all([
        axios.get('http://localhost:3000/api/products').catch(() => ({ data: [] })),
        axios.get('http://localhost:3000/api/field-officers').catch(() => ({ data: [] })),
        axios.get('http://localhost:3000/finance/journals').catch(() => ({ data: [] })),
        axios.get('http://localhost:3000/finance/accounts').catch(() => ({ data: [] })),
      ]);

      if (Array.isArray(prodRes.data)) setProducts(prodRes.data);
      if (Array.isArray(foRes.data)) setFieldOfficers(foRes.data);
      if (Array.isArray(jeRes.data)) setOrders(jeRes.data);
      if (Array.isArray(accRes.data)) setAccounts(accRes.data);
    } catch (err) {
      console.warn('Backend synchronization warning.');
    } finally {
      setLoading(false);
    }
  }

  // Filtered FO count & total sales based on selected territory depot
  const filteredFos = fieldOfficers.filter(fo => {
    if (selectedDepotFilter === 'All 13 Depots') return true;
    return fo.depotName?.toLowerCase().includes(selectedDepotFilter.toLowerCase()) || 
           fo.depotCode?.toLowerCase() === selectedDepotFilter.split('(')[1]?.replace(')', '').toLowerCase();
  });

  const totalDepotSales = filteredFos.reduce((sum, f) => sum + (Number(f.threeMonthAvg) || 0), 0);

  return (
    <div className="space-y-6 text-slate-100 font-sans p-6 bg-slate-950 min-h-screen">
      {successToast && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 p-4 rounded-2xl flex items-center justify-between text-emerald-300 text-xs shadow-xl animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
          <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-200">System Date: {systemDate}</span>
        </div>
      )}

      {/* Header Banner with Real-time KPI Stats */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-500/30 p-6 rounded-3xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-blue-500/20 rounded-2xl text-blue-400 border border-blue-500/30 shadow-inner">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono bg-cyan-500/15 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 uppercase">Enterprise ERP Active</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 uppercase">SQLite Live Sync</span>
            </div>
            <h3 className="text-base font-bold text-white tracking-wide mt-1">Amico Laboratories Ltd. — Sales & Field Officer Command Center</h3>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Synchronized with <strong className="text-cyan-400">{products.length} Product SKUs</strong>[cite: 1], <strong className="text-emerald-400">{fieldOfficers.length} Active Field Officers</strong>[cite: 1], and General Ledger.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Scope Territory</span>
            <select 
              value={selectedDepotFilter} 
              onChange={(e) => setSelectedDepotFilter(e.target.value)}
              className="bg-transparent text-cyan-400 text-xs font-bold outline-none cursor-pointer mt-0.5"
            >
              {DEPOT_LIST.map((depot, index) => (
                <option key={index} value={depot} className="bg-slate-900 text-white">{depot}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Secondary KPI Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl"><Users className="w-5 h-5" /></div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono">Active FOs in Scope</span>
            <div className="text-lg font-mono font-bold text-white">{filteredFos.length} <span className="text-xs font-normal text-slate-400">/ {fieldOfficers.length}</span></div>
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono">Territory 3M Sales</span>
            <div className="text-lg font-mono font-bold text-emerald-400">৳ {Number(totalDepotSales).toLocaleString()}</div>
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><ShoppingCart className="w-5 h-5" /></div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono">Total Product SKUs</span>
            <div className="text-lg font-mono font-bold text-white">{products.length} <span className="text-xs font-normal text-slate-400">Items</span></div>
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl"><DollarSign className="w-5 h-5" /></div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono">Posted Vouchers</span>
            <div className="text-lg font-mono font-bold text-indigo-300">{orders.length} <span className="text-xs font-normal text-slate-400">Synced</span></div>
          </div>
        </div>
      </div>

      {/* Main Module Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('evaluation_template')} 
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${activeTab === 'evaluation_template' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
        >
          <Layers className="w-4 h-4 text-cyan-400" /> FO Evaluation Suite ({filteredFos.length} FOs)
        </button>
        <button 
          onClick={() => setActiveTab('orders')} 
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
        >
          <ShoppingCart className="w-4 h-4 text-cyan-400" /> New Field Order & Invoicing
        </button>
        <button 
          onClick={() => setActiveTab('pipeline')} 
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${activeTab === 'pipeline' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
        >
          Live Accounts Pipeline & VAT ({orders.length})
        </button>
      </div>

      {/* Tab Content Routing */}
      {activeTab === 'evaluation_template' && (
        <FoEvaluationContainer 
          fieldOfficers={filteredFos} 
          selectedDepotFilter={selectedDepotFilter} 
          setSuccessToast={setSuccessToast} 
        />
      )}

      {activeTab === 'orders' && (
        <NewFieldOrderForm 
          products={products} 
          fieldOfficers={fieldOfficers} 
          accounts={accounts} 
          systemDate={systemDate} 
          setSuccessToast={setSuccessToast} 
          onOrderSuccess={fetchMasterDatabaseData} 
        />
      )}

      {activeTab === 'pipeline' && (
        <AccountsPipeline 
          orders={orders} 
          systemDate={systemDate} 
        />
      )}
    </div>
  );
}