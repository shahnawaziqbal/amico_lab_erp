import React, { useState } from 'react';
import { 
  Users, Bot, Sparkles, Building2, Globe, Shield, Activity, 
  Search, Filter, Plus, FileText, ArrowUpRight, CheckCircle2, RefreshCw, Layers, Database
} from 'lucide-react';

export default function CrmModule() {
  const [activeTab, setActiveTab] = useState('coordination'); // 'coordination' | 'ai-personalization' | 'agentic' | 'transition'
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // International Pharma CRM Database Records
  const [crmRecords, setCrmRecords] = useState([
    {
      id: 'CRM-INT-2026-101',
      type: 'Medical-Commercial',
      hcpName: 'Dr. Ariful Islam, MD (Cardiology)',
      institution: 'National Heart Foundation Hospital, Dhaka',
      brandPortfolio: 'Amico Cardio-Vascular Line (Cardipril 10mg)',
      medicalInsights: 'High interest in clinical trials regarding ACE-inhibitor safety profiles.',
      commercialEngagement: 'Preferred channel: Rep physical visits + Digital medical portals.',
      nextBestAction: 'Deploy AI-curated clinical summary on cardiac efficacy & schedule KOL advisory board invite.',
      agenticStatus: 'AI Agent Active (Autonomous Sync)',
      region: 'South Asia / Bangladesh Region',
      legacyVeevaSync: 'Migrated & Centralized (Veeva ID: VEEVA-HCP-88492)'
    },
    {
      id: 'CRM-INT-2026-102',
      type: 'Agentic Interoperability',
      hcpName: 'Dr. Jean-Luc Moreau (Head of Oncology)',
      institution: 'AP-HP Hôpital Européen Georges-Pompidou, Paris',
      brandPortfolio: 'OncoAmico Biotech Pipeline (Targeted Kinase Inhibitors)',
      medicalInsights: 'Requested real-world evidence (RWE) data on multi-drug resistance.',
      commercialEngagement: 'Preferred channel: Omnichannel automated webinar & medical science liaison (MSL) direct line.',
      nextBestAction: 'Trigger autonomous AI Agent to dispatch secure encrypted RWE dataset and setup MSL virtual sync.',
      agenticStatus: 'Agent Interop Connected',
      region: 'European Union / France Hub',
      legacyVeevaSync: 'Replaced Legacy Veeva CRM Vault Elements'
    },
    {
      id: 'CRM-INT-2026-103',
      type: 'AI Personalization',
      hcpName: 'Dr. Sarah Al-Harthi (Endocrinology Lead)',
      institution: 'King Faisal Specialist Hospital, Riyadh',
      brandPortfolio: 'DiabAmico Sustained Release (Metformin XR)',
      medicalInsights: 'Focusing on pediatric type-2 diabetes management guidelines.',
      commercialEngagement: 'Preferred channel: AI multi-channel personalized email digests & interactive dosing calculators.',
      nextBestAction: 'Automated dispatch of pediatric endocrinology dosing matrix via automated multi-channel campaign.',
      agenticStatus: 'Autonomous Campaign Live',
      region: 'Middle East / GCC Operations',
      legacyVeevaSync: 'Fully Migrated to Amico Centralized Core'
    },
    {
      id: 'CRM-INT-2026-104',
      type: 'Ecosystem Transition',
      hcpName: 'Dr. Marcus Vance (Chief Medical Officer)',
      institution: 'Mayo Clinic Health System, Minnesota',
      brandPortfolio: 'NeuroAmico Central Nervous System Portfolio',
      medicalInsights: 'Prioritizing neuro-degenerative biomarker clinical validation papers.',
      commercialEngagement: 'Preferred channel: Executive executive peer-to-peer symposia and AI briefing kits.',
      nextBestAction: 'Sync legacy Veeva CRM records with NestJS centralized relational core and schedule executive brief.',
      agenticStatus: 'Core Synchronized',
      region: 'North America Hub',
      legacyVeevaSync: 'Veeva Legacy Element Replaced with Intelligent Core'
    }
  ]);

  const [newItem, setNewItem] = useState({
    type: 'Medical-Commercial',
    hcpName: 'Dr. Tanvir Ahmed (Gastroenterology)',
    institution: 'Square Hospitals Ltd / Academic Wing',
    brandPortfolio: 'GastroAmico Proton Pump Inhibitors',
    medicalInsights: 'Interested in post-market safety surveillance metrics.',
    commercialEngagement: 'Omnichannel Digital & MSL Visit',
    nextBestAction: 'Schedule AI-driven Next-Best-Action medical briefing.',
    region: 'South Asia Regional Hub',
    legacyVeevaSync: 'Migrated to Centralized ERP Architecture'
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newItem.hcpName) return;

    const created = {
      id: `CRM-INT-2026-${Math.floor(200 + Math.random() * 300)}`,
      type: newItem.type,
      hcpName: newItem.hcpName,
      institution: newItem.institution,
      brandPortfolio: newItem.brandPortfolio,
      medicalInsights: newItem.medicalInsights,
      commercialEngagement: newItem.commercialEngagement,
      nextBestAction: newItem.nextBestAction,
      agenticStatus: 'AI Agent Active (Autonomous Sync)',
      region: newItem.region,
      legacyVeevaSync: newItem.legacyVeevaSync
    };

    setCrmRecords([created, ...crmRecords]);
    setShowNewModal(false);
  };

  const filteredRecords = crmRecords.filter(rec => {
    const matchesTab = 
      activeTab === 'coordination' ? rec.type.includes('Medical-Commercial') :
      activeTab === 'ai-personalization' ? rec.type.includes('Personalization') || rec.nextBestAction.includes('AI') :
      activeTab === 'agentic' ? rec.type.includes('Agentic') || rec.agenticStatus.includes('Active') :
      true; // 'transition' or overview

    const matchesSearch = rec.hcpName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          rec.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rec.brandPortfolio.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rec.region.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 text-slate-100 min-h-screen bg-slate-950 p-6 font-sans">
      
      {/* Top Banner & Module Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-start gap-4 relative z-10">
          <div className="p-3.5 bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 rounded-2xl text-cyan-400 shadow-inner">
            <Globe className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white tracking-wide">International Pharma CRM Platform (ERP Enterprise Edition)</h1>
              <span className="px-3 py-1 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 rounded-full text-[11px] font-semibold tracking-wider">
                VEEVA ECOSYSTEM TRANSITION ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Medical-commercial coordination, AI-powered next-best-action personalisation, agentic multi-region interoperability, and intelligent centralized architecture replacing legacy Veeva elements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add HCP / Institutional Profile
          </button>
        </div>
      </div>

      {/* CRM Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Medical-Commercial Sync</span>
              <div className="text-3xl font-extrabold text-white mt-1.5 font-mono">100% Aligned</div>
            </div>
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-emerald-400 font-medium">Integrated HCP insights & strategy</div>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">AI Next-Best-Action</span>
              <div className="text-3xl font-extrabold text-white mt-1.5 font-mono">Active</div>
            </div>
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-indigo-300 font-medium">Automated multi-channel campaigns</div>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Agentic Interoperability</span>
              <div className="text-3xl font-extrabold text-white mt-1.5 font-mono">Global</div>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Bot className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-emerald-400 font-medium">AI agents & human care teams</div>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Legacy Veeva Transition</span>
              <div className="text-3xl font-extrabold text-white mt-1.5 font-mono">Replaced</div>
            </div>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-amber-400 font-medium">Centralized NestJS ERP core</div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('coordination')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'coordination' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Medical-Commercial Coordination
          </button>
          <button
            onClick={() => setActiveTab('ai-personalization')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ai-personalization' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            AI Personalization & Campaigns
          </button>
          <button
            onClick={() => setActiveTab('agentic')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'agentic' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Agentic Interoperability
          </button>
          <button
            onClick={() => setActiveTab('transition')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'transition' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Legacy Ecosystem Transition
          </button>
        </div>

        <div className="relative flex-1 sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search HCP name, institution, region..." 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* CRM Records Table */}
      <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              International Healthcare Professional & Institutional Engagement Register
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Showing {filteredRecords.length} records</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase bg-slate-950/30 tracking-wider">
                <th className="p-4">HCP & Institution</th>
                <th className="p-4">Brand Portfolio</th>
                <th className="p-4">Medical Insights</th>
                <th className="p-4">Commercial Channel</th>
                <th className="p-4 text-center">AI Next-Best-Action</th>
                <th className="p-4 text-center">Agentic Status</th>
                <th className="p-4 text-center">Legacy Migration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredRecords.map((rec, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => setSelectedItem(rec)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <td className="p-4 font-bold text-cyan-400 group-hover:underline">
                    {rec.hcpName}
                    <span className="block font-normal text-[10px] text-slate-400 mt-0.5">{rec.institution} ({rec.region})</span>
                  </td>
                  <td className="p-4 font-semibold text-indigo-300">
                    {rec.brandPortfolio}
                  </td>
                  <td className="p-4 text-slate-300 text-[11px] max-w-xs">
                    {rec.medicalInsights}
                  </td>
                  <td className="p-4 text-slate-300 text-[11px]">
                    {rec.commercialEngagement}
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-lg text-[10px] font-mono">
                      {rec.nextBestAction.substring(0, 35)}...
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-semibold">
                      {rec.agenticStatus}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-mono">
                      {rec.legacyVeevaSync}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New HCP Profile Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-3xl w-full p-8 shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" /> 
                  Add International HCP / Institutional Profile
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Integrates with NestJS CRM controllers and AI personalization engines.</p>
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
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Module Integration Focus</label>
                  <select 
                    value={newItem.type}
                    onChange={(e) => setNewItem({...newItem, type: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
                  >
                    <option value="Medical-Commercial">Medical-Commercial Coordination</option>
                    <option value="AI Personalization">AI-Powered Personalization</option>
                    <option value="Agentic Interoperability">Agentic Interoperability</option>
                    <option value="Ecosystem Transition">Ecosystem Transition (Veeva Replacement)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Global Region</label>
                  <select 
                    value={newItem.region}
                    onChange={(e) => setNewItem({...newItem, region: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
                  >
                    <option value="South Asia Regional Hub">South Asia Regional Hub</option>
                    <option value="European Union / France Hub">European Union / France Hub</option>
                    <option value="Middle East / GCC Operations">Middle East / GCC Operations</option>
                    <option value="North America Hub">North America Hub</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">HCP Full Name & Institution</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    value={newItem.hcpName} 
                    onChange={(e) => setNewItem({...newItem, hcpName: e.target.value})} 
                    placeholder="e.g., Dr. Tanvir Ahmed (Gastroenterology)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <input 
                    type="text" 
                    value={newItem.institution} 
                    onChange={(e) => setNewItem({...newItem, institution: e.target.value})} 
                    placeholder="e.g., Square Hospitals Ltd"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Brand Portfolio & Medical Insights</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    value={newItem.brandPortfolio} 
                    onChange={(e) => setNewItem({...newItem, brandPortfolio: e.target.value})} 
                    placeholder="Brand Portfolio Assigned"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <input 
                    type="text" 
                    value={newItem.medicalInsights} 
                    onChange={(e) => setNewItem({...newItem, medicalInsights: e.target.value})} 
                    placeholder="Medical insights / trial interest"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">AI Next-Best-Action Recommendation</label>
                <input 
                  type="text" 
                  value={newItem.nextBestAction} 
                  onChange={(e) => setNewItem({...newItem, nextBestAction: e.target.value})} 
                  placeholder="e.g., Schedule AI-driven Next-Best-Action briefing."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-cyan-400 font-mono"
                />
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
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-indigo-500/25 transition-all"
                >
                  Save to NestJS CRM Core
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
                  <Globe className="w-5 h-5 text-cyan-400" /> HCP Profile Audit: {selectedItem.id}
                </h3>
                <span className="text-xs text-indigo-300 font-medium">{selectedItem.hcpName} ({selectedItem.institution})</span>
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
                  <span className="text-slate-400 font-medium">Brand Portfolio:</span>
                  <p className="text-cyan-400 font-semibold text-xs mt-0.5">{selectedItem.brandPortfolio}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Global Region:</span>
                  <p className="text-white font-semibold text-xs mt-0.5">{selectedItem.region}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 font-medium">Medical Insights:</span>
                  <p className="text-slate-200 text-xs mt-0.5">{selectedItem.medicalInsights}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 font-medium">AI Next-Best-Action:</span>
                  <p className="text-emerald-400 font-mono text-xs mt-0.5">{selectedItem.nextBestAction}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Agentic Status:</span>
                  <p className="text-cyan-300 font-semibold text-xs mt-0.5">{selectedItem.agenticStatus}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Legacy Veeva Sync:</span>
                  <p className="text-indigo-300 font-mono text-xs mt-0.5">{selectedItem.legacyVeevaSync}</p>
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