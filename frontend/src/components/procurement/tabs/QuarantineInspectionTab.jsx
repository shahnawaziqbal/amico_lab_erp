import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ClipboardCheck, 
  X, 
  Download,
  Printer,
  FileCheck
} from 'lucide-react';

const API_BASE_URL = '';

export default function QarantineInspectionTab() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Inspection Modal State
  const [inspectModalItem, setInspectModalItem] = useState(null);
  const [inspectorName, setInspectorName] = useState('Dr. Farhana Yasmin (QA Lead)');
  const [qcStatus, setQcStatus] = useState('PASSED');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/procurement/orders`);
      if (!res.ok) throw new Error('Failed to fetch purchase orders.');
      const data = await res.json();
      setPurchaseOrders(data);
    } catch (err) {
      console.error(err);
      setErrorMessage('Could not load quarantine inventory. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleInspectSubmit = async (e) => {
    e.preventDefault();
    if (!inspectModalItem) return;

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        itemId: inspectModalItem.id,
        qcStatus: qcStatus,
        remarks: remarks || (qcStatus === 'PASSED' ? 'Passed QA testing & GRN issued for production pipeline' : 'Failed QA testing - Rejected & Vendor Return initiated'),
        inspectorName: inspectorName
      };

      const res = await fetch(`${API_BASE_URL}/procurement/qc-inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to record QC inspection.');
      }

      setSuccessMessage(`Item "${inspectModalItem.itemName}" successfully inspected and updated to ${qcStatus}!`);
      setInspectModalItem(null);
      setRemarks('');
      fetchPurchaseOrders();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const exportExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["PO Number,Vendor Name,Order Date,Subtype,Item Name,Quantity,Unit,Unit Price (BDT),QC Status,QA Remarks"].join(",") + "\n"
      + filteredItems.map(i => `"${i.poNumber}","${i.vendorName}","${i.orderDate}","${i.materialSubtype}","${i.itemName}",${i.quantity},"${i.unit}",${i.unitPrice},"${i.qcStatus}","${i.qcRemarks || ''}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `amico_quarantine_qc_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allQuarantineItems = [];
  purchaseOrders.forEach(po => {
    if (po.items && Array.isArray(po.items)) {
      po.items.forEach(item => {
        allQuarantineItems.push({
          ...item,
          poNumber: po.poNumber,
          vendorName: po.vendorName,
          orderDate: po.orderDate
        });
      });
    }
  });

  const filteredItems = allQuarantineItems.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.qcStatus === statusFilter;
    const matchesDate = (!startDate || item.orderDate >= startDate) && (!endDate || item.orderDate <= endDate);
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 p-6 rounded-2xl shadow-xl text-white">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-600/30 rounded-xl border border-teal-500/30">
              <ShieldCheck className="w-8 h-8 text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Quarantine & cGMP QC Gate</h1>
              <p className="text-slate-400 text-sm">Birulia Plant Quality Assurance testing gateway for Raw Materials (APIs/Excipients) and Packaging.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={exportExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl font-medium text-sm shadow-lg transition">
            <Download className="w-4 h-4" /> Export Excel / CSV
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-3 rounded-xl font-medium text-sm transition">
            <Printer className="w-4 h-4" /> Print / PDF
          </button>
          <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 px-4 py-3 rounded-xl text-teal-300 text-sm font-medium">
            <FileCheck className="w-4 h-4" /> GRN Automated Issuance Active
          </div>
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
            placeholder="Search by Item Name, PO Number, or Vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700" title="Start Order Date" />
          <span className="text-slate-400 text-xs">to</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700" title="End Order Date" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-sm"
          >
            <option value="ALL">All Inspection Statuses</option>
            <option value="QUARANTINE_PENDING">Quarantine Pending</option>
            <option value="PASSED">Passed (GRN Issued)</option>
            <option value="FAILED_RETURNED">Failed & Returned</option>
          </select>
        </div>
      </div>

      {/* Quarantine Inspection Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs tracking-wider font-semibold">
                <th className="p-4">PO & Vendor</th>
                <th className="p-4">Material Subtype</th>
                <th className="p-4">Item Name</th>
                <th className="p-4">Quantity Received</th>
                <th className="p-4">Unit Price</th>
                <th className="p-4">QC Status</th>
                <th className="p-4">QA Remarks</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
              {loading ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-400">Loading quarantine inspection queue...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-400">No items found in quarantine inspection queue.</td></tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-indigo-600">{item.poNumber}</div>
                      <div className="text-xs text-slate-500">{item.vendorName}</div>
                    </td>
                    <td className="p-4"><span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-mono font-medium">{item.materialSubtype}</span></td>
                    <td className="p-4 font-semibold text-slate-900">{item.itemName}</td>
                    <td className="p-4 text-slate-700 font-medium">{item.quantity} {item.unit}</td>
                    <td className="p-4 text-slate-700">৳ {Number(item.unitPrice).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        item.qcStatus === 'QUARANTINE_PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        item.qcStatus === 'PASSED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {item.qcStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500 max-w-xs truncate" title={item.qcRemarks || 'Pending testing'}>
                      {item.qcRemarks || 'Awaiting lab assays & physical inspection'}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => {
                          setInspectModalItem(item);
                          setQcStatus(item.qcStatus === 'QUARANTINE_PENDING' ? 'PASSED' : item.qcStatus);
                          setRemarks(item.qcRemarks || '');
                        }}
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 border border-teal-200"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" /> Inspect / Test
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QC Inspection Modal */}
      {inspectModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" /> cGMP Quarantine Inspection
              </h3>
              <button onClick={() => setInspectModalItem(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleInspectSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm space-y-1">
                <div><span className="font-semibold text-slate-700">Item:</span> {inspectModalItem.itemName} ({inspectModalItem.materialSubtype})</div>
                <div><span className="font-semibold text-slate-700">Quantity:</span> {inspectModalItem.quantity} {inspectModalItem.unit}</div>
                <div><span className="font-semibold text-slate-700">PO Reference:</span> {inspectModalItem.poNumber}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Inspector Name (QA Pharmacist)</label>
                <input type="text" required value={inspectorName} onChange={(e) => setInspectorName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Assay / Test Result Decision</label>
                <select value={qcStatus} onChange={(e) => setQcStatus(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold">
                  <option value="PASSED">PASSED (Issue GRN for Production Pipeline)</option>
                  <option value="FAILED_RETURNED">FAILED & RETURNED (Vendor Rejection)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Lab Testing Remarks & CoA Verification</label>
                <textarea rows="3" placeholder="Enter certificate of analysis (CoA) numbers, purity % or specific defect notes..." value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"></textarea>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button type="button" onClick={() => window.print()} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium flex items-center gap-1.5">
                  <Printer className="w-4 h-4" /> Print Inspection CoA
                </button>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setInspectModalItem(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium shadow-lg disabled:opacity-50">
                    {submitting ? 'Recording...' : 'Confirm Inspection'}
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