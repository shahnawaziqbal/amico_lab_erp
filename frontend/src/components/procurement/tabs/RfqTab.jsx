import React, { useState, useEffect } from 'react';
import { 
  FileQuestion, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Download,
  Printer
} from 'lucide-react';

const API_BASE_URL = '';

export default function RfqTab() {
  const [rfqs, setRfqs] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    rfqNumber: `RFQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    requisitionId: '',
    targetVendors: '', 
    issuanceDate: new Date().toISOString().split('T')[0],
    closingDate: '',
    status: 'OPEN'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rfqRes, reqRes] = await Promise.all([
        fetch(`${API_BASE_URL}/procurement/rfq`),
        fetch(`${API_BASE_URL}/procurement/requisitions`)
      ]);

      if (!rfqRes.ok || !reqRes.ok) {
        throw new Error('Failed to fetch RFQs or Requisitions from server.');
      }

      const rfqData = await rfqRes.json();
      const reqData = await reqRes.json();

      setRfqs(rfqData);
      setRequisitions(reqData);
    } catch (err) {
      console.error(err);
      setErrorMessage('Could not load RFQ records. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRfq = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/procurement/rfq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to issue RFQ.');
      }

      setSuccessMessage('Request for Quotation (RFQ) successfully issued to target vendors!');
      setIsModalOpen(false);
      fetchData();

      setFormData({
        rfqNumber: `RFQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        requisitionId: '',
        targetVendors: '',
        issuanceDate: new Date().toISOString().split('T')[0],
        closingDate: '',
        status: 'OPEN'
      });
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const exportExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["RFQ Number,Requisition ID,Target Vendors,Issuance Date,Closing Date,Status"].join(",") + "\n"
      + filteredRfqs.map(r => `"${r.rfqNumber}","${r.requisitionId}","${r.targetVendors}","${r.issuanceDate}","${r.closingDate}","${r.status}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `amico_rfq_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRfqs = rfqs.filter(rfq => {
    const matchesSearch = rfq.rfqNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (rfq.targetVendors && rfq.targetVendors.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || rfq.status === statusFilter;
    const matchesDate = (!startDate || rfq.issuanceDate >= startDate) && (!endDate || rfq.issuanceDate <= endDate);
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 rounded-2xl shadow-xl text-white">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600/30 rounded-xl border border-purple-500/30">
              <FileQuestion className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Request for Quotation (RFQ) Hub</h1>
              <p className="text-slate-400 text-sm">Broadcast material specifications to approved vendor networks and collect competitive proposals.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl font-medium text-sm shadow-lg transition">
            <Download className="w-4 h-4" /> Export Excel / CSV
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-3 rounded-xl font-medium text-sm transition">
            <Printer className="w-4 h-4" /> Print / PDF
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg transition-all">
            <Plus className="w-5 h-5" /> Issue New RFQ
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 flex items-center justify-between">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {successMessage}</span>
          <button onClick={() => setSuccessMessage('')}><X className="w-4 h-4" /></button>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 flex items-center justify-between">
          <span className="flex items-center gap-2"><AlertCircle className="w-5 h-5" /> {errorMessage}</span>
          <button onClick={() => setErrorMessage('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Controls & Filters Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by RFQ Number or Target Vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700" title="Start Issuance Date" />
          <span className="text-slate-400 text-xs">to</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700" title="End Issuance Date" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-sm">
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open for Bidding</option>
            <option value="CLOSED">Closed</option>
            <option value="AWARDED">Awarded</option>
          </select>
        </div>
      </div>

      {/* RFQ Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs tracking-wider font-semibold">
                <th className="p-4">RFQ Number</th>
                <th className="p-4">Requisition ID</th>
                <th className="p-4">Target Vendors</th>
                <th className="p-4">Issuance Date</th>
                <th className="p-4">Closing Date</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading RFQs from database...</td></tr>
              ) : filteredRfqs.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-400">No RFQs found. Issue your first RFQ above.</td></tr>
              ) : (
                filteredRfqs.map((rfq) => (
                  <tr key={rfq.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-semibold text-purple-600 font-mono">{rfq.rfqNumber}</td>
                    <td className="p-4 font-mono text-xs text-indigo-600 font-medium">{rfq.requisitionId || 'N/A'}</td>
                    <td className="p-4 text-slate-800 font-medium">{rfq.targetVendors}</td>
                    <td className="p-4 text-slate-600">{rfq.issuanceDate}</td>
                    <td className="p-4 text-slate-600">{rfq.closingDate || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        rfq.status === 'OPEN' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        rfq.status === 'AWARDED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {rfq.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create RFQ Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-purple-600" /> Issue Request for Quotation (RFQ)
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateRfq} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">RFQ Number</label>
                <input type="text" required value={formData.rfqNumber} onChange={(e) => setFormData({ ...formData, rfqNumber: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Linked Internal Requisition</label>
                <select required value={formData.requisitionId} onChange={(e) => setFormData({ ...formData, requisitionId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono">
                  <option value="">Select requisition...</option>
                  {requisitions.map(req => (
                    <option key={req.id} value={req.id}>{req.reqNumber} - {req.itemName} ({req.quantity} {req.unit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Target Vendors (Comma Separated)</label>
                <input type="text" required placeholder="e.g. Beximco Pharma, Acme Laboratories" value={formData.targetVendors} onChange={(e) => setFormData({ ...formData, targetVendors: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Issuance Date</label>
                  <input type="date" required value={formData.issuanceDate} onChange={(e) => setFormData({ ...formData, issuanceDate: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Closing Date</label>
                  <input type="date" required value={formData.closingDate} onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button type="button" onClick={() => window.print()} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium flex items-center gap-1.5">
                  <Printer className="w-4 h-4" /> Print Form Preview
                </button>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium shadow-lg disabled:opacity-50">
                    {submitting ? 'Issuing...' : 'Issue RFQ'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}