// FinishedGoodsTab.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  RefreshCw, 
  Download, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  X, 
  Package, 
  FileText,
  Send,
  MapPin,
  QrCode,
  Radio
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

export default function FinishedGoodsTab() {
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItemForPrint, setSelectedItemForPrint] = useState(null);
  const [selectedItemForTransfer, setSelectedItemForTransfer] = useState(null);
  const [selectedItemForQr, setSelectedItemForQr] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Comprehensive Form State
  const [form, setForm] = useState({
    itemCode: `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
    itemName: '',
    category: 'FINISHED_GOOD',
    availableQuantity: '',
    unit: 'box',
    unitValuationBDT: '',
    batchNumber: `BMR-2026-${Math.floor(100 + Math.random() * 900)}`,
    expiryDate: '',
    remarks: 'Manufactured under standard BMR protocol. Passed final QA release and ready for central warehouse distribution.'
  });

  // Dispatch Form State for 13 Depots & HQ
  const [transferForm, setTransferForm] = useState({
    destinationDepot: 'Dhaka Central Depot (DK)',
    quantity: '',
    unit: 'box',
    remarks: 'Dispatching batch stock to regional depot.'
  });

  useEffect(() => {
    fetchFinishedGoods();
  }, []);

  const fetchFinishedGoods = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch(`${API_BASE_URL}/inventory/stocks`);
      if (!res.ok) throw new Error('Failed to fetch finished goods inventory.');
      
      const data = await res.json();
      
      // Filter for Finished Goods only and sort with newest records on top
      const fgList = data
        .filter(s => s.warehouseType === 'FINISHED_GOODS' || s.category === 'FINISHED_GOOD' || s.category === 'FINISHED_GOODS')
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setFinishedGoods(fgList);
    } catch (err) {
      console.error('Finished goods fetch error:', err);
      setErrorMsg('Could not load finished goods inventory records.');
    } finally {
      setLoading(false);
    }
  };

  const filteredGoods = useMemo(() => {
    return finishedGoods.filter(item => 
      (item.itemName && item.itemName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.itemCode && item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.batchNumber && item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.rfid && item.rfid.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [finishedGoods, searchTerm]);

  const totalValuation = useMemo(() => {
    return filteredGoods.reduce((sum, item) => sum + ((Number(item.availableQuantity) || 0) * (Number(item.unitValuationBDT) || 0)), 0);
  }, [filteredGoods]);

  const handleAddFinishedGood = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        warehouseType: 'FINISHED_GOODS',
        itemCode: form.itemCode,
        itemName: form.itemName,
        category: form.category,
        quantity: parseFloat(form.availableQuantity) || 0,
        unit: form.unit,
        unitValuationBDT: parseFloat(form.unitValuationBDT) || 500,
        batchNumber: form.batchNumber,
        remarks: form.remarks
      };

      const res = await fetch(`${API_BASE_URL}/inventory/receive-qc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to record finished goods stock.');

      setSuccessMsg(`Successfully registered batch ${form.batchNumber} for ${form.itemName}!`);
      setIsAddModalOpen(false);
      fetchFinishedGoods();

      setForm({
        itemCode: `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
        itemName: '',
        category: 'FINISHED_GOOD',
        availableQuantity: '',
        unit: 'box',
        unitValuationBDT: '',
        batchNumber: `BMR-2026-${Math.floor(100 + Math.random() * 900)}`,
        expiryDate: '',
        remarks: 'Manufactured under standard BMR protocol. Passed final QA release and ready for central warehouse distribution.'
      });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferToDepot = async (e) => {
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
        remarks: transferForm.remarks
      };

      const res = await fetch(`${API_BASE_URL}/inventory/transfer-depot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to dispatch stock to regional depot.');

      setSuccessMsg(`Successfully dispatched ${transferForm.quantity} ${transferForm.unit} of batch ${selectedItemForTransfer.batchNumber} to ${transferForm.destinationDepot}!`);
      setSelectedItemForTransfer(null);
      fetchFinishedGoods();
    } catch (err) {
      setErrorMsg(err.message || 'Transfer failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Item Code,Product Name,Date Posted,Category,Batch/Lot No,RFID Tag,Available Qty,Unit,Unit Valuation (BDT),Total Value (BDT),Remarks"].join(",") + "\n"
      + filteredGoods.map(i => `"${i.itemCode}","${i.itemName}","${i.createdAt || 'N/A'}","${i.category}","${i.batchNumber || 'N/A'}","${i.rfid || 'N/A'}",${i.availableQuantity},"${i.unit || 'box'}",${i.unitValuationBDT || 0},${(Number(i.availableQuantity) * Number(i.unitValuationBDT || 0))},"${i.remarks || 'N/A'}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `amico_finished_goods_inventory_${new Date().toISOString().split('T')[0]}.csv`);
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
              <Building2 className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Finished Goods Central Warehouse & Distribution</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Real-time cGMP batch completion logs, RFID/QR tracking, valuations, and 13 Regional Depot Dispatches.
              </p>
            </div>
          </div>
        </div>

        {/* Valuation Metrics Pill */}
        <div className="flex items-center gap-6 bg-slate-800/90 p-4 rounded-xl border border-slate-700/80 shadow-lg shrink-0">
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Total Central FG Valuation</div>
            <div className="text-2xl font-extrabold text-indigo-400 font-mono mt-0.5">
              ৳ {totalValuation.toLocaleString()}
            </div>
          </div>
          <div className="w-px h-10 bg-slate-700" />
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Active Batches</div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-0.5">
              {filteredGoods.length}
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
            placeholder="Search by Product, Code, Batch, or RFID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchFinishedGoods}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Refresh Stock List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md transition"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl font-semibold text-xs transition"
          >
            <Printer className="w-3.5 h-3.5" /> Print PDF
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Manual Entry Form
          </button>
        </div>
      </div>

      {/* Finished Goods Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-600" /> Finished Goods Inventory Master (Sorted: Most Recent First)
          </h3>
          <span className="text-xs text-slate-500 font-mono">Showing {filteredGoods.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="p-3.5">Product & Code</th>
                <th className="p-3.5">Completion Timestamp</th>
                <th className="p-3.5">Batch / Lot No</th>
                <th className="p-3.5">RFID / Smart Tag</th>
                <th className="p-3.5 text-right">Available Qty</th>
                <th className="p-3.5 text-right">Unit Valuation (৳)</th>
                <th className="p-3.5 text-center">Dispatch & Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-slate-400">Loading finished goods from SQLite database...</td></tr>
              ) : filteredGoods.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-slate-400">No finished goods records found. Complete a BMR batch production to automatically populate this table.</td></tr>
              ) : (
                filteredGoods.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{item.itemName}</div>
                      <div className="font-mono text-[10px] text-slate-400">{item.itemCode}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 text-[11px]">
                      {item.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="p-3.5 font-mono text-indigo-600 font-bold">{item.batchNumber || 'N/A'}</td>
                    <td className="p-3.5 font-mono text-slate-500 text-[11px] flex items-center gap-1">
                      <Radio className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span>{item.rfid || `RFID-${item.batchNumber}`}</span>
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900 font-mono">
                      {Number(item.availableQuantity || 0).toLocaleString()} {item.unit || 'box'}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-700 font-medium">
                      ৳ {Number(item.unitValuationBDT || 500).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedItemForTransfer(item)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition text-[11px] font-semibold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                        title="Dispatch Stock to Regional Depots or Head Office"
                      >
                        <Send className="w-3 h-3" /> Send to Depot
                      </button>
                      <button
                        onClick={() => setSelectedItemForQr(item)}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition cursor-pointer"
                        title="View RFID & QR Payload"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedItemForPrint(item)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                        title="Print Release Voucher"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regional Depots & Head Office Dispatch Modal */}
      {selectedItemForTransfer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" /> Dispatch Stock to Regional Depot
              </h3>
              <button onClick={() => setSelectedItemForTransfer(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <p className="font-bold text-slate-900">{selectedItemForTransfer.itemName} ({selectedItemForTransfer.itemCode})</p>
              <div className="flex justify-between text-slate-600 font-mono">
                <span>Batch / Lot No: <strong className="text-indigo-600">{selectedItemForTransfer.batchNumber}</strong></span>
                <span>RFID: <strong className="text-slate-800">{selectedItemForTransfer.rfid || `RFID-${selectedItemForTransfer.batchNumber}`}</strong></span>
              </div>
              <p className="text-slate-600">Available Central Stock: <span className="font-bold text-slate-900">{selectedItemForTransfer.availableQuantity} {selectedItemForTransfer.unit || 'box'}</span></p>
            </div>

            <form onSubmit={handleTransferToDepot} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Select Destination Depot (13 Hubs + Head Office)</label>
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
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Quantity to Send</label>
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
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Dispatch Notes & Logistics Remarks</label>
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
                  {submitting ? 'Dispatching...' : 'Confirm & Send to Depot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR & RFID Verification Inspection Modal */}
      {selectedItemForQr && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-400">
                <QrCode className="w-4 h-4" /> cGMP Batch Traceability Verification
              </h3>
              <button onClick={() => setSelectedItemForQr(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="flex flex-col items-center bg-white p-4 rounded-xl text-black">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(selectedItemForQr.qrPayload || JSON.stringify({ batch: selectedItemForQr.batchNumber, item: selectedItemForQr.itemName }))}`} 
                alt="Batch QR Code" 
                className="w-40 h-40 object-contain"
              />
              <span className="font-mono text-xs font-bold mt-2 text-slate-900">{selectedItemForQr.batchNumber}</span>
              <span className="font-mono text-[9px] text-slate-500 tracking-widest mt-0.5">║▌║█║▌│║▌║▌█║</span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs font-mono space-y-1">
              <p className="text-indigo-300">RFID: <span className="text-white font-bold">{selectedItemForQr.rfid || `RFID-${selectedItemForQr.batchNumber}`}</span></p>
              <p className="text-slate-400">Product: <span className="text-white">{selectedItemForQr.itemName}</span></p>
              <p className="text-slate-400">Manufactured Date: <span className="text-white">{selectedItemForQr.createdAt}</span></p>
            </div>

            <button onClick={() => setSelectedItemForQr(null)} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer">
              Close Inspection
            </button>
          </div>
        </div>
      )}

      {/* Manual Entry Form Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" /> Manual Finished Goods Entry Form
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddFinishedGood} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Product Code</label>
                  <input
                    type="text"
                    required
                    value={form.itemCode}
                    onChange={(e) => setForm({ ...form, itemCode: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amicoxib 90mg Tablet"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Unit Valuation (৳ BDT)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="500.00"
                    value={form.unitValuationBDT}
                    onChange={(e) => setForm({ ...form, unitValuationBDT: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">BMR Batch Number</label>
                  <input
                    type="text"
                    required
                    value={form.batchNumber}
                    onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Operational Remarks & QA Notes</label>
                <textarea
                  rows="2"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
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

      {/* Printable Voucher Modal */}
      {selectedItemForPrint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl space-y-6">
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900 uppercase">Amico Laboratories Ltd.</h2>
                <p className="text-xs text-slate-600">Birulia, Savar, Dhaka &bull; Central Warehouse</p>
                <p className="text-xs text-slate-500 font-mono mt-1">FINISHED GOODS BATCH RELEASE VOUCHER</p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-2">
              <p>Product: <span className="font-bold">{selectedItemForPrint.itemName}</span> ({selectedItemForPrint.itemCode})</p>
              <p>Batch / Lot: <span className="font-mono font-bold text-indigo-600">{selectedItemForPrint.batchNumber}</span></p>
              <p>RFID Tag: <span className="font-mono">{selectedItemForPrint.rfid || `RFID-${selectedItemForPrint.batchNumber}`}</span></p>
              <p>Date Posted: <span className="font-mono">{selectedItemForPrint.createdAt}</span></p>
              <p>Quantity: <span className="font-bold">{selectedItemForPrint.availableQuantity} {selectedItemForPrint.unit}</span></p>
              <p>Unit Valuation: <span className="font-bold">৳ {selectedItemForPrint.unitValuationBDT}</span></p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer">Print Voucher</button>
              <button onClick={() => setSelectedItemForPrint(null)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}