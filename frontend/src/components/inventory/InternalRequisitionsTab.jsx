import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardList, 
  Search, 
  RefreshCw, 
  Download, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  X, 
  Eye, 
  FileText, 
  Building2, 
  Check, 
  Ban 
} from 'lucide-react';

const API_BASE_URL = '';

export default function InternalRequisitionTab() {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReqForView, setSelectedReqForView] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Comprehensive Requisition Form State with Remarks
  const [formData, setFormData] = useState({
    requisitionNumber: `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    requestingDepartment: 'FACTORY_PRODUCTION',
    requestDate: new Date().toISOString().split('T')[0],
    purposeRemarks: 'Urgent departmental stock replenishment for ongoing cGMP batch operations and plant line maintenance.',
    items: [
      { itemCode: 'RM-101', itemName: 'Paracetamol USP API', requestedQty: '500', unit: 'kg', category: 'API' }
    ]
  });

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const fetchRequisitions = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch(`${API_BASE_URL}/inventory/requisitions`);
      if (!res.ok) throw new Error('Failed to fetch internal requisitions.');
      
      const data = await res.json();
      // Ensure we always store an array to prevent .filter crashes
      setRequisitions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Requisitions fetch error:', err);
      setErrorMsg('Could not load internal requisitions from backend.');
      setRequisitions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItemRow = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { itemCode: `ITEM-${Math.floor(100 + Math.random() * 900)}`, itemName: '', requestedQty: '', unit: 'kg', category: 'API' }
      ]
    });
  };

  const handleRemoveItemRow = (index) => {
    if (formData.items.length === 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    setFormData({ ...formData, items: updated });
  };

  const handleSubmitRequisition = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        ...formData,
        items: formData.items.map(item => ({
          ...item,
          requestedQty: parseFloat(item.requestedQty) || 0
        }))
      };

      const res = await fetch(`${API_BASE_URL}/inventory/requisitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to submit internal requisition.');

      setSuccessMsg(`Internal Requisition ${formData.requisitionNumber} successfully submitted & logged!`);
      setIsCreateModalOpen(false);
      fetchRequisitions();

      setFormData({
        requisitionNumber: `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        requestingDepartment: 'FACTORY_PRODUCTION',
        requestDate: new Date().toISOString().split('T')[0],
        purposeRemarks: 'Urgent departmental stock replenishment for ongoing cGMP batch operations and plant line maintenance.',
        items: [{ itemCode: 'RM-101', itemName: 'Paracetamol USP API', requestedQty: '500', unit: 'kg', category: 'API' }]
      });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/requisitions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!res.ok) throw new Error('Failed to update requisition status.');

      setSuccessMsg(`Requisition status updated to ${status}!`);
      if (selectedReqForView) setSelectedReqForView({ ...selectedReqForView, status });
      fetchRequisitions();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Safe Dynamic Filtering
  const filteredRequisitions = useMemo(() => {
    if (!Array.isArray(requisitions)) return [];
    return requisitions.filter(req => {
      const reqNum = req?.requisitionNumber || '';
      const dept = req?.requestingDepartment || '';
      const remarks = req?.purposeRemarks || '';
      const query = searchTerm || '';

      const matchesSearch = reqNum.toLowerCase().includes(query.toLowerCase()) ||
                            dept.toLowerCase().includes(query.toLowerCase()) ||
                            remarks.toLowerCase().includes(query.toLowerCase());
      
      const matchesDept = deptFilter === 'ALL' || dept === deptFilter;
      const matchesStatus = statusFilter === 'ALL' || req?.status === statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [requisitions, searchTerm, deptFilter, statusFilter]);

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Req Number,Department,Request Date,Status,Purpose Remarks,Total Items"].join(",") + "\n"
      + filteredRequisitions.map(r => `"${r.requisitionNumber}","${r.requestingDepartment}","${r.requestDate}","${r.status}","${r.purposeRemarks || ''}",${r.items?.length || 0}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `amico_internal_requisitions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl shadow-xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-indigo-500/25">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/30 rounded-xl border border-indigo-500/30">
              <ClipboardList className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Multi-Department Internal Requisitions</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Central material issue requests for Factory Production, Head Office, Depots, and Plant Operations with remarks logging.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-semibold text-xs shadow-lg transition"
          >
            <Plus className="w-4 h-4" /> Create Requisition
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-4 h-4" /> {successMsg}</span>
          <button onClick={() => setSuccessMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 font-medium"><AlertTriangle className="w-4 h-4" /> {errorMsg}</span>
          <button onClick={() => setErrorMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Req Number, Department, or Remarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Departments</option>
            <option value="FACTORY_PRODUCTION">Factory Production</option>
            <option value="HEAD_OFFICE_ADMIN">Head Office Admin</option>
            <option value="DEPOT_LOGISTICS">Depot Logistics</option>
            <option value="PLANT_MAINTENANCE">Plant Maintenance</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button onClick={exportCSV} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-xl font-semibold text-xs shadow-md">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          
          <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 rounded-xl font-semibold text-xs">
            <Printer className="w-3.5 h-3.5" /> Print PDF Report
          </button>
        </div>
      </div>

      {/* Requisitions Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" /> Internal Requisition Records
          </h3>
          <span className="text-xs text-slate-500 font-mono">Showing {filteredRequisitions.length} requests</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="p-3.5">Req Number</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Request Date</th>
                <th className="p-3.5">Purpose / Remarks</th>
                <th className="p-3.5">Items Summary</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-slate-400">Loading requisitions from database...</td></tr>
              ) : filteredRequisitions.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-slate-400">No requisitions found matching query.</td></tr>
              ) : (
                filteredRequisitions.map((req, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-indigo-600 font-mono">{req.requisitionNumber}</td>
                    <td className="p-3.5 font-medium text-slate-900">{req.requestingDepartment?.replace(/_/g, ' ')}</td>
                    <td className="p-3.5 text-slate-600">{req.requestDate}</td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate" title={req.purposeRemarks}>{req.purposeRemarks || 'N/A'}</td>
                    <td className="p-3.5 font-mono text-slate-700">
                      {Array.isArray(req.items) 
                        ? req.items.map(i => `${i.itemName} (${i.requestedQty} ${i.unit})`).join(', ') 
                        : 'No items'}
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                        req.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        req.status === 'DISPATCHED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setSelectedReqForView(req)}
                        className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition inline-flex items-center gap-1 font-semibold text-xs"
                      >
                        <Eye className="w-4 h-4" /> Voucher
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View / Printable Requisition Voucher Modal */}
      {selectedReqForView && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6 my-8 print:p-0 print:shadow-none print:w-full">
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900 uppercase">Amico Laboratories Ltd.</h2>
                <p className="text-xs text-slate-600">Birulia, Savar, Dhaka &bull; cGMP Plant Operations</p>
                <p className="text-xs text-slate-500 font-mono mt-1">INTERNAL MATERIAL REQUISITION VOUCHER</p>
              </div>
              <div className="text-right font-mono">
                <span className="text-sm font-bold text-indigo-600 block">{selectedReqForView.requisitionNumber}</span>
                <span className="text-xs text-slate-500">Date: {selectedReqForView.requestDate}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <p>Requesting Department: <span className="font-bold text-slate-900">{selectedReqForView.requestingDepartment?.replace(/_/g, ' ')}</span></p>
                <p>Current Status: <span className="font-bold text-indigo-600">{selectedReqForView.status}</span></p>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <p className="font-semibold uppercase text-[10px] text-slate-500">Purpose / Operational Remarks:</p>
                <p className="text-slate-700 mt-0.5 italic">{selectedReqForView.purposeRemarks || 'N/A'}</p>
              </div>
            </div>

            <table className="w-full text-left border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300">Item Description</th>
                  <th className="p-2 border-r border-slate-300">Category</th>
                  <th className="p-2 text-right">Requested Qty</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(selectedReqForView.items) && selectedReqForView.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="p-2 border-r border-slate-200 font-semibold text-slate-800">{item.itemName}</td>
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-600">{item.category}</td>
                    <td className="p-2 text-right font-bold text-slate-900">{item.requestedQty} {item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Approval Controls */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200 print:hidden">
              <div className="flex gap-2">
                {selectedReqForView.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedReqForView.id, 'APPROVED')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedReqForView.id, 'REJECTED')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Ban className="w-4 h-4" /> Reject
                    </button>
                  </>
                )}
                {selectedReqForView.status === 'APPROVED' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedReqForView.id, 'DISPATCHED')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Dispatch Store Issue
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5">
                  <Printer className="w-4 h-4" /> Print PDF Voucher
                </button>
                <button onClick={() => setSelectedReqForView(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Create Requisition Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" /> Comprehensive Internal Requisition Form
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmitRequisition} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Requisition No</label>
                  <input type="text" required value={formData.requisitionNumber} onChange={(e) => setFormData({ ...formData, requisitionNumber: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Requesting Department</label>
                  <select value={formData.requestingDepartment} onChange={(e) => setFormData({ ...formData, requestingDepartment: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium">
                    <option value="FACTORY_PRODUCTION">Factory Production</option>
                    <option value="HEAD_OFFICE_ADMIN">Head Office Administration</option>
                    <option value="DEPOT_LOGISTICS">Depot Logistics</option>
                    <option value="PLANT_MAINTENANCE">Plant Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Request Date</label>
                  <input type="date" required value={formData.requestDate} onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Comprehensive Purpose & Operational Remarks</label>
                <textarea
                  rows="2"
                  value={formData.purposeRemarks}
                  onChange={(e) => setFormData({ ...formData, purposeRemarks: e.target.value })}
                  placeholder="Enter detailed reason for requisition, batch execution targets, or maintenance notes..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Requisition Line Items</h4>
                  <button type="button" onClick={handleAddItemRow} className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                {formData.items.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 relative">
                    {formData.items.length > 1 && (
                      <button type="button" onClick={() => handleRemoveItemRow(idx)} className="absolute right-3 top-3 text-rose-500 hover:text-rose-700" title="Remove Item">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Item Description</label>
                        <input type="text" required placeholder="e.g. Paracetamol API / Blister Foil" value={item.itemName} onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Category</label>
                        <select value={item.category} onChange={(e) => handleItemChange(idx, 'category', e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs">
                          <option value="API">API / Active Ingredient</option>
                          <option value="PACKAGING">Packaging Material</option>
                          <option value="OFFICE_SUPPLIES">Head Office Supplies</option>
                          <option value="MAINTENANCE">Plant Maintenance Consumable</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Requested Qty</label>
                        <input type="number" required step="0.01" placeholder="0.00" value={item.requestedQty} onChange={(e) => handleItemChange(idx, 'requestedQty', e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Unit</label>
                        <select value={item.unit} onChange={(e) => handleItemChange(idx, 'unit', e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs">
                          <option value="kg">kg</option>
                          <option value="pcs">pcs</option>
                          <option value="liters">liters</option>
                          <option value="box">box</option>
                          <option value="rolls">rolls</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Requisition & Sync'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}