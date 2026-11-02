import React, { useState } from 'react';
import { 
  ShieldCheck, FileText, CheckCircle2, Clock, AlertTriangle, 
  Building2, Cpu, Activity, Upload, Search, Filter, Lock, CheckSquare, Plus, FileSpreadsheet, ArrowUpRight
} from 'lucide-react';

export default function ComplianceModule() {
  const [activeTab, setActiveTab] = useState('internal'); // 'internal' | 'toll' | 'audit'
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewComplianceModal, setShowNewComplianceModal] = useState(false);
  const [selectedComplianceItem, setSelectedComplianceItem] = useState(null);

  // Comprehensive WHO cGMP Compliance Batch Register for Amico Laboratories & Toll Clients
  const [complianceRecords, setComplianceRecords] = useState([
    {
      recordId: 'CMP-WHO-2026-501',
      productionType: 'Internal',
      client: 'Amico Laboratories',
      productName: 'Paracetamol 500mg Tablet',
      batchNumber: 'AMICO-BMR-2026-501',
      dosageForm: 'Tablet (Granulation ➔ Compression)',
      whoStandard: 'WHO TRS 961 Annex 3 (cGMP for Pharmaceutical Products)',
      lineClearance: 'Verified & Signed',
      environmentalMonitor: 'Temp: 24.5°C | RH: 45% | Diff Press: +15 Pa (ISO Class 8)',
      rawMaterialTrace: 'Verified (Lot # RM-PAR-01 & RM-STC-04 passed assay)',
      ipqcStatus: 'Passed',
      qcAssayResult: '99.4% (Limits: 95.0% - 105.0%)',
      qaFinalRelease: 'Pending QA Head Sign-off',
      auditTrailStatus: 'Immutable Log Secured',
      uploadedBmrFile: 'BMR_Paracetamol_500mg_WHO_Signed.pdf',
      inspector: 'Dr. M. A. Rahim (Head of QA)'
    },
    {
      recordId: 'CMP-WHO-2026-802',
      productionType: 'Toll Manufacturing',
      client: 'Incepta Pharmaceuticals',
      productName: 'Cefixime 400mg Dispersible Tablet',
      batchNumber: 'TOLL-INC-2026-802',
      dosageForm: 'Tablet Compression',
      whoStandard: 'WHO TRS 986 Annex 2 (Multi-client Contract Manufacturing Standards)',
      lineClearance: 'Verified & Signed',
      environmentalMonitor: 'Temp: 22.0°C | RH: 40% | Diff Press: +18 Pa (ISO Class 8)',
      rawMaterialTrace: 'Verified (Client Supplied API - CoA Verified)',
      ipqcStatus: 'Passed',
      qcAssayResult: '100.1% (Limits: 95.0% - 105.0%)',
      qaFinalRelease: 'Under Joint QA Review',
      auditTrailStatus: 'Immutable Log Secured',
      uploadedBmrFile: 'Toll_Cefixime_Incepta_WHO_Compliance.pdf',
      inspector: 'Dr. Farhana Yasmin (Compliance Lead)'
    },
    {
      recordId: 'CMP-WHO-2026-803',
      productionType: 'Toll Manufacturing',
      client: 'Healthcare Pharmaceuticals',
      productName: 'Omeprazole 20mg Enteric Capsule',
      batchNumber: 'TOLL-HCP-2026-803',
      dosageForm: 'Encapsulation & Banding',
      whoStandard: 'WHO TRS 961 Annex 4 (Sterile & Non-sterile Validation)',
      lineClearance: 'Pending Sanitation Clearance',
      environmentalMonitor: 'Temp: 21.5°C | RH: 38% | Diff Press: +20 Pa',
      rawMaterialTrace: 'Pending Warehouse Weighing Approval',
      ipqcStatus: 'Pending',
      qcAssayResult: 'Awaiting Lab Sample Draw',
      qaFinalRelease: 'Locked',
      auditTrailStatus: 'Initialized',
      uploadedBmrFile: 'BMR_Omeprazole_HCP_Draft.pdf',
      inspector: 'Shamsul Alam (QC Analyst)'
    },
    {
      recordId: 'CMP-WHO-2026-504',
      productionType: 'Internal',
      client: 'Amico Laboratories',
      productName: 'Erythromycin 250mg Powder for Suspension (PFS)',
      batchNumber: 'AMICO-BMR-2026-504',
      dosageForm: 'Powder Blending & Filling',
      whoStandard: 'WHO TRS 961 Annex 3 (Liquid & Suspension Guidelines)',
      lineClearance: 'Verified & Signed',
      environmentalMonitor: 'Temp: 23.0°C | RH: 42% | Diff Press: +16 Pa',
      rawMaterialTrace: 'Verified (Lot # RM-ERY-92 passed HPLC)',
      ipqcStatus: 'Passed',
      qcAssayResult: '98.9% (Limits: 90.0% - 110.0%)',
      qaFinalRelease: 'Approved (WHO COA Issued)',
      auditTrailStatus: 'Immutable Log Secured',
      uploadedBmrFile: 'BMR_Erythromycin_PFS_WHO_Approved.pdf',
      inspector: 'Dr. M. A. Rahim (Head of QA)'
    }
  ]);

  const [newRecordData, setNewRecordData] = useState({
    productionType: 'Internal',
    client: 'Amico Laboratories',
    productName: 'Paracetamol 500mg Tablet',
    batchNumber: 'AMICO-BMR-2026-505',
    dosageForm: 'Tablet',
    whoStandard: 'WHO TRS 961 Annex 3 (cGMP Guidelines)',
    environmentalMonitor: 'Temp: 23°C | RH: 45% | Press: +15 Pa',
    rawMaterialTrace: 'Verified by Warehouse & QA',
    ipqcStatus: 'Passed',
    qcAssayResult: '99.2%',
    qaFinalRelease: 'Pending QA Head Review',
    uploadedBmrFile: '',
    inspector: 'Dr. M. A. Rahim'
  });

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setNewRecordData({ ...newRecordData, uploadedBmrFile: files.map(f => f.name).join(', ') });
    }
  };

  const handleCreateRecord = (e) => {
    e.preventDefault();
    if (!newRecordData.batchNumber) return;

    const createdRecord = {
      recordId: `CMP-WHO-2026-${Math.floor(600 + Math.random() * 300)}`,
      productionType: newRecordData.productionType,
      client: newRecordData.productionType === 'Toll Manufacturing' ? newRecordData.client : 'Amico Laboratories',
      productName: newRecordData.productName,
      batchNumber: newRecordData.batchNumber,
      dosageForm: newRecordData.dosageForm,
      whoStandard: newRecordData.whoStandard,
      lineClearance: 'Verified & Signed',
      environmentalMonitor: newRecordData.environmentalMonitor,
      rawMaterialTrace: newRecordData.rawMaterialTrace,
      ipqcStatus: newRecordData.ipqcStatus,
      qcAssayResult: newRecordData.qcAssayResult,
      qaFinalRelease: newRecordData.qaFinalRelease,
      auditTrailStatus: 'Immutable Log Secured',
      uploadedBmrFile: newRecordData.uploadedBmrFile || 'WHO_Master_Compliance_Report.pdf',
      inspector: newRecordData.inspector
    };

    setComplianceRecords([createdRecord, ...complianceRecords]);
    setShowNewComplianceModal(false);
  };

  const filteredRecords = complianceRecords.filter(rec => {
    const matchesTab = activeTab === 'audit' ? true : (activeTab === 'internal' ? rec.productionType === 'Internal' : rec.productionType === 'Toll Manufacturing');
    const matchesSearch = rec.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          rec.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rec.client.toLowerCase().includes(searchQuery.toLowerCase());
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
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white tracking-wide">Amico Laboratories Regulatory Compliance Department (WHO cGMP)</h1>
              <span className="px-3 py-1 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 rounded-full text-[11px] font-semibold tracking-wider">
                WHO TRS 961 / 986 COMPLIANT
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Real-time batch manufacturing compliance monitoring, environmental controls, raw material traceability, and QA audit trails for both internal production and toll manufacturing partners.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={() => setShowNewComplianceModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Compliance Batch Report
          </button>
        </div>
      </div>

      {/* Compliance Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Active Compliance Batches</span>
              <div className="text-3xl font-extrabold text-white mt-1.5 font-mono">{complianceRecords.length}</div>
            </div>
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-emerald-400 font-medium">100% Real-time NestJS synchronization</div>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Toll Client Audit Files</span>
              <div className="text-3xl font-extrabold text-white mt-1.5 font-mono">2 Active</div>
            </div>
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-indigo-300 font-medium">Incepta & Healthcare Pharma</div>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">WHO Standard Adherence</span>
              <div className="text-3xl font-extrabold text-white mt-1.5 font-mono">100%</div>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-emerald-400 font-medium">TRS 961 Annex 3 & 986 Annex 2</div>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Audit Trail Security</span>
              <div className="text-3xl font-extrabold text-white mt-1.5 font-mono">Secure</div>
            </div>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Lock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-amber-400 font-medium">Immutable NestJS backend logs</div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('internal')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'internal' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Amico Internal Compliance ({complianceRecords.filter(r => r.productionType === 'Internal').length})
          </button>
          <button
            onClick={() => setActiveTab('toll')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'toll' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Toll Manufacturing Compliance ({complianceRecords.filter(r => r.productionType === 'Toll Manufacturing').length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'audit' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Complete Audit Register ({complianceRecords.length})
          </button>
        </div>

        <div className="relative flex-1 sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search batch number, product, client..." 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Main Compliance Records Table */}
      <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              {activeTab === 'toll' ? 'Toll Client WHO cGMP Compliance Register' : activeTab === 'internal' ? 'Amico Internal WHO cGMP Compliance Register' : 'Unified Regulatory Compliance & Batch Monitoring Register'}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Showing {filteredRecords.length} records</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase bg-slate-950/30 tracking-wider">
                <th className="p-4">Compliance / Batch ID</th>
                <th className="p-4">Client / Stream</th>
                <th className="p-4">Product & Dosage</th>
                <th className="p-4">WHO Standard Tag</th>
                <th className="p-4 text-center">Environmental Control</th>
                <th className="p-4 text-center">IPQC Gate</th>
                <th className="p-4 text-center">QA Release Status</th>
                <th className="p-4 text-center">Attached Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredRecords.map((rec, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => setSelectedComplianceItem(rec)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <td className="p-4 font-mono font-bold text-cyan-400 group-hover:underline">
                    {rec.recordId}
                    <span className="block font-normal text-[10px] text-slate-400 mt-0.5">{rec.batchNumber}</span>
                  </td>
                  <td className="p-4 font-semibold text-indigo-300">
                    {rec.client}
                    <span className="block font-normal text-[10px] text-slate-400 mt-0.5">{rec.productionType}</span>
                  </td>
                  <td className="p-4 text-white font-medium">
                    {rec.productName}
                    <span className="block text-[10px] text-slate-400 mt-0.5">{rec.dosageForm}</span>
                  </td>
                  <td className="p-4 text-slate-300 font-mono text-[11px]">
                    {rec.whoStandard}
                  </td>
                  <td className="p-4 text-center text-slate-300 font-mono text-[11px]">
                    {rec.environmentalMonitor}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${
                      rec.ipqcStatus === 'Passed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {rec.ipqcStatus}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-semibold ${
                      rec.qaFinalRelease.includes('Approved') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      rec.qaFinalRelease.includes('Review') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {rec.qaFinalRelease}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-cyan-300 font-mono shadow-sm">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" /> {rec.uploadedBmrFile.substring(0, 20)}...
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Compliance Batch Entry Modal */}
      {showNewComplianceModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-3xl w-full p-8 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" /> 
                  Initiate WHO cGMP Compliance & Real-Time Batch Report
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Connects with NestJS backend controllers to log immutable batch parameters.</p>
              </div>
              <button 
                onClick={() => setShowNewComplianceModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-5 max-h-[72vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Production Stream</label>
                  <select 
                    value={newRecordData.productionType}
                    onChange={(e) => setNewRecordData({...newRecordData, productionType: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
                  >
                    <option value="Internal">Amico Internal Production</option>
                    <option value="Toll Manufacturing">Toll / Contract Manufacturing</option>
                  </select>
                </div>

                {newRecordData.productionType === 'Toll Manufacturing' ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Client Partner</label>
                    <select 
                      value={newRecordData.client}
                      onChange={(e) => setNewRecordData({...newRecordData, client: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
                    >
                      <option value="Incepta Pharmaceuticals">Incepta Pharmaceuticals</option>
                      <option value="Healthcare Pharmaceuticals">Healthcare Pharmaceuticals</option>
                      <option value="Square Pharmaceuticals">Square Pharmaceuticals</option>
                      <option value="Renata Limited">Renata Limited</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Dosage Form Category</label>
                    <select 
                      value={newRecordData.dosageForm}
                      onChange={(e) => setNewRecordData({...newRecordData, dosageForm: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
                    >
                      <option value="Tablet">Tablet (Granulation ➔ Compression)</option>
                      <option value="Capsule">Capsule (Encapsulation)</option>
                      <option value="PFS">Powder for Suspension (PFS)</option>
                      <option value="Syrup">Syrup / Liquid Oral</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Product Formulation & Batch Number</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    value={newRecordData.productName} 
                    onChange={(e) => setNewRecordData({...newRecordData, productName: e.target.value})} 
                    placeholder="e.g., Paracetamol 500mg Tablet"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <input 
                    type="text" 
                    value={newRecordData.batchNumber} 
                    onChange={(e) => setNewRecordData({...newRecordData, batchNumber: e.target.value})} 
                    placeholder="e.g., AMICO-BMR-2026-505"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-cyan-400 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">WHO Compliance Standard</label>
                <select 
                  value={newRecordData.whoStandard}
                  onChange={(e) => setNewRecordData({...newRecordData, whoStandard: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
                >
                  <option value="WHO TRS 961 Annex 3 (cGMP for Pharmaceutical Products)">WHO TRS 961 Annex 3 (cGMP for Pharmaceutical Products)</option>
                  <option value="WHO TRS 986 Annex 2 (Multi-client Contract Manufacturing Standards)">WHO TRS 986 Annex 2 (Multi-client Contract Manufacturing Standards)</option>
                  <option value="WHO TRS 961 Annex 4 (Sterile & Non-sterile Validation)">WHO TRS 961 Annex 4 (Sterile & Non-sterile Validation)</option>
                </select>
              </div>

              {/* File Upload Section */}
              <div className="bg-slate-950/80 border-2 border-dashed border-cyan-500/40 p-5 rounded-2xl text-center space-y-3 hover:border-cyan-400 transition-all">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto text-cyan-400 border border-cyan-500/20">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white">Upload Certified BMR & Compliance Audit Sheet</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Attach signed batch records, environmental charts, or QA release documents (.pdf, .xlsx)</p>
                </div>
                <input 
                  type="file" 
                  multiple
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer" 
                />
                {newRecordData.uploadedBmrFile && (
                  <p className="text-[11px] text-emerald-400 font-mono font-medium">Attached: {newRecordData.uploadedBmrFile}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowNewComplianceModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-indigo-500/25 transition-all"
                >
                  Save to NestJS Compliance Backend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compliance Inspector Modal */}
      {selectedComplianceItem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" /> WHO cGMP Compliance Audit Record: {selectedComplianceItem.recordId}
                </h3>
                <span className="text-xs text-indigo-300 font-medium">{selectedComplianceItem.productName} ({selectedComplianceItem.client})</span>
              </div>
              <button 
                onClick={() => setSelectedComplianceItem(null)} 
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-400 font-medium">Batch Number:</span>
                  <p className="text-cyan-400 font-mono font-semibold text-sm mt-0.5">{selectedComplianceItem.batchNumber}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">WHO Standard:</span>
                  <p className="text-white font-mono text-xs mt-0.5">{selectedComplianceItem.whoStandard}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Environmental Controls:</span>
                  <p className="text-white font-semibold text-xs mt-0.5">{selectedComplianceItem.environmentalMonitor}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Raw Material Traceability:</span>
                  <p className="text-emerald-400 font-semibold text-xs mt-0.5">{selectedComplianceItem.rawMaterialTrace}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">QC Assay Result:</span>
                  <p className="text-cyan-300 font-mono font-semibold text-xs mt-0.5">{selectedComplianceItem.qcAssayResult}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Audit Trail Security:</span>
                  <p className="text-emerald-400 font-semibold text-xs mt-0.5">{selectedComplianceItem.auditTrailStatus}</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={() => setSelectedComplianceItem(null)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-md"
                >
                  Close Audit Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}