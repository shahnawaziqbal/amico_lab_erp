import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Clock, 
  X, 
  Download,
  Printer,
  TrendingDown
} from 'lucide-react';

const API_BASE_URL = '';

export default function SupplierQuotationsTab() {
  const [quotations, setQuotations] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rfqFilter, setRfqFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    rfqId: '',
    vendorName: '',
    quotedUnitPrice: '',
    leadTimeDays: '',
    paymentTerms: 'NET_30',
    validUntil: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [quotesRes, rfqsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/procurement/supplier-quotations`),
        fetch(`${API_BASE_URL}/procurement/rfq`)
      ]);

      if (!quotesRes.ok || !rfqsRes.ok) {
        throw new Error('Failed to fetch quotation or RFQ data from server.');
      }

      const quotesData = await quotesRes.json();
      const rfqsData = await rfqsRes.json();

      setQuotations(quotesData);
      setRfqs(rfqsData);
    } catch (err) {
      console.error(err);
      setErrorMessage('Could not load supplier quotations. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        ...formData,
        quotedUnitPrice: parseFloat(formData.quotedUnitPrice) || 0,
        leadTimeDays: parseInt(formData.leadTimeDays, 10) || 0
      };

      const res = await fetch(`${API_BASE_URL}/procurement/supplier-quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to save supplier quotation.');
      }

      setSuccessMessage('Supplier quotation successfully registered in system!');
      setIsModalOpen(false);
      fetchInitialData();

      setFormData({
        rfqId: '',
        vendorName: '',
        quotedUnitPrice: '',
        leadTimeDays: '',
        paymentTerms: 'NET_30',
        validUntil: new Date().toISOString().split('T')[0],
        remarks: ''
      });
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const exportExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Vendor Name,RFQ Reference,Quoted Unit Price (BDT),Lead Time (Days),Payment Terms,Validity Date,Remarks"].join(",") + "\n"
      + filteredQuotations.map(q => `"${q.vendorName}","${q.rfqId}",${q.quotedUnitPrice},${q.leadTimeDays},"${q.paymentTerms}","${q.validUntil}","${q.remarks || ''}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `amico_supplier_quotations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group quotations by RFQ ID for L1 lowest price evaluation
  const groupedQuotations = quotations.reduce((acc, quote) => {
    const key = quote.rfqId || 'UNLINKED';
    if (!acc[key]) acc[key] = [];
    acc[key].push(quote);
    return acc;
  }, {});

  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = q.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (q.rfqId && q.rfqId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRfq = rfqFilter === 'ALL' || q.rfqId === rfqFilter;
    return matchesSearch && matchesRfq;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-2xl shadow-xl text-white">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600/30 rounded-xl border border-emerald-500/30">
              <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Supplier Quotations Registry</h1>
              <p className="text-slate-400 text-sm">Register incoming vendor bids, unit prices, delivery lead times, and payment terms.</p>
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
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg transition-all">
            <Plus className="w-5 h-5" /> Log Quotation
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
            placeholder="Search by Vendor Name or RFQ ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="flex items-center gap-3">
          <select value={rfqFilter} onChange={(e) => setRfqFilter(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-sm">
            <option value="ALL">All Associated RFQs</option>
            {rfqs.map(rfq => (
              <option key={rfq.id} value={rfq.id}>{rfq.rfqNumber || rfq.id}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Supplier Quotations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs tracking-wider font-semibold">
                <th className="p-4">Vendor Name</th>
                <th className="p-4">RFQ Reference</th>
                <th className="p-4">Quoted Unit Price</th>
                <th className="p-4">Lead Time</th>
                <th className="p-4">Payment Terms</th>
                <th className="p-4">Validity Date</th>
                <th className="p-4">Analysis / L1 Evaluation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-slate-400">Loading supplier quotations from database...</td></tr>
              ) : filteredQuotations.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-slate-400">No supplier quotations found. Log your first quotation above.</td></tr>
              ) : (
                filteredQuotations.map((q) => {
                  const group = groupedQuotations[q.rfqId] || [];
                  const minPrice = group.length > 0 ? Math.min(...group.map(item => Number(item.quotedUnitPrice))) : Number(q.quotedUnitPrice);
                  const isLowest = Number(q.quotedUnitPrice) === minPrice;

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-semibold text-slate-900 flex items-center gap-2"><Building2 className="w-4 h-4 text-emerald-600" /> {q.vendorName}</td>
                      <td className="p-4 font-mono text-xs text-indigo-600 font-medium">{q.rfqId || 'N/A'}</td>
                      <td className="p-4 font-semibold text-slate-900">৳ {Number(q.quotedUnitPrice).toLocaleString()}</td>
                      <td className="p-4 text-slate-600 font-medium"><span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {q.leadTimeDays} Days</span></td>
                      <td className="p-4"><span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-mono font-medium">{q.paymentTerms.replace(/_/g, ' ')}</span></td>
                      <td className="p-4 text-slate-600">{q.validUntil || 'N/A'}</td>
                      <td className="p-4">
                        {isLowest ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
                            <TrendingDown className="w-3.5 h-3.5" /> Lowest Quote (L1)
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Standard Bid</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Supplier Quotation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Log Incoming Vendor Quotation
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Target RFQ Reference</label>
                <select required value={formData.rfqId} onChange={(e) => setFormData({ ...formData, rfqId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono">
                  <option value="">Select associated RFQ...</option>
                  {rfqs.map(rfq => (
                    <option key={rfq.id} value={rfq.id}>{rfq.rfqNumber || rfq.id}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Vendor Name</label>
                <input type="text" required placeholder="e.g. Beximco API & Fine Chemicals Ltd" value={formData.vendorName} onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Quoted Unit Price (৳)</label>
                  <input type="number" step="0.01" required placeholder="0.00" value={formData.quotedUnitPrice} onChange={(e) => setFormData({ ...formData, quotedUnitPrice: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Lead Time (Days)</label>
                  <input type="number" required placeholder="e.g. 7" value={formData.leadTimeDays} onChange={(e) => setFormData({ ...formData, leadTimeDays: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Payment Terms</label>
                  <select value={formData.paymentTerms} onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                    <option value="NET_30">Net 30 Days</option>
                    <option value="NET_60">Net 60 Days</option>
                    <option value="ADVANCE">100% Advance</option>
                    <option value="LC_AT_SIGHT">L/C at Sight</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Quote Validity Date</label>
                  <input type="date" required value={formData.validUntil} onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Remarks / CoA Certifications</label>
                <textarea rows="2" placeholder="e.g. Verified cGMP certificate & USP grade purity..." value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"></textarea>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button type="button" onClick={() => window.print()} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium flex items-center gap-1.5">
                  <Printer className="w-4 h-4" /> Print Form Preview
                </button>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium shadow-lg disabled:opacity-50">
                    {submitting ? 'Registering...' : 'Save Vendor Quotation'}
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