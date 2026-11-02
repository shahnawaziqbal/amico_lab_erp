import React, { useState } from 'react';
import { Award, UserPlus, Search, ChevronRight, BarChart3, Layers, TrendingUp, ShieldAlert, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function FoEvaluationContainer({ fieldOfficers, selectedDepotFilter, setSuccessToast }) {
  const [evalSubTab, setEvalSubTab] = useState('scorecard');
  const [selectedTeriCode, setSelectedTeriCode] = useState(fieldOfficers[0]?.teriCode || '');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newFoForm, setNewFoForm] = useState({
    teriCode: 'ODK-' + Math.floor(100 + Math.random() * 900),
    fullName: '',
    depotCode: 'DK',
    depotName: 'Dhaka',
    joinDate: '2026-01-15',
    tenureMonths: 9,
    tenureBand: '6-12 Months',
    threeMonthAvg: '65000.00',
    compositeScore: '88.5',
    tier: 'B – Competent'
  });

  const handleRegisterFo = async (e) => {
    e.preventDefault();
    if (!newFoForm.fullName.trim()) {
      alert('Please enter the Field Officer full name.');
      return;
    }

    try {
      await axios.post('http://localhost:3000/api/field-officers', newFoForm);
      setSuccessToast(`Field Officer ${newFoForm.fullName} (${newFoForm.teriCode}) successfully registered!`);
      setTimeout(() => setSuccessToast(''), 5000);
      setEvalSubTab('scorecard');
    } catch (err) {
      alert('Failed to register FO: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredFos = fieldOfficers.filter(fo => {
    const matchesSearch = (fo.fullName || fo.name)?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      fo.teriCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fo.depotName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedDepotFilter === 'All 13 Depots') return matchesSearch;
    return matchesSearch && fo.depotName?.toLowerCase().includes(selectedDepotFilter.toLowerCase());
  });

  const selectedFoProfile = fieldOfficers.find(fo => fo.teriCode === selectedTeriCode) || fieldOfficers[0];

  // Calculate analytical summaries for Dashboard / Benchmarking
  const totalSalesAll = filteredFos.reduce((acc, f) => acc + (Number(f.threeMonthAvg) || 0), 0);
  const avgCompositeScore = filteredFos.length > 0 
    ? (filteredFos.reduce((acc, f) => acc + (Number(f.compositeScore) || 0), 0) / filteredFos.length).toFixed(1) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Analytics Summary Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Active Filtered FOs</span>
          <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">{filteredFos.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Depot scope: {selectedDepotFilter}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Avg Composite Score</span>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">{avgCompositeScore} / 100</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Weighted evaluation metric</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Total 3M Territory Sales</span>
          <div className="text-xl font-mono font-bold text-white mt-1">৳ {Number(totalSalesAll).toLocaleString()}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Combined 3-month performance</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Evaluation Period</span>
          <div className="text-lg font-mono font-bold text-amber-400 mt-1">September 2026</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Active planning cycle</p>
        </div>
      </div>

      {/* Sub-navigation & Search Toolbar */}
      <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button 
            onClick={() => setEvalSubTab('scorecard')} 
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${evalSubTab === 'scorecard' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Scorecard Matrix ({filteredFos.length})
          </button>
          <button 
            onClick={() => setEvalSubTab('fo_profile')} 
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${evalSubTab === 'fo_profile' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Individual FO Drilldown
          </button>
          <button 
            onClick={() => setEvalSubTab('register_fo')} 
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all ${evalSubTab === 'register_fo' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Register New FO
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by name, TERI code..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="bg-slate-950 border border-slate-800 text-xs pl-8 pr-3 py-2 rounded-xl outline-none text-white w-56 focus:border-cyan-500/50" 
          />
        </div>
      </div>

      {/* VIEW 1: SCORECARD MATRIX TABLE */}
      {evalSubTab === 'scorecard' && (
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-400" /> Field Officer Evaluation Scorecard Matrix
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Click any record to inspect full performance drilldown, composite breakdown, and tier history.</p>
            </div>
            <span className="text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full">
              Showing {filteredFos.length} Active Records
            </span>
          </div>

          <div className="overflow-x-auto max-h-[520px] overflow-y-auto border border-slate-800 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase bg-slate-950 sticky top-0 z-10">
                  <th className="p-3.5">SL</th>
                  <th className="p-3.5">Field Officer Name</th>
                  <th className="p-3.5">Teri Code</th>
                  <th className="p-3.5">Depot Code & Territory</th>
                  <th className="p-3.5">Tenure Band</th>
                  <th className="p-3.5">3M Avg Sales (BDT)</th>
                  <th className="p-3.5">Composite Score</th>
                  <th className="p-3.5">Performance Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredFos.map((fo, idx) => (
                  <tr 
                    key={idx} 
                    className="hover:bg-slate-950/60 cursor-pointer transition-colors" 
                    onClick={() => { setSelectedTeriCode(fo.teriCode); setEvalSubTab('fo_profile'); }}
                  >
                    <td className="p-3.5 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="p-3.5 font-semibold text-white flex items-center gap-2">
                      {fo.fullName || fo.name} <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                    </td>
                    <td className="p-3.5 font-mono text-cyan-400 font-bold">{fo.teriCode}</td>
                    <td className="p-3.5 text-slate-300">
                      <span className="font-mono text-amber-400 font-bold">{fo.depotCode}</span> - {fo.depotName}
                    </td>
                    <td className="p-3.5 text-slate-400">{fo.tenureBand}</td>
                    <td className="p-3.5 font-mono text-emerald-400 font-semibold">{Number(fo.threeMonthAvg || 0).toLocaleString()}</td>
                    <td className="p-3.5 font-mono font-bold text-cyan-300">{fo.compositeScore}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        fo.tier?.includes('A') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 
                        fo.tier?.includes('B') ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {fo.tier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: REGISTER NEW FO FORM */}
      {evalSubTab === 'register_fo' && (
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl max-w-2xl mx-auto space-y-5 shadow-xl">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" /> Register New Field Officer in Database
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Instantly creates and binds the new officer record for multi-depot order routing.</p>
          </div>

          <form onSubmit={handleRegisterFo} className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 block mb-1 font-medium">Field Officer Full Name</label>
              <input 
                type="text" 
                value={newFoForm.fullName} 
                onChange={(e) => setNewFoForm({...newFoForm, fullName: e.target.value})} 
                placeholder="e.g. MD. SHAHNAWAZ SADIK"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500" 
                required 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-medium">Unique TERI Code</label>
                <input 
                  type="text" 
                  value={newFoForm.teriCode} 
                  onChange={(e) => setNewFoForm({...newFoForm, teriCode: e.target.value})} 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-cyan-400 font-mono outline-none" 
                  required 
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-medium">Territory Depot Code</label>
                <select 
                  value={newFoForm.depotCode} 
                  onChange={(e) => {
                    const code = e.target.value;
                    const nameMap = { 'DK': 'Dhaka', 'MYM': 'Mymensingh', 'DIN': 'Dinajpur', 'RAJ': 'Rajshahi', 'BOG': 'Bogura', 'CTG': 'Chittagong', 'COM': 'Comilla', 'NOA': 'Noakhali', 'SYL': 'Sylhet', 'BAR': 'Barisal', 'FAR': 'Faridpur', 'JES': 'Jessore', 'KUS': 'Kushtia' };
                    setNewFoForm({...newFoForm, depotCode: code, depotName: nameMap[code] || 'Dhaka'});
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-amber-400 font-mono outline-none cursor-pointer"
                >
                  <option value="DK">DK - Dhaka</option>
                  <option value="MYM">MYM - Mymensingh</option>
                  <option value="DIN">DIN - Dinajpur</option>
                  <option value="RAJ">RAJ - Rajshahi</option>
                  <option value="BOG">BOG - Bogura</option>
                  <option value="CTG">CTG - Chittagong</option>
                  <option value="COM">COM - Comilla</option>
                  <option value="NOA">NOA - Noakhali</option>
                  <option value="SYL">SYL - Sylhet</option>
                  <option value="BAR">BAR - Barisal</option>
                  <option value="FAR">FAR - Faridpur</option>
                  <option value="JES">JES - Jessore</option>
                  <option value="KUS">KUS - Kushtia</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-medium">3-Month Avg Sales</label>
                <input 
                  type="number" 
                  value={newFoForm.threeMonthAvg} 
                  onChange={(e) => setNewFoForm({...newFoForm, threeMonthAvg: e.target.value})} 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-mono" 
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-medium">Composite Score</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={newFoForm.compositeScore} 
                  onChange={(e) => setNewFoForm({...newFoForm, compositeScore: e.target.value})} 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-mono" 
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-medium">Performance Tier</label>
                <select 
                  value={newFoForm.tier} 
                  onChange={(e) => setNewFoForm({...newFoForm, tier: e.target.value})} 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 outline-none cursor-pointer font-bold"
                >
                  <option value="A – Excellent">A – Excellent</option>
                  <option value="B – Competent">B – Competent</option>
                  <option value="C – Developing">C – Developing</option>
                </select>
              </div>
            </div>

            <button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/40 cursor-pointer transition-all">
              Save Field Officer to Database
            </button>
          </form>
        </div>
      )}

      {/* VIEW 3: INDIVIDUAL FO PROFILE DRILLDOWN */}
      {evalSubTab === 'fo_profile' && selectedFoProfile && (
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">Individual FO Scorecard Breakdown</span>
              <h3 className="text-lg font-bold text-white mt-1">{selectedFoProfile.fullName || selectedFoProfile.name} ({selectedFoProfile.teriCode})</h3>
              <p className="text-xs text-slate-400">Territory Depot: <strong className="text-amber-400">{selectedFoProfile.depotCode}</strong> - {selectedFoProfile.depotName} | Tenure Band: {selectedFoProfile.tenureBand}</p>
            </div>
            <select 
              value={selectedTeriCode} 
              onChange={(e) => setSelectedTeriCode(e.target.value)} 
              className="bg-slate-950 border border-slate-700 text-xs text-cyan-400 px-3.5 py-2.5 rounded-xl outline-none cursor-pointer font-mono"
            >
              {fieldOfficers.map((f, i) => (
                <option key={i} value={f.teriCode}>{f.teriCode} - {f.fullName || f.name} [{f.depotCode}]</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Composite Score</span>
              <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">{selectedFoProfile.compositeScore} / 100</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Territory Depot</span>
              <div className="text-sm font-mono font-bold text-amber-400 mt-2">{selectedFoProfile.depotCode} - {selectedFoProfile.depotName}</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Performance Tier</span>
              <div className="text-sm font-bold text-emerald-400 mt-2">{selectedFoProfile.tier}</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">3-Month Avg Sales</span>
              <div className="text-xl font-mono font-bold text-white mt-1">৳ {Number(selectedFoProfile.threeMonthAvg || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}