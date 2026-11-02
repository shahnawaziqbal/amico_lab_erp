import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  User, 
  X, 
  Download,
  Printer
} from 'lucide-react';

const API_BASE_URL = '';

export default function RequisitionsTab() {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State for creating new requisition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    reqNumber: `REQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    department: 'Plant Operations - Tablet Pipeline',
    requestedBy: '',
    requiredDate: new Date().toISOString().split('T')[0],
    materialCategory: 'RAW_MATERIAL',
    materialSubtype: 'API',
    itemName: '',
    quantity: '',
    unit: 'kg'
  });

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const fetchRequisitions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/procurement/requisitions`);
      if (!res.ok) throw new Error('Failed to fetch requisitions from backend.');
      const data = await res.json();
      setRequisitions(data);
    } catch (err) {
      console.error(err);
      setErrorMessage('Could not load internal requisitions. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequisition = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity) || 0
      };

      const res = await fetch(`${API_BASE_URL}/procurement/requisitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create requisition.');
      }

      setSuccessMessage('Internal Requisition successfully submitted to Procurement department!');
      setIsModalOpen(false);
      fetchRequisitions();

      setFormData({
        reqNumber: `REQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        department: 'Plant Operations - Tablet Pipeline',
        requestedBy: '',
        requiredDate: new Date().toISOString().split('T')[0],
        materialCategory: 'RAW_MATERIAL',
        materialSubtype: 'API',
        itemName: '',
        quantity: '',
        unit: 'kg'
      });
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const exportExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Req ID,Department,Category,Subtype,Item Name,Quantity,Unit,Required Date,Requested By"].join(",") + "\n"
      + filteredRequisitions.map(r => `"${r.reqNumber}","${r.department}","${r.materialCategory}","${r.materialSubtype}","${r.itemName}",${r.quantity},"${r.unit}","${r.requiredDate}","${r.requestedBy}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `amico_requisitions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRequisitions = requisitions.filter(req => {
    const matchesSearch = req.reqNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          req.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          req.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || req.materialCategory === categoryFilter;
    const matchesDate = (!startDate || req.requiredDate >= startDate) && (!endDate || req.requiredDate <= endDate);
    return matchesSearch && matchesCategory && matchesDate;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 rounded-2xl shadow-xl text-white">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/30 rounded-xl border border-blue-500/30">
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Internal Requisition Hub</h1>
              <p className="text-slate-400 text-sm">Plant pipeline material requests for Tablets, Capsules, Syrups, Liquids, and Packaging lines.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl font-medium text-sm shadow-lg transition"
          >
            <Download className="w-4 h-4" /> Export Excel / CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-3 rounded-xl font-medium text-sm transition"
          >
            <Printer className="w-4 h-4" /> Print / PDF
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" /> New Requisition
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
            placeholder="Search Requisitions by ID, Item Name, Department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
            title="Start Required Date"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
            title="End Required Date"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-sm"
          >
            <option value="ALL">All Categories</option>
            <option value="RAW_MATERIAL">Raw Materials</option>
            <option value="PACKAGING_MATERIAL">Packaging Materials</option>
          </select>
        </div>
      </div>

      {/* Requisitions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs tracking-wider font-semibold">
                <th className="p-4">Req ID</th>
                <th className="p-4">Department / Pipeline</th>
                <th className="p-4">Material Subtype</th>
                <th className="p-4">Item Name</th>
                <th className="p-4">Requested Qty</th>
                <th className="p-4">Required Date</th>
                <th className="p-4">Requested By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-slate-400">Loading requisitions from database...</td></tr>
              ) : filteredRequisitions.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-slate-400">No requisitions found. Create your first material request above.</td></tr>
              ) : (
                filteredRequisitions.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-semibold text-blue-600 font-mono">{req.reqNumber}</td>
                    <td className="p-4 font-medium text-slate-900">{req.department}</td>
                    <td className="p-4"><span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-mono font-medium">{req.materialSubtype}</span></td>
                    <td className="p-4 font-semibold text-slate-800">{req.itemName}</td>
                    <td className="p-4 font-semibold text-slate-900">{req.quantity} {req.unit}</td>
                    <td className="p-4 text-slate-600 flex items-center gap-1.5 pt-5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {req.requiredDate}</td>
                    <td className="p-4 text-slate-600"><div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> {req.requestedBy}</div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Requisition Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" /> New Internal Material Requisition
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateRequisition} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Requisition Number</label>
                  <input type="text" required value={formData.reqNumber} onChange={(e) => setFormData({ ...formData, reqNumber: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Department / Pipeline</label>
                  <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                    <option value="Plant Operations - Tablet Pipeline">Tablet Pipeline</option>
                    <option value="Plant Operations - Capsule Pipeline">Capsule Pipeline</option>
                    <option value="Plant Operations - PFS Pipeline">PFS (Prefilled Syringe) Pipeline</option>
                    <option value="Plant Operations - Syrup Pipeline">Syrup Pipeline</option>
                    <option value="Plant Operations - ORS Pipeline">ORS Pipeline</option>
                    <option value="Plant Operations - Derma Pipeline">Derma Pipeline</option>
                    <option value="Plant Operations - Lotion Pipeline">Lotion Pipeline</option>
                    <option value="Quality Assurance Department">Quality Assurance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Requested By</label>
                  <input type="text" required placeholder="e.g. Dr. Tanvir Ahmed" value={formData.requestedBy} onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Required Date</label>
                  <input type="date" required value={formData.requiredDate} onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Material Category</label>
                  <select value={formData.materialCategory} onChange={(e) => setFormData({ ...formData, materialCategory: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                    <option value="RAW_MATERIAL">Raw Material</option>
                    <option value="PACKAGING_MATERIAL">Packaging Material</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Material Subtype</label>
                  <select value={formData.materialSubtype} onChange={(e) => setFormData({ ...formData, materialSubtype: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                    <option value="API">API</option>
                    <option value="EXCIPIENT">Excipient</option>
                    <option value="ALUMINIUM_FOIL">Aluminium Foil</option>
                    <option value="PLASTIC_BOTTLE">Plastic Bottle</option>
                    <option value="GLASS_BOTTLE">Glass Bottle</option>
                    <option value="BOTTLE_HEAD">Bottle Head (Cap)</option>
                    <option value="CARTON">Carton</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Item Name</label>
                <input type="text" required placeholder="e.g. Paracetamol USP Grade / Amber Glass Bottle 100ml" value={formData.itemName} onChange={(e) => setFormData({ ...formData, itemName: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Quantity</label>
                  <input type="number" step="0.01" required placeholder="0.00" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Unit</label>
                  <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                    <option value="kg">kg</option>
                    <option value="liters">liters</option>
                    <option value="pcs">pcs</option>
                    <option value="rolls">rolls</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button type="button" onClick={() => window.print()} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium flex items-center gap-1.5">
                  <Printer className="w-4 h-4" /> Print Form Preview
                </button>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium shadow-lg disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit Requisition'}
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