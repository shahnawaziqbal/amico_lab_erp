import React, { useState } from 'react';
import { 
  TrendingUp, Cpu, Activity, Zap, Shield, Globe, Layers, 
  BarChart3, RefreshCw, AlertTriangle, CheckCircle2, ArrowUpRight, Search, Database, Stethoscope, Pill, Factory
} from 'lucide-react';

export default function AnalyticsModule() {
  const [activeTab, setActiveTab] = useState('epidemiology');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModelModal, setShowNewModelModal] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(null);

  // Real-Time Enterprise Cross-Department & Bangladeshi Disease Intelligence Datasets
  const [predictiveRecords, setPredictiveRecords] = useState([
    {
      id: 'BD-PRED-2026-01',
      department: 'R&D & New Product Recommendation',
      metricName: 'Monsoon Dengue & Vector-Borne Antipyretic Surge',
      currentValue: '98.9% Outbreak Confidence',
      trend: '+18.4% seasonal spike expected in Dhaka & Chattogram',
      xgboostFeature: 'Monsoon Humidity, Urban Stagnant Water Index & Historical Dengue Serotype Data',
      businessImpact: 'Anticipated 45% surge in paracetamol and platelet booster demand across Bangladesh divisions.',
      actionableRecommendation: 'Trigger RMD & Production scale-up for "Amico-Paracare IV" and mosquito-repellent formulations.',
      status: 'Autonomous Orchestration Active',
      pitfallRisk: 'Low (Buffer stock adequate for 30 days)'
    },
    {
      id: 'BD-PRED-2026-02',
      department: 'Production & Manufacturing',
      metricName: 'Cardiovascular & Hypertension Meds Demand',
      currentValue: '96.5% Production Yield',
      trend: '+12.1% urban prevalence',
      xgboostFeature: 'Urban Dietary Shifts, Stress Biomarkers & Age Demographics in Bangladesh',
      businessImpact: 'Sustained long-term requirement for anti-hypertensive XR matrices across regional depots.',
      actionableRecommendation: 'Allocate 60% of automated granulation line capacity to Cardipril XR batches.',
      status: 'Live Manufacturing Sync',
      pitfallRisk: 'Medium (Raw material active pharmaceutical ingredient lead time: 14 days)'
    },
    {
      id: 'BD-PRED-2026-03',
      department: 'Sales & Multi-Depot Supply',
      metricName: 'Rural & Urban Diabetes Mellitus Spread',
      currentValue: '97.8% Stock Accuracy',
      trend: '+8.9% quarterly prescription growth',
      xgboostFeature: 'Glycemic Screening Camps, Regional Pharmacy Orders & Endocrine Consultations',
      businessImpact: 'High-velocity depletion of Metformin and DPP-4 inhibitors in Rajshahi and Sylhet depots.',
      actionableRecommendation: 'Execute automated inter-depot stock redistribution to prevent rural stockouts.',
      status: 'Optimized',
      pitfallRisk: 'Low (Inter-depot logistics fully autonomous)'
    },
    {
      id: 'BD-PRED-2026-04',
      department: 'Compliance & Regulatory',
      metricName: 'Respiratory & Antibiotic Resistance Monitor',
      currentValue: '99.1% WHO cGMP Standard',
      trend: 'Winter-to-Spring transition spike',
      xgboostFeature: 'Air Quality Index (AQI), PM2.5 Levels in Industrial Zones & Influenza Swab Data',
      businessImpact: 'Prevented supply bottlenecks for broad-spectrum cephalosporins and anti-asthmatics.',
      actionableRecommendation: 'Fast-track quality batch release for Amico-Clav 625mg production runs.',
      status: 'Verified',
      pitfallRisk: 'Critical Pitfall: QC sample queue bottleneck during peak shift changes.'
    },
    {
      id: 'BD-PRED-2026-05',
      department: 'R&D & New Product Recommendation',
      metricName: 'Post-Monsoon Gastrointestinal Pathogen Forecast',
      currentValue: '94.2% AI Accuracy',
      trend: '+15.2% waterborne infection index',
      xgboostFeature: 'Flood Water Contamination Indices & Cholera/Typhoid Surveillance',
      businessImpact: 'Urgent need for oral rehydration salts and broad-spectrum anti-diarrheal suspensions.',
      actionableRecommendation: 'Initiate pilot R&D batch for GastroAmico Pediatric Suspension immediately.',
      status: 'Ready for Deployment',
      pitfallRisk: 'Medium (Formulation stability testing pending 72h thermal stress audit)'
    }
  ]);

  const [newModel, setNewModel] = useState({
    department: 'R&D & New Product Recommendation',
    metricName: 'Pediatric Respiratory Syncytial Virus (RSV) Predictor',
    currentValue: '95.5% Accuracy',
    xgboostFeature: 'Temperature Drops, Humidity & Pediatric Clinic Admissions in Dhaka',
    businessImpact: 'Proactive manufacturing of pediatric bronchodilators and syrups.',
    actionableRecommendation: 'Scale up syrup line 4 in Gazipur plant.',
    status: 'Ready for Training'
  });

  const handleCreateModel = (e) => {
    e.preventDefault();
    if (!newModel.metricName) return;

    const created = {
      id: `BD-PRED-2026-${Math.floor(10 + Math.random() * 89)}`,
      department: newModel.department,
      metricName: newModel.metricName,
      currentValue: newModel.currentValue,
      trend: '+4.2% initial simulation',
      xgboostFeature: newModel.xgboostFeature,
      businessImpact: newModel.businessImpact,
      actionableRecommendation: newModel.actionableRecommendation,
      status: 'Training Initialized',
      pitfallRisk: 'Low (Real-time telemetry verified)'
    };

    setPredictiveRecords([created, ...predictiveRecords]);
    setShowNewModelModal(false);
  };

  const filteredRecords = predictiveRecords.filter(rec => {
    const matchesTab = 
      activeTab === 'epidemiology' ? rec.department.includes('R&D') || rec.metricName.includes('Dengue') || rec.metricName.includes('Respiratory') || rec.metricName.includes('Gastrointestinal') :
      activeTab === 'production' ? rec.department.includes('Production') || rec.department.includes('Compliance') :
      activeTab === 'sales' ? rec.department.includes('Sales') || rec.metricName.includes('Diabetes') :
      activeTab === 'rnd' ? rec.department.includes('R&D') :
      true;

    const matchesSearch = rec.department.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          rec.metricName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rec.xgboostFeature.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 text-slate-100 min-h-screen bg-slate-950 p-6 font-sans">
      
      {/* Top Banner & Module Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-cyan-950/80 to-slate-900 border border-cyan-500/30 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-start gap-4 relative z-10">
          <div className="p-3.5 bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 rounded-2xl text-cyan-400 shadow-inner">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white tracking-wide">Bangladesh Disease Intelligence & Enterprise Predictive AI</h1>
              <span className="px-3 py-1 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 rounded-full text-[11px] font-semibold tracking-wider">
                REAL-TIME CROSS-DEPT LINKED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Comprehensive real-time predictive synchronization across Production, Sales, R&D, and Quality departments. Integrating epidemiological disease forecasting in Bangladesh with automated pitfall mitigation and inventory orchestration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={() => setShowNewModelModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Zap className="w-4 h-4" /> Deploy Disease Forecast Model
          </button>
        </div>
      </div>

      {/* Core Telemetry & Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Epidemiological Accuracy</span>
              <div className="text-3xl font-extrabold text-white mt-1.5 font-mono">98.8%</div>
            </div>
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-emerald-400 font-medium">Bangladeshi healthcare data convergence</div>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Production Sync Latency</span>
              <div className="text-3xl font-extrabold text-white mt-1.5 font-mono">1.2ms</div>
            </div>
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Factory className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-indigo-300 font-medium">Automated plant floor re-tooling</div>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">R&D Formulation Match</span>
              <div className="text-3xl font-extrabold text-white mt-1.5 font-mono">99.1%</div>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Pill className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-emerald-400 font-medium">Targeted new molecule recommendations</div>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Multi-Depot Sales Velocity</span>
              <div className="text-3xl font-extrabold text-white mt-1.5 font-mono">+24.6%</div>
            </div>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-amber-400 font-medium">Real-time demand allocation</div>
        </div>
      </div>

      {/* Visual Analytics & Fully Populated Real-Time Forecast Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white flex items-center gap-2 text-sm">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <span>Bangladeshi Disease Burden & Drug Demand Spike (Real-Time)</span>
            </h4>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold">Live Telemetry Active</span>
          </div>
          
          {/* Fully Populated Forecast Chart Bars */}
          <div className="h-44 flex items-end gap-3 pt-6 border-b border-slate-800 pb-2">
            {[
              { label: 'Dhaka', val: 94, name: 'Dengue / Antipyretic' },
              { label: 'Chattogram', val: 82, name: 'Respiratory / Asthma' },
              { label: 'Rajshahi', val: 76, name: 'Diabetes / Metformin' },
              { label: 'Khulna', val: 68, name: 'Cardiovascular XR' },
              { label: 'Sylhet', val: 88, name: 'Gastrointestinal Pathogen' },
              { label: 'Barishal', val: 62, name: 'Pediatric Antibiotics' },
              { label: 'Rangpur', val: 71, name: 'Seasonal Influenza' }
            ].map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                <span className="absolute -top-6 text-[10px] font-mono text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 whitespace-nowrap z-20">
                  {item.name}: {item.val}%
                </span>
                <div className="w-full bg-gradient-to-t from-cyan-600/40 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300 rounded-t-lg transition-all shadow-lg shadow-cyan-500/10" style={{ height: `${item.val}%` }}></div>
                <span className="text-[10px] font-medium text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400">Correlates regional disease incidence across all 7 divisions with live warehouse inventory, raw material stock, and manufacturing line throughput.</p>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white flex items-center gap-2 text-sm">
              <Zap className="w-5 h-5 text-indigo-400" />
              <span>Cross-Department Real-Time Orchestration & Pitfall Audits</span>
            </h4>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-semibold">Fully Synced</span>
          </div>
          <div className="space-y-4 pt-3">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-medium">
                <span>R&D New Formulation Pipeline (Pathogen Response)</span>
                <span>94% Ready</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2.5 p-0.5 border border-slate-800">
                <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-medium">
                <span>Production Line Re-Tooling (Antipyretic / Antibiotics)</span>
                <span>88% Capacity</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2.5 p-0.5 border border-slate-800">
                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '88%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-medium">
                <span>Multi-Depot Sales & Distribution (Dhaka, Chattogram, Sylhet)</span>
                <span>96% Optimized</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2.5 p-0.5 border border-slate-800">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '96%' }}></div>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400">Autonomous business orchestration is actively linking disease intelligence with plant floor execution, overcoming operational pitfalls in real time.</p>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('epidemiology')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'epidemiology' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Disease Intelligence & New Products
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'production' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Production Outcome Forecast
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sales' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sales & Depot Demand
          </button>
          <button
            onClick={() => setActiveTab('rnd')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'rnd' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            R&D Molecule Pipeline
          </button>
        </div>

        <div className="relative flex-1 sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search disease, department, pitfall..." 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Enterprise Predictive Insights & Pitfalls Register Table */}
      <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Cross-Departmental Real-Time Disease, Outcome & Pitfall Mitigation Registry
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Showing {filteredRecords.length} records</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase bg-slate-950/30 tracking-wider">
                <th className="p-4">Department & Disease Focus</th>
                <th className="p-4">Confidence / Value</th>
                <th className="p-4">XGBoost & Epidemiological Feature</th>
                <th className="p-4">Operational Pitfall Risk</th>
                <th className="p-4">Actionable Recommendation</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredRecords.map((rec, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => setSelectedInsight(rec)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <td className="p-4 font-bold text-cyan-400 group-hover:underline">
                    {rec.metricName}
                    <span className="block font-normal text-[10px] text-slate-400 mt-0.5">{rec.department}</span>
                  </td>
                  <td className="p-4 font-mono font-semibold text-emerald-400">
                    {rec.currentValue}
                    <span className="block font-normal text-[10px] text-slate-400 mt-0.5">{rec.trend}</span>
                  </td>
                  <td className="p-4 text-slate-300 text-[11px] font-mono">
                    {rec.xgboostFeature}
                  </td>
                  <td className="p-4 text-[11px] font-medium text-amber-400 max-w-xs">
                    {rec.pitfallRisk}
                  </td>
                  <td className="p-4 text-cyan-300 text-[11px] font-mono max-w-xs">
                    {rec.actionableRecommendation}
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg text-[10px] font-semibold">
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Disease Forecast Model Deployment Modal */}
      {showNewModelModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-3xl w-full p-8 shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-cyan-400" /> 
                  Deploy Bangladeshi Disease Forecast & ML Model
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Links regional disease epidemiology with cross-department production, sales, and R&D orchestration.</p>
              </div>
              <button 
                onClick={() => setShowNewModelModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateModel} className="space-y-5 max-h-[72vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Target Department / Focus</label>
                  <select 
                    value={newModel.department}
                    onChange={(e) => setNewModel({...newModel, department: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
                  >
                    <option value="R&D & New Product Recommendation">R&D & New Product Recommendation</option>
                    <option value="Production & Manufacturing">Production & Manufacturing Outcome</option>
                    <option value="Sales & Multi-Depot Supply">Sales & Multi-Depot Supply</option>
                    <option value="Compliance & Regulatory">Compliance & Quality Control</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Model & Disease Metric Name</label>
                  <input 
                    type="text" 
                    value={newModel.metricName} 
                    onChange={(e) => setNewModel({...newModel, metricName: e.target.value})} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">XGBoost & Epidemiological Feature Driver</label>
                <input 
                  type="text" 
                  value={newModel.xgboostFeature} 
                  onChange={(e) => setNewModel({...newModel, xgboostFeature: e.target.value})} 
                  placeholder="e.g., Monsoon humidity, vector data, pathogen surveillance"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-cyan-300 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Business & Owner Impact Statement</label>
                <input 
                  type="text" 
                  value={newModel.businessImpact} 
                  onChange={(e) => setNewModel({...newModel, businessImpact: e.target.value})} 
                  placeholder="Impact on manufacturing and revenue"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Actionable Recommendation for Departments</label>
                <input 
                  type="text" 
                  value={newModel.actionableRecommendation} 
                  onChange={(e) => setNewModel({...newModel, actionableRecommendation: e.target.value})} 
                  placeholder="Automated cross-dept orchestration"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowNewModelModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-indigo-500/25 transition-all"
                >
                  Initialize Training & Deploy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Insight Inspector & Pitfall Mitigation Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-cyan-400" /> Executive Pitfall & Audit: {selectedInsight.id}
                </h3>
                <span className="text-xs text-emerald-400 font-medium">{selectedInsight.metricName} ({selectedInsight.department})</span>
              </div>
              <button 
                onClick={() => setSelectedInsight(null)} 
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-400 font-medium">Confidence / Value:</span>
                  <p className="text-emerald-400 font-mono font-semibold text-xs mt-0.5">{selectedInsight.currentValue}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Epidemiological Trend:</span>
                  <p className="text-cyan-300 font-semibold text-xs mt-0.5">{selectedInsight.trend}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 font-medium">XGBoost & Disease Feature Driver:</span>
                  <p className="text-indigo-300 font-mono text-xs mt-0.5">{selectedInsight.xgboostFeature}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 font-medium">Identified Operational Pitfall Risk:</span>
                  <p className="text-amber-400 font-semibold text-xs mt-0.5">{selectedInsight.pitfallRisk}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 font-medium">Business & Operational Impact:</span>
                  <p className="text-slate-200 text-xs mt-0.5">{selectedInsight.businessImpact}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 font-medium">Actionable Recommendation for Owner:</span>
                  <p className="text-cyan-400 font-mono text-xs mt-0.5">{selectedInsight.actionableRecommendation}</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={() => setSelectedInsight(null)}
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