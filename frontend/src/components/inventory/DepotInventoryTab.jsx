// DepotInventoryTab.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building, 
  Search, 
  RefreshCw, 
  Download, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  X, 
  Truck, 
  FileText,
  CheckCheck,
  ArrowRightLeft,
  MapPin
} from 'lucide-react';

const API_BASE_URL = '';

const REGIONAL_DEPOTS = [
  { code: 'HO', name: 'Head Office & Central Plant Store' },
  { code: 'DK', name: 'Dhaka Central Depot' },
  { code: 'BG', name: 'Bogura Depot' },
  { code: 'BS', name: 'Barishal Depot' },
  { code: 'CG', name: 'Chattogram Depot' },
  { code: 'CM', name: 'Cumilla Depot' },
  { code: 'DP', name: 'Dinajpur Depot' },
  { code: 'FP', name: 'Faridpur Depot' },
  { code: 'JS', name: 'Jashore Depot' },
  { code: 'KS', name: 'Kushtia Depot' },
  { code: 'MM', name: 'Mymensingh Depot' },
  { code: 'NK', name: 'Noakhali Depot' },
  { code: 'RJ', name: 'Rajshahi Depot' },
  { code: 'ST', name: 'Sylhet Depot' }
];

export default function DepotInventoryTab() {
  const [depotStocks, setDepotStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepotFilter, setSelectedDepotFilter] = useState('ALL');
  
  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItemForPrint, setSelectedItemForPrint] = useState(null);
  const [selectedItemForTransfer, setSelectedItemForTransfer] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Manual Form State
  const [form, setForm] = useState({
    itemCode: `DEP-PROD-${Math.floor(1000 + Math.random() * 9000)}`,
    itemName: 'Amiflox 500mg Tablet',
    depotName: 'Mymensingh Depot (MM)',
    availableQuantity: '',
    unit: 'box',
    unitValuationBDT: '850',
    batchNumber: `BMR-2026-${Math.floor(100 + Math.random() * 900)}`,
    dispatchDate: new Date().toISOString().split('T')[0],
    remarks: 'Dispatched via secure cold-chain logistics carrier. Received in optimal condition at regional hub.'
  });

  // Inter-Depot Stock Transfer Form State
  const [transferForm, setTransferForm] = useState({
    destinationDepot: 'Mymensingh Depot (MM)',
    quantity: '',
    unit: 'box',
    remarks: 'Inter-depot inventory balancing transfer.'
  });

  useEffect(() => {
    fetchDepotInventory();
  }, []);

  const fetchDepotInventory = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch(`${API_BASE_URL}/inventory/stocks`);
      if (!res.ok) throw new Error('Failed to fetch regional depot inventory.');
      
      const data = await res.json();
      
      // Filter for Regional Depot items and sort with newest entries on top
      // Replace lines 78-81 in DepotInventoryTab.jsx with:
const depotList = data
  .filter(s => s.warehouseType === 'REGIONAL_DEPOT' && s.warehouseType !== 'RAW_MATERIALS')
  .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setDepotStocks(depotList);
    } catch (err) {
      console.error('Depot inventory fetch error:', err);
      setErrorMsg('Could not load regional depot inventory records.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceive = async (id, batchNo) => {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/confirm-depot-receipt/${id}`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to confirm depot receipt.');
      setSuccessMsg(`Successfully confirmed receipt of batch ${batchNo} at regional depot!`);
      fetchDepotInventory();
    } catch (err) {
      setErrorMsg(err.message || 'Confirmation failed.');
    }
  };

  // Inter-Depot Stock Transfer Submission (Hub-to-Hub)
  const handleInterDepotTransfer = async (e) => {
    e.preventDefault();
    if (!selectedItemForTransfer) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        itemCode: selectedItemForTransfer.itemCode,
        batchNumber: selectedItemForTransfer.batchNumber,
        quantity: parseFloat(transferForm.quantity) || 0,
        unit: transferForm.unit,
        destinationDepot: transferForm.destinationDepot,
        remarks: transferForm.remarks || `Stock transferred from ${selectedItemForTransfer.locationName} to ${transferForm.destinationDepot}`
      };

      const res = await fetch(`${API_BASE_URL}/inventory/transfer-depot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to execute inter-depot stock transfer.');

      setSuccessMsg(`Successfully dispatched ${transferForm.quantity} ${transferForm.unit} of ${selectedItemForTransfer.itemName} from ${selectedItemForTransfer.locationName} to ${transferForm.destinationDepot}!`);
      setSelectedItemForTransfer(null);
      fetchDepotInventory();
    } catch (err) {
      setErrorMsg(err.message || 'Inter-depot transfer failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered depot items and total valuation
  const filteredDepotStocks = useMemo(() => {
    return depotStocks.filter(item => {
      const matchesSearch = (item.itemName && item.itemName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (item.itemCode && item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (item.locationName && item.locationName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (item.batchNumber && item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDepot = selectedDepotFilter === 'ALL' || item.locationName === selectedDepotFilter;
      return matchesSearch && matchesDepot;
    });
  }, [depotStocks, searchTerm, selectedDepotFilter]);

  const totalValuation = useMemo(() => {
    return filteredDepotStocks.reduce((sum, item) => sum + ((Number(item.availableQuantity) || 0) * (Number(item.unitValuationBDT) || 850)), 0);
  }, [filteredDepotStocks]);

  const handleAddDepotStock = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        warehouseType: 'REGIONAL_DEPOT',
        locationName: form.depotName,
        itemCode: form.itemCode,
        itemName: form.itemName,
        category: 'FINISHED_GOOD',
        quantity: parseFloat(form.availableQuantity) || 0,
        unit: form.unit,
        unitValuationBDT: parseFloat(form.unitValuationBDT) || 850,
        batchNumber: form.batchNumber,
        remarks: form.remarks
      };

      const res = await fetch(`${API_BASE_URL}/inventory/receive-qc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to record regional depot stock entry.');

      setSuccessMsg(`Successfully registered transit stock for ${form.depotName}!`);
      setIsAddModalOpen(false);
      fetchDepotInventory();

      setForm({
        itemCode: `DEP-PROD-${Math.floor(1000 + Math.random() * 9000)}`,
        itemName: 'Amiflox 500mg Tablet',
        depotName: 'Mymensingh Depot (MM)',
        availableQuantity: '',
        unit: 'box',
        unitValuationBDT: '850',
        batchNumber: `BMR-2026-${Math.floor(100 + Math.random() * 900)}`,
        dispatchDate: new Date().toISOString().split('T')[0],
        remarks: 'Dispatched via secure cold-chain logistics carrier. Received in optimal condition at regional hub.'
      });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Item Code,Product Name,Depot Location,Batch Number,Available Qty,Unit,Unit Valuation (BDT),Total Value (BDT),Status,Remarks"].join(",") + "\n"
      + filteredDepotStocks.map(i => `"${i.itemCode}","${i.itemName}","${i.locationName}","${i.batchNumber || 'N/A'}",${i.availableQuantity},"${i.unit || 'box'}",${i.unitValuationBDT || 850},${(Number(i.availableQuantity) * (Number(i.unitValuationBDT) || 850))},"${i.status || 'RECEIVED'}","${i.remarks || 'N/A'}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `amico_regional_depots_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Summary Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl shadow-xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-indigo-500/25">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/30 rounded-xl border border-indigo-500/30">
              <Truck className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Regional Depot Distribution Centers</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                13 Regional Hubs & Head Office Stock Management, Inter-Depot Transfers, and Delivery Confirmations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 bg-slate-800/90 p-4 rounded-xl border border-slate-700/80 shadow-lg shrink-0">
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Total Regional Asset Valuation</div>
            <div className="text-2xl font-extrabold text-indigo-400 font-mono mt-0.5">
              ৳ {totalValuation.toLocaleString()}
            </div>
          </div>
          <div className="w-px h-10 bg-slate-700" />
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Active Depot Batches</div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-0.5">
              {filteredDepotStocks.length}
            </div>
          </div>
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

      {/* Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Product Name, Code, Depot Hub, or Batch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <select
            value={selectedDepotFilter}
            onChange={(e) => setSelectedDepotFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">All Regional Hubs & HQ</option>
            {REGIONAL_DEPOTS.map((d, i) => (
              <option key={i} value={`${d.name} (${d.code})`}>{d.name} [{d.code}]</option>
            ))}
          </select>

          <button
            onClick={fetchDepotInventory}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print PDF
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Manual Stock Entry
          </button>
        </div>
      </div>

      {/* Depot Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" /> Regional Depot Hub Master & Delivery Confirmation
          </h3>
          <span className="text-xs text-slate-500 font-mono">Showing {filteredDepotStocks.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="p-3.5">Product Code & Name</th>
                <th className="p-3.5">Depot Hub Location</th>
                <th className="p-3.5">Batch / Lot No</th>
                <th className="p-3.5 text-right">Available Qty</th>
                <th className="p-3.5 text-right">Unit Valuation (৳)</th>
                <th className="p-3.5">Logistics Remarks</th>
                <th className="p-3.5">Delivery Status</th>
                <th className="p-3.5 text-center">Inter-Depot & Receive Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-400">Loading regional depot stocks from database...</td></tr>
              ) : filteredDepotStocks.length === 0 ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-400">No regional depot records found matching query.</td></tr>
              ) : (
                filteredDepotStocks.map((item, idx) => {
                  const isInTransit = item.status === 'IN_TRANSIT';

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{item.itemName}</div>
                        <div className="font-mono text-[10px] text-slate-400">{item.itemCode}</div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-800">{item.locationName}</td>
                      <td className="p-3.5 font-mono text-slate-600">{item.batchNumber || 'N/A'}</td>
                      <td className="p-3.5 text-right font-bold text-slate-900 font-mono">
                        {Number(item.availableQuantity).toLocaleString()} {item.unit || 'box'}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-600">
                        ৳ {Number(item.unitValuationBDT || 850).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate" title={item.remarks}>
                        {item.remarks || 'Shipped via central logistics.'}
                      </td>
                      <td className="p-3.5">
                        {isInTransit ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[10px]">
                            <AlertTriangle className="w-3 h-3" /> In Transit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Received & Confirmed
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center flex items-center justify-center gap-2">
                        {isInTransit ? (
                          <button
                            onClick={() => handleConfirmReceive(item.id, item.batchNumber)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition text-[11px] font-semibold inline-flex items-center gap-1 shadow-sm animate-pulse cursor-pointer"
                            title="Confirm Arrival & Receive Goods at Depot"
                          >
                            <CheckCheck className="w-3.5 h-3.5" /> Receive
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setSelectedItemForTransfer(item)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                              title="Transfer Stock to another Regional Depot"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" /> Inter-Transfer
                            </button>
                            <button
                              onClick={() => setSelectedItemForPrint(item)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                              title="Print Voucher"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </>
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

      {/* Inter-Depot Transfer Facility Modal (Hub-to-Hub) */}
      {selectedItemForTransfer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" /> Inter-Depot Stock Transfer
              </h3>
              <button onClick={() => setSelectedItemForTransfer(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <p className="font-bold text-slate-900">{selectedItemForTransfer.itemName} ({selectedItemForTransfer.itemCode})</p>
              <p className="text-slate-600">Source Depot Hub: <span className="font-bold text-indigo-600">{selectedItemForTransfer.locationName}</span></p>
              <p className="font-mono text-slate-600">Batch Number: <span className="font-bold text-slate-800">{selectedItemForTransfer.batchNumber}</span></p>
              <p className="text-slate-600">Available Stock at Source: <span className="font-bold text-emerald-600">{selectedItemForTransfer.availableQuantity} {selectedItemForTransfer.unit || 'box'}</span></p>
            </div>

            <form onSubmit={handleInterDepotTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Select Target Destination Depot</label>
                <select
                  value={transferForm.destinationDepot}
                  onChange={(e) => setTransferForm({ ...transferForm, destinationDepot: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer"
                >
                  {REGIONAL_DEPOTS.map((depot, idx) => (
                    <option key={idx} value={`${depot.name} (${depot.code})`}>
                      {depot.name} [{depot.code}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Transfer Quantity</label>
                  <input
                    type="number"
                    required
                    max={selectedItemForTransfer.availableQuantity}
                    placeholder="Enter quantity"
                    value={transferForm.quantity}
                    onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Measurement Unit</label>
                  <select
                    value={transferForm.unit}
                    onChange={(e) => setTransferForm({ ...transferForm, unit: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs cursor-pointer"
                  >
                    <option value="box">box</option>
                    <option value="carton">carton</option>
                    <option value="piece">piece</option>
                    <option value="kg">kg</option>
                    <option value="bottle">bottle</option>
                    <option value="strip">strip</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Inter-Depot Transfer Remarks</label>
                <textarea
                  rows="2"
                  value={transferForm.remarks}
                  onChange={(e) => setTransferForm({ ...transferForm, remarks: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setSelectedItemForTransfer(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md disabled:opacity-50 cursor-pointer">
                  {submitting ? 'Transferring...' : 'Send Stock to Target Depot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Entry Form Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" /> Manual Regional Depot Stock Form
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddDepotStock} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Regional Hub Location</label>
                  <select
                    value={form.depotName}
                    onChange={(e) => setForm({ ...form, depotName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    {REGIONAL_DEPOTS.map((d, i) => (
                      <option key={i} value={`${d.name} (${d.code})`}>{d.name} [{d.code}]</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amiflox 500mg Tablet"
                    value={form.itemName}
                    onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Available Quantity</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={form.availableQuantity}
                    onChange={(e) => setForm({ ...form, availableQuantity: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Measurement Unit</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs cursor-pointer"
                  >
                    <option value="box">box</option>
                    <option value="carton">carton</option>
                    <option value="piece">piece</option>
                    <option value="kg">kg</option>
                    <option value="bottle">bottle</option>
                    <option value="strip">strip</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Unit Price (৳ BDT)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="850.00"
                    value={form.unitValuationBDT}
                    onChange={(e) => setForm({ ...form, unitValuationBDT: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Batch Number</label>
                  <input
                    type="text"
                    required
                    value={form.batchNumber}
                    onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Dispatch Date</label>
                  <input
                    type="date"
                    required
                    value={form.dispatchDate}
                    onChange={(e) => setForm({ ...form, dispatchDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Comprehensive Logistics Remarks</label>
                <textarea
                  rows="3"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md disabled:opacity-50 cursor-pointer">
                  {submitting ? 'Saving...' : 'Save & Sync'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable PDF Voucher Modal */}
      {selectedItemForPrint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6 my-8 print:p-0 print:shadow-none print:w-full">
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900 uppercase">Amico Laboratories Ltd.</h2>
                <p className="text-xs text-slate-600">Regional Distribution Division &bull; {selectedItemForPrint.locationName}</p>
                <p className="text-xs text-slate-500 font-mono mt-1">REGIONAL DEPOT STOCK & LOGISTICS VOUCHER</p>
              </div>
              <div className="text-right font-mono">
                <span className="text-sm font-bold text-indigo-600 block">{selectedItemForPrint.itemCode}</span>
                <span className="text-xs text-slate-500">Date: {new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <p>Product Name: <span className="font-bold text-slate-900">{selectedItemForPrint.itemName}</span></p>
                <p>Hub Location: <span className="font-semibold text-slate-700">{selectedItemForPrint.locationName}</span></p>
                <p>Batch / Lot No: <span className="font-bold font-mono text-indigo-600">{selectedItemForPrint.batchNumber || 'N/A'}</span></p>
                <p>Available Qty: <span className="font-bold text-slate-900">{Number(selectedItemForPrint.availableQuantity).toLocaleString()} {selectedItemForPrint.unit || 'box'}</span></p>
                <p>Unit Valuation: <span className="font-semibold text-slate-900">৳ {Number(selectedItemForPrint.unitValuationBDT || 850).toLocaleString()}</span></p>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <p className="font-semibold uppercase text-[10px] text-slate-500">Logistics Remarks / Transit Notes:</p>
                <p className="text-slate-700 mt-0.5 italic">{selectedItemForPrint.remarks || 'Standard transit stock received and verified at regional hub.'}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-200 print:hidden">
              <button onClick={() => window.print()} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md cursor-pointer">
                <Printer className="w-4 h-4" /> Print PDF Voucher
              </button>
              <button onClick={() => setSelectedItemForPrint(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}