// frontend/src/components/quality/QualityModule.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CATEGORY_STAGES } from '../../constants/qcWorkflows';

export default function QualityModule() {
  const [inspections, setInspections] = useState([]);
  const [category, setCategory] = useState('Tablets');
  const [stage, setStage] = useState('');
  const [formData, setFormData] = useState({
    batchId: '',
    productName: '',
    leadAnalyst: '',
    assayResult: '',
    testParameters: '',
    complianceStatus: 'Passed',
    qaReleaseStatus: 'Released'
  });
  
  // Date filtering state for reports
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchInspections();
  }, [startDate, endDate]);

  const fetchInspections = async () => {
    try {
      let url = 'http://localhost:3000/quality';
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await axios.get(url);
      setInspections(res.data);
    } catch (err) {
      console.error('Error fetching quality records:', err);
    }
  };

  const handleCategoryChange = (e) => {
    const selectedCat = e.target.value;
    setCategory(selectedCat);
    setStage(CATEGORY_STAGES[selectedCat][0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/quality', {
        ...formData,
        productCategory: category,
        productionStage: stage || CATEGORY_STAGES[category][0],
      });
      fetchInspections();
      alert('QC Gatekeeper Approved & Logged Successfully!');
    } catch (err) {
      console.error('Submission failed', err);
    }
  };

  const downloadReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Audit ID,Batch ID,Category,Stage,Analyst,Result,Status,Date"]
      .concat(inspections.map(i => `${i.auditId},${i.batchId},${i.productCategory},${i.productionStage},${i.leadAnalyst},${i.assayResult},${i.complianceStatus},${i.inspectionDate}`))
      .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `QC_Audit_Report_${startDate || 'all'}_to_${endDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen">
      <h2 className="text-2xl font-bold mb-4">🔬 Dynamic QA/QC Gatekeeper & Laboratory Module</h2>

      {/* Date Filter & Report Download Bar */}
      <div className="flex gap-4 mb-6 bg-slate-800 p-4 rounded-lg items-center">
        <div>
          <label className="block text-xs text-slate-400">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-700 p-2 rounded text-white" />
        </div>
        <div>
          <label className="block text-xs text-slate-400">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-700 p-2 rounded text-white" />
        </div>
        <button onClick={downloadReport} className="ml-auto bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded font-semibold">
          📥 Download Date-Filtered Report (CSV)
        </button>
      </div>

      {/* QC Testing Entry Form */}
      <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg mb-8 grid grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-slate-400">Product Category</label>
          <select value={category} onChange={handleCategoryChange} className="w-full bg-slate-700 p-2 rounded mt-1">
            {Object.keys(CATEGORY_STAGES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400">Production Stage Gate</label>
          <select value={stage} onChange={e => setStage(e.target.value)} className="w-full bg-slate-700 p-2 rounded mt-1">
            {CATEGORY_STAGES[category].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400">Target Batch ID</label>
          <input type="text" placeholder="e.g. TOLL-INC-2026-245" value={formData.batchId} onChange={e => setFormData({...formData, batchId: e.target.value})} className="w-full bg-slate-700 p-2 rounded mt-1" required />
        </div>
        <div>
          <label className="text-xs text-slate-400">Product Formulation Name</label>
          <input type="text" placeholder="e.g. Maxpro 40 Capsule" value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} className="w-full bg-slate-700 p-2 rounded mt-1" required />
        </div>
        <div>
          <label className="text-xs text-slate-400">Lead Analyst / Biochemist</label>
          <input type="text" placeholder="Dr. Nusrat Jahan" value={formData.leadAnalyst} onChange={e => setFormData({...formData, leadAnalyst: e.target.value})} className="w-full bg-slate-700 p-2 rounded mt-1" required />
        </div>
        <div>
          <label className="text-xs text-slate-400">Assay & Test Results</label>
          <input type="text" placeholder="Passed (99.4%)" value={formData.assayResult} onChange={e => setFormData({...formData, assayResult: e.target.value})} className="w-full bg-slate-700 p-2 rounded mt-1" required />
        </div>
        <div className="col-span-3">
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold">
            ⚡ Submit Stage QC Approval & Unlock Production Gate
          </button>
        </div>
      </form>

      {/* Database Audit Register Table */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-700 text-slate-300 text-sm">
              <th className="p-3">Audit ID</th>
              <th className="p-3">Batch ID</th>
              <th className="p-3">Category / Stage</th>
              <th className="p-3">Analyst</th>
              <th className="p-3">Assay Result</th>
              <th className="p-3">System Timestamp</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {inspections.map((item) => (
              <tr key={item.id} className="border-t border-slate-700 text-sm">
                <td className="p-3 font-mono text-cyan-400">{item.auditId}</td>
                <td className="p-3 font-mono">{item.batchId}</td>
                <td className="p-3">{item.productCategory} → <span className="text-amber-400">{item.productionStage}</span></td>
                <td className="p-3">{item.leadAnalyst}</td>
                <td className="p-3 text-emerald-400">{item.assayResult}</td>
                <td className="p-3 text-slate-400">{new Date(item.inspectionDate).toLocaleString()}</td>
                <td className="p-3">
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded text-xs">
                    {item.complianceStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}