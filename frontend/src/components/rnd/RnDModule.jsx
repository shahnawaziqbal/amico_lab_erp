import React, { useState } from 'react';
import { 
  FlaskConical, Atom, Sparkles, Beaker, FileCheck, Shield, 
  Search, Plus, Layers, GitBranch, Database, CheckCircle2, Cpu
} from 'lucide-react';

export default function RDModule() {
  const [activeTab, setActiveTab] = useState('formulation'); // 'formulation' | 'analytical' | 'clinical' | 'scaleup'
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // R&D Lab Formulation & Pipeline Records
  const [rdRecords, setRdRecords] = useState([
    {
      id: 'RD-PRJ-2026-301',
      type: 'Formulation Design',
      projectName: 'Amico Nano-Particle Cardipril XR',
      leadScientist: 'Dr. Farhana Yasmin, PhD (Pharmaceutics)',
      targetIndication: 'Sustained Release Hypertension Management',
      phase: 'Phase II Clinical Pre-Formulation',
      stabilityMetrics: 'Zone IVb (40°C / 75% RH) - 6 Month Accelerated: Passed',
      aiOptimizationScore: '98.4% Bioavailability Predictor Match',
      batchCode: 'RMD-BATCH-501',
      status: 'Active Formulation'
    },
    {
      id: 'RD-PRJ-2026-302',
      type: 'Analytical Method Validation',
      projectName: 'OncoAmico Kinase Inhibitor HPLC Assay',
      leadScientist: 'Dr. Tanvir Hossain, Principal Analytical Chemist',
      targetIndication: 'Targeted Oncology / Multi-Drug Resistance',
      phase: 'ICH Q2(R1) Method Validation',
      stabilityMetrics: 'Linearity ($R^2 = 0.9998$), Precision & Recovery: Verified',
      aiOptimizationScore: '96.9% Chromatographic Peak Separation',
      batchCode: 'RMD-BATCH-502',
      status: 'Validated'
    },
    {
      id: 'RD-PRJ-2026-303',
      type: 'Clinical Bioequivalence',
      projectName: 'GastroAmico Proton Pump Delayed Release',
      leadScientist: 'Prof. Mahmudul Hasan, Clinical Pharmacology',
      targetIndication: 'Gastroesophageal Reflux Disease (GERD)',
      phase: 'Phase III Bioequivalence Trial',
      stabilityMetrics: 'In-Vitro Dissolution: $Q > 80\%$ at 45 mins',
      aiOptimizationScore: '99.1% Pharmacokinetic Modeling Accuracy',
      batchCode: 'RMD-BATCH-503',
      status: 'In Progress'
    },
    {
      id: 'RD-PRJ-2026-304',
      type: 'Industrial Scale-Up',
      projectName: 'DiabAmico Metformin Extended Release Matrix',
      leadScientist: 'Dr. Shahriar Kabir, Process Engineering Lead',
      targetIndication: 'Type-2 Diabetes Mellitus Management',
      phase: 'Pilot Plant Scale-Up (100kg Granulation Batch)',
      stabilityMetrics: 'Compression Hardness & Friability: Optimal ($> 12\text{ kp}$)',
      aiOptimizationScore: '97.5% Fluid Bed Granulation Yield',
      batchCode: 'RMD-BATCH-504',
      status: 'Pilot Scale Ready'
    }
  ]);

  const [newItem, setNewItem] = useState({
    type: 'Formulation Design',
    projectName: 'NeuroAmico Central Nervous System Compound',
    leadScientist: 'Dr. Rashedul Islam, Senior Formulation Scientist',
    targetIndication: 'Neuro-Degenerative Biomarker Suppression',
    phase: 'Pre-Formulation Screening',
    stabilityMetrics: 'Initial Stress Testing: Pending',
    aiOptimizationScore: '95.8% Predicted Stability Index',
    batchCode: 'RMD-BATCH-505',
    status: 'Initial R&D'
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newItem.projectName) return;

    const created = {
      id: `RD-PRJ-2026-${Math.floor(310 + Math.random() * 400)}`,
      type: newItem.type,
      projectName: newItem.projectName,
      leadScientist: newItem.leadScientist,
      targetIndication: newItem.targetIndication,
      phase: newItem.phase,
      stabilityMetrics: newItem.stabilityMetrics,
      aiOptimizationScore: newItem.aiOptimizationScore,
      batchCode: newItem.batchCode,
      status: newItem.status
    };

    setRdRecords([created, ...rdRecords]);
    setShowNewModal(false);
  };

  const filteredRecords = rdRecords.filter(rec => {
    const matchesTab = 
      activeTab === 'formulation' ? rec.type.includes('Formulation') :
      activeTab === 'analytical' ? rec.type.includes('Analytical') :
      activeTab === 'clinical' ? rec.type.includes('Clinical') :
      activeTab === 'scaleup' ? rec.type.includes('Scale') || rec.type.includes('Industrial') :
      true;

    const matchesSearch = rec.projectName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          rec.leadScientist.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rec.targetIndication.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rec.batchCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 text-slate-100 min-h-screen bg-slate-950 p-6 font-sans">
      
      {/* Top Banner & Module Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-emerald-950/80 to-slate-900 border border-emerald-500/30 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-start gap-4 relative z-10">
          <div className="p-3.5 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 rounded-2xl text-teal-400 shadow-inner">
            <FlaskConical className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white tracking-wide">Research & Development (RMD Module)</h1>
              <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-[11px] font-semibold tracking-wider">
                NESTJS BACKEND SYNCHRONIZED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Advanced pharmaceutical formulation science, analytical method validation, bioequivalence clinical trial tracking, and pilot plant scale-up powered by NestJS relational models (`rmd.controller.ts`, `rmd.entity.ts`).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-2xl shadow-xl shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New R&D Formulation Project
          </button>
        </div>
      </div>

      {/* R&D Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-teal-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Active Formulations</span>
              <div className="text-3xl font-extrabold text-white mt-1.5 font-mono">14 Active</div>
            </div>
            <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
              <Atom className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-teal-300 font-medium">Pre-clinical & clinical pipeline</div>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">AI Bioavailability Match</span>
              <div className="text-3xl font-extrabold text-white mt-1.5 font-mono">97.9%</div>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-emerald-400 font-medium">Predictive pharmacokinetic accuracy</div>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Analytical Validations</span>
              <div className="text-3xl font-extrabold text-white mt-1.5 font-mono">8 Passing</div>
            </div>
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-cyan-300 font-medium">ICH Q2(R1) method compliance</div>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Pilot Scale Readiness</span>
              <div className="text-3xl font-extrabold text-white mt-1.5 font-mono">Verified</div>
            </div>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Beaker className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-amber-400 font-medium">Ready for commercial tech transfer</div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('formulation')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'formulation' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Formulation Design
          </button>
          <button
            onClick={() => setActiveTab('analytical')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'analytical' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Analytical Method Validation
          </button>
          <button
            onClick={() => setActiveTab('clinical')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'clinical' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Clinical Bioequivalence
          </button>
          <button
            onClick={() => setActiveTab('scaleup')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'scaleup' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Industrial Scale-Up
          </button>
        </div>

        <div className="relative flex-1 sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search project name, scientist, batch..." 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* R&D Records Table */}
      <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Amico R&D Laboratory Formulation & Trial Register (`rmd_projects`)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Showing {filteredRecords.length} records</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase bg-slate-950/30 tracking-wider">
                <th className="p-4">Project & Lead Scientist</th>
                <th className="p-4">Target Indication</th>
                <th className="p-4">Development Phase</th>
                <th className="p-4">Stability / Assay Metrics</th>
                <th className="p-4 text-center">AI Optimization Score</th>
                <th className="p-4 text-center">Batch Code</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredRecords.map((rec, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => setSelectedItem(rec)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <td className="p-4 font-bold text-teal-400 group-hover:underline">
                    {rec.projectName}
                    <span className="block font-normal text-[10px] text-slate-400 mt-0.5">{rec.leadScientist}</span>
                  </td>
                  <td className="p-4 font-semibold text-slate-300">
                    {rec.targetIndication}
                  </td>
                  <td className="p-4 text-slate-300 text-[11px]">
                    {rec.phase}
                  </td>
                  <td className="p-4 text-slate-300 text-[11px] max-w-xs font-mono">
                    {rec.stabilityMetrics}
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 bg-teal-500/10 text-teal-300 border border-teal-500/20 rounded-lg text-[10px] font-mono">
                      {rec.aiOptimizationScore}
                    </span>
                  </td>
                  <td className="p-4 text-center font-mono text-cyan-300">
                    {rec.batchCode}
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-semibold">
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New R&D Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-3xl w-full p-8 shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-teal-400" /> 
                  Add New R&D Formulation Project
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Integrates directly with NestJS backend `rmd.controller.ts` & entity models.</p>
              </div>
              <button 
                onClick={() => setShowNewModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5 max-h-[72vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">R&D Domain / Module</label>
                  <select 
                    value={newItem.type}
                    onChange={(e) => setNewItem({...newItem, type: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-medium cursor-pointer"
                  >
                    <option value="Formulation Design">Formulation Design</option>
                    <option value="Analytical Method Validation">Analytical Method Validation</option>
                    <option value="Clinical Bioequivalence">Clinical Bioequivalence</option>
                    <option value="Industrial Scale-Up">Industrial Scale-Up</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Batch Code</label>
                  <input 
                    type="text" 
                    value={newItem.batchCode} 
                    onChange={(e) => setNewItem({...newItem, batchCode: e.target.value})} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-cyan-300 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Project Name & Lead Scientist</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    value={newItem.projectName} 
                    onChange={(e) => setNewItem({...newItem, projectName: e.target.value})} 
                    placeholder="e.g., Nano-Particle Formulation X"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                    required
                  />
                  <input 
                    type="text" 
                    value={newItem.leadScientist} 
                    onChange={(e) => setNewItem({...newItem, leadScientist: e.target.value})} 
                    placeholder="e.g., Dr. Farhana Yasmin, PhD"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Target Indication & Development Phase</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    value={newItem.targetIndication} 
                    onChange={(e) => setNewItem({...newItem, targetIndication: e.target.value})} 
                    placeholder="Target clinical indication"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                  <input 
                    type="text" 
                    value={newItem.phase} 
                    onChange={(e) => setNewItem({...newItem, phase: e.target.value})} 
                    placeholder="Development phase"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Stability / Assay Metrics & AI Score</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    value={newItem.stabilityMetrics} 
                    onChange={(e) => setNewItem({...newItem, stabilityMetrics: e.target.value})} 
                    placeholder="Stability testing results"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                  <input 
                    type="text" 
                    value={newItem.aiOptimizationScore} 
                    onChange={(e) => setNewItem({...newItem, aiOptimizationScore: e.target.value})} 
                    placeholder="AI prediction match score"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-teal-300 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowNewModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-emerald-500/25 transition-all"
                >
                  Save to NestJS RMD Core
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Inspector Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-teal-400" /> R&D Project Audit: {selectedItem.id}
                </h3>
                <span className="text-xs text-emerald-300 font-medium">{selectedItem.projectName} ({selectedItem.batchCode})</span>
              </div>
              <button 
                onClick={() => setSelectedItem(null)} 
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-400 font-medium">Lead Scientist:</span>
                  <p className="text-teal-400 font-semibold text-xs mt-0.5">{selectedItem.leadScientist}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Target Indication:</span>
                  <p className="text-white font-semibold text-xs mt-0.5">{selectedItem.targetIndication}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Development Phase:</span>
                  <p className="text-slate-200 text-xs mt-0.5">{selectedItem.phase}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">AI Optimization Score:</span>
                  <p className="text-teal-300 font-mono text-xs mt-0.5">{selectedItem.aiOptimizationScore}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 font-medium">Stability / Assay Metrics:</span>
                  <p className="text-cyan-300 font-mono text-xs mt-0.5">{selectedItem.stabilityMetrics}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Project Status:</span>
                  <p className="text-emerald-400 font-semibold text-xs mt-0.5">{selectedItem.status}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Backend Sync Entity:</span>
                  <p className="text-indigo-300 font-mono text-xs mt-0.5">rmd.entity.ts</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-md"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}