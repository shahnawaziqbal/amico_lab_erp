import React, { useState, useEffect } from 'react';
import { fetchRequisitions, updateRequisitionStatus, deleteRequisition } from '../requisitions.service';

export default function RequisitionListTab({ onOpenCreateModal, onSelectPrint }) {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const locationsList = [
    'Head Office',
    'Factory',
    'Depot - Dhaka (DK)',
    'Depot - Mymensingh (MYM)',
    'Depot - Dinajpur (DIN)',
    'Depot - Rajshahi (RAJ)',
    'Depot - Bogura (BOG)',
    'Depot - Chittagong (CTG)',
    'Depot - Comilla (COM)',
    'Depot - Noakhali (NOA)',
    'Depot - Sylhet (SYL)',
    'Depot - Barisal (BAR)',
    'Depot - Faridpur (FAR)',
    'Depot - Jessore (JES)',
    'Depot - Kushtia (KUS)'
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchRequisitions();
      setRequisitions(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      console.error('Failed to load requisitions:', err);
      setRequisitions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateRequisitionStatus(id, newStatus);
      loadData();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDispatchFromStock = async (id) => {
    try {
      await updateRequisitionStatus(id, 'IN_STOCK_DISPATCHED');
      alert('Items verified in central inventory and dispatched successfully from stock.');
      loadData();
    } catch (err) {
      console.error('Failed to dispatch from stock:', err);
    }
  };

  const handleCreatePurchaseOrder = async (id, reqNumber) => {
    try {
      await updateRequisitionStatus(id, 'PO_ISSUED');
      alert(`Purchase Order successfully generated and issued for Requisition: ${reqNumber}`);
      loadData();
    } catch (err) {
      console.error('Failed to issue PO:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this official requisition record?')) {
      try {
        await deleteRequisition(id);
        loadData();
      } catch (err) {
        console.error('Failed to delete requisition:', err);
      }
    }
  };

  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,Req Number,Location Center,Department,Request Timestamp,Fulfillment Stage,Remarks,Items Summary,Status\n';
    requisitions.forEach(r => {
      const itemsSummary = (r.items || []).map(i => `${i.materialName} (${i.requestedQty} ${i.unit})`).join('; ');
      csvContent += `"${r.reqNumber}","${r.locationType}","${r.department || 'N/A'}","${r.requestDate}","${r.updatedAt || 'N/A'}","${r.purposeRemarks || ''}","${itemsSummary}","${r.status}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Office_Requisitions_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRequisitions = Array.isArray(requisitions) ? requisitions.filter(r => {
    const matchesSearch = (r.reqNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.purposeRemarks && r.purposeRemarks.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLocation = filterLocation === 'ALL' || r.locationType === filterLocation;
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesLocation && matchesStatus;
  }) : [];

  return (
    <div className="p-8 space-y-6 bg-slate-900 text-slate-100 min-h-screen">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-wide">Daily Office Requisitions & Material Issue</h2>
          <p className="text-xs text-slate-400 mt-1">Manage official daily purchase requisitions, stock dispatch, and departmental delivery across Head Office, Plant, and 13 Depots.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportCSV}
            className="px-4 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            Export CSV
          </button>
          <button 
            onClick={onOpenCreateModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
          >
            + Create Requisition
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
        <input
          type="text"
          placeholder="Search by Req Number, Department, or Remarks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 shadow-sm"
        />
        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
        >
          <option value="ALL">All Centers & Depots</option>
          {locationsList.map((loc, idx) => (
            <option key={idx} value={loc}>{loc}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="IN_STOCK_DISPATCHED">In-Stock Dispatched</option>
          <option value="PO_ISSUED">PO Issued</option>
          <option value="DISPATCHED_TO_DEPARTMENT">Dispatched to Department</option>
          <option value="RECEIVED_BY_DEPARTMENT">Received by Department</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <th className="p-4">REQ NUMBER</th>
                <th className="p-4">CENTER / LOCATION</th>
                <th className="p-4">REQUEST TIMESTAMP</th>
                <th className="p-4">FULFILLMENT STAGE</th>
                <th className="p-4">REMARKS</th>
                <th className="p-4">STATUS</th>
                <th className="p-4 text-right">ACTIONS & REPORTING</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-slate-400">Loading requisitions...</td></tr>
              ) : filteredRequisitions.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-slate-400">No requisitions found.</td></tr>
              ) : (
                filteredRequisitions.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-bold text-indigo-400">{req.reqNumber}</td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-200">{req.locationType}</p>
                      <p className="text-[10px] text-slate-400">{req.department}</p>
                    </td>
                    <td className="p-4 text-slate-300 font-mono text-[11px]">{req.requestDate}</td>
                    <td className="p-4 text-slate-300 font-mono text-[11px]">
                      {req.status === 'RECEIVED_BY_DEPARTMENT' ? (
                        <span className="text-cyan-400 font-bold">Received by Dept ({new Date(req.updatedAt).toLocaleDateString()})</span>
                      ) : req.status === 'DISPATCHED_TO_DEPARTMENT' ? (
                        <span className="text-teal-400 font-bold">Delivered to Dept ({new Date(req.updatedAt).toLocaleDateString()})</span>
                      ) : req.status === 'IN_STOCK_DISPATCHED' ? (
                        <span className="text-emerald-400 font-bold">Dispatched from Stock ({new Date(req.updatedAt).toLocaleDateString()})</span>
                      ) : req.status === 'PO_ISSUED' ? (
                        <span className="text-amber-400 font-bold">Purchase Order Given ({new Date(req.updatedAt).toLocaleDateString()})</span>
                      ) : (
                        <span className="text-slate-400">Pending Execution</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-300 max-w-xs truncate" title={req.purposeRemarks}>
                      {req.purposeRemarks || 'N/A'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                        req.status === 'RECEIVED_BY_DEPARTMENT' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        req.status === 'DISPATCHED_TO_DEPARTMENT' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                        req.status === 'IN_STOCK_DISPATCHED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        req.status === 'PO_ISSUED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        req.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        req.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-slate-700 text-slate-300 border border-slate-600'
                      }`}>
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      {/* Print PDF Report */}
                      <button
                        onClick={() => onSelectPrint(req)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-medium transition border border-slate-700 cursor-pointer"
                      >
                        Print PDF Report
                      </button>

                      {/* In-Stock Dispatch Button */}
                      <button
                        onClick={() => handleDispatchFromStock(req.id)}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg text-xs font-medium transition border border-emerald-500/30 cursor-pointer"
                      >
                        Dispatch from Stock
                      </button>

                      {/* Purchase Order Given Button */}
                      <button
                        onClick={() => handleCreatePurchaseOrder(req.id, req.reqNumber)}
                        className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded-lg text-xs font-medium transition border border-amber-500/30 cursor-pointer"
                      >
                        PO Given
                      </button>

                      {/* Status Dropdown */}
                      <select
                        value={req.status}
                        onChange={(e) => handleStatusChange(req.id, e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg text-xs px-2 py-1.5 text-slate-200 focus:outline-none cursor-pointer"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approve</option>
                        <option value="IN_STOCK_DISPATCHED">In-Stock Dispatched</option>
                        <option value="PO_ISSUED">PO Issued</option>
                        <option value="DISPATCHED_TO_DEPARTMENT">Dispatched to Department</option>
                        <option value="RECEIVED_BY_DEPARTMENT">Received by Department</option>
                        <option value="REJECTED">Reject</option>
                      </select>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(req.id)}
                        className="text-rose-400 hover:text-rose-300 text-xs px-1 cursor-pointer"
                        title="Delete record"
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}