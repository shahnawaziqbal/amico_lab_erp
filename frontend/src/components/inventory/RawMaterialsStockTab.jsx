// RawMaterialsStockTab.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Boxes, 
  Search, 
  RefreshCw, 
  Download, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  X, 
  ShieldCheck,
  FileText
} from 'lucide-react';

const API_BASE_URL = '';

export default function RawMaterialsStockTab() {
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItemForPrint, setSelectedItemForPrint] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    itemCode: `RM-${Math.floor(1000 + Math.random() * 9000)}`,
    itemName: '',
    category: 'API',
    availableQuantity: '',
    quarantineQuantity: '0',
    reorderLevel: '200',
    unit: 'kg',
    unitValuationBDT: '',
    batchNumber: `BATCH-2026-${Math.floor(100 + Math.random() * 900)}`,
    poNumber: 'PO-2026-001',
    vendorName: 'Certified Supplier',
    remarks: 'Received via PO & cGMP quarantine gate. Verified against supplier CoA.'
  });

  useEffect(() => {
    fetchRawMaterials();
  }, []);

  const fetchRawMaterials = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch(`${API_BASE_URL}/inventory/stocks`);
      if (!res.ok) throw new Error('Failed to fetch raw materials inventory.');
      
      const data = await res.json();
      const rmList = data.filter(s => s.warehouseType === 'RAW_MATERIALS');
      setRawMaterials(rmList);
    } catch (err) {
      console.error('Raw materials fetch error:', err);
      setErrorMsg('Could not load purchase-order-driven raw materials inventory records.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = useMemo(() => {
    return rawMaterials.filter(item => 
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.batchNumber && item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [rawMaterials, searchTerm]);

  const totalValuation = useMemo(() => {
    return filteredMaterials.reduce((sum, item) => sum + ((Number(item.availableQuantity) || 0) * (Number(item.unitValuationBDT) || 0)), 0);
  }, [filteredMaterials]);

  const handleAddRawMaterial = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        warehouseType: 'RAW_MATERIALS',
        itemCode: form.itemCode,
        itemName: form.itemName,
        category: form.category,
        quantity: parseFloat(form.availableQuantity) || 0,
        quarantineQuantity: parseFloat(form.quarantineQuantity) || 0,
        reorderLevel: parseFloat(form.reorderLevel) || 200,
        unit: form.unit,
        unitValuationBDT: parseFloat(form.unitValuationBDT) || 500,
        batchNumber: form.batchNumber,
        poNumber: form.poNumber,
        vendorName: form.vendorName,
        remarks: form.remarks
      };

      const res = await fetch(`${API_BASE_URL}/inventory/receive-qc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to record raw material lot.');

      setSuccessMsg(`Successfully received batch ${form.batchNumber} for ${form.itemName}!`);
      setIsAddModalOpen(false);
      fetchRawMaterials();

      setForm({
        itemCode: `RM-${Math.floor(1000 + Math.random() * 9000)}`,
        itemName: '',
        category: 'API',
        availableQuantity: '',
        quarantineQuantity: '0',
        reorderLevel: '200',
        unit: 'kg',
        unitValuationBDT: '',
        batchNumber: `BATCH-2026-${Math.floor(100 + Math.random() * 900)}`,
        poNumber: 'PO-2026-001',
        vendorName: 'Certified Supplier',
        remarks: 'Received via PO & cGMP quarantine gate. Verified against supplier CoA.'
      });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Item Code,Material Name,Category,Batch Number,Available Qty,Quarantine Qty,Unit,Unit Valuation (BDT),Total Value (BDT),Remarks"].join(",") + "\n"
      + filteredMaterials.map(i => `"${i.itemCode}","${i.itemName}","${i.category}","${i.batchNumber || 'N/A'}",${i.availableQuantity},${i.quarantineQuantity || 0},"${i.unit}",${i.unitValuationBDT || 0},${(i.availableQuantity * (i.unitValuationBDT || 0))},"${i.remarks || 'N/A'}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `amico_po_raw_materials_${new Date().toISOString().split('T')[0]}.csv`);
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
              <Boxes className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Raw Materials Warehouse (PO & QC Synced)</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Dynamic purchase order-driven active pharmaceutical ingredients and excipient balances.
              </p>
            </div>
          </div>
        </div>

        {/* Valuation Metrics Pill */}
        <div className="flex items-center gap-6 bg-slate-800/90 p-4 rounded-xl border border-slate-700/80 shadow-lg shrink-0">
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Total Raw Material Valuation</div>
            <div className="text-2xl font-extrabold text-indigo-400 font-mono mt-0.5">
              ৳ {totalValuation.toLocaleString()}
            </div>
          </div>
          <div className="w-px h-10 bg-slate-700" />
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Active PO Lots</div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-0.5">
              {filteredMaterials.length}
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
            placeholder="Search by Material Name, Code, or Batch Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchRawMaterials}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2.5 rounded-xl font-semibold text-xs transition"
            title="Refresh PO Sync"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh PO Sync
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
            <Printer className="w-3.5 h-3.5" /> Print PDF Report
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Receive PO Lot
          </button>
        </div>
      </div>

      {/* Raw Materials Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Boxes className="w-4 h-4 text-indigo-600" /> Purchase Order & QC-Passed Raw Materials Ledger
          </h3>
          <span className="text-xs text-slate-500 font-mono">Showing {filteredMaterials.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="p-3.5">Material Code & Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Batch / Lot No</th>
                <th className="p-3.5 text-right">Available Qty</th>
                <th className="p-3.5 text-right">Quarantine Qty</th>
                <th className="p-3.5 text-right">Unit Valuation (৳)</th>
                <th className="p-3.5 text-right">Total Valuation (৳)</th>
                <th className="p-3.5">PO & QC Remarks</th>
                <th className="p-3.5">Stock Status</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr><td colSpan="10" className="p-8 text-center text-slate-400">Syncing raw materials from purchase orders...</td></tr>
              ) : filteredMaterials.length === 0 ? (
                <tr><td colSpan="10" className="p-8 text-center text-slate-400">No raw material lots found from purchase orders yet. Receive items via PO or QC approval.</td></tr>
              ) : (
                filteredMaterials.map((item, idx) => {
                  const val = (Number(item.availableQuantity) || 0) * (Number(item.unitValuationBDT) || 0);
                  const isLow = Number(item.availableQuantity) <= Number(item.reorderLevel || 200);

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{item.itemName}</div>
                        <div className="font-mono text-[10px] text-slate-400">{item.itemCode}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">{item.category || 'API'}</td>
                      <td className="p-3.5 font-mono text-slate-600">{item.batchNumber || 'N/A'}</td>
                      <td className="p-3.5 text-right font-bold text-slate-900 font-mono">
                        {Number(item.availableQuantity).toLocaleString()} {item.unit || 'kg'}
                      </td>
                      <td className="p-3.5 text-right font-semibold text-amber-600 font-mono">
                        {Number(item.quarantineQuantity || 0).toLocaleString()} {item.unit || 'kg'}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-600">
                        ৳ {Number(item.unitValuationBDT || 0).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-indigo-700">
                        ৳ {val.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate" title={item.remarks}>
                        {item.remarks || 'Linked to Purchase Order.'}
                      </td>
                      <td className="p-3.5">
                        {item.status === 'IN_QUARANTINE' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[10px]">
                            <AlertTriangle className="w-3 h-3" /> In Quarantine
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[10px]">
                            <AlertTriangle className="w-3 h-3" /> Reorder Level
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Optimal Stock
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setSelectedItemForPrint(item)}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition text-xs font-semibold inline-flex items-center gap-1"
                          title="Print Printable PDF Voucher"
                        >
                          <FileText className="w-3.5 h-3.5" /> Voucher
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual PO Lot Receiving Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" /> Receive Purchase Order Lot & QC Approval
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddRawMaterial} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Purchase Order (PO) No</label>
                  <input
                    type="text"
                    required
                    value={form.poNumber}
                    onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Supplier / Vendor Name</label>
                  <input
                    type="text"
                    required
                    value={form.vendorName}
                    onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Material Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zinc Oxide / Paracetamol API"
                    value={form.itemName}
                    onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Category Subtype</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="API">API (Active Pharmaceutical Ingredient)</option>
                    <option value="EXCIPIENT">Excipient / Chemical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Received Qty</label>
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
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Unit</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="kg">kg</option>
                    <option value="liters">liters</option>
                    <option value="drums">drums</option>
                    <option value="bags">bags</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Unit Price (৳ BDT)</label>
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Batch / Lot Number</label>
                  <input
                    type="text"
                    required
                    value={form.batchNumber}
                    onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    required
                    value={form.reorderLevel}
                    onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Operational Remarks & QC Inspection Notes</label>
                <textarea
                  rows="3"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md disabled:opacity-50">
                  {submitting ? 'Recording Lot...' : 'Receive & Sync PO Lot'}
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
                <p className="text-xs text-slate-600">Birulia, Savar, Dhaka &bull; cGMP Warehouse Division</p>
                <p className="text-xs text-slate-500 font-mono mt-1">PURCHASE ORDER RAW MATERIAL RECEIVING VOUCHER</p>
              </div>
              <div className="text-right font-mono">
                <span className="text-sm font-bold text-indigo-600 block">{selectedItemForPrint.itemCode}</span>
                <span className="text-xs text-slate-500">Date: {new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <p>Material Name: <span className="font-bold text-slate-900">{selectedItemForPrint.itemName}</span></p>
                <p>Category: <span className="font-semibold text-slate-700">{selectedItemForPrint.category}</span></p>
                <p>Batch / Lot No: <span className="font-bold font-mono text-indigo-600">{selectedItemForPrint.batchNumber || 'N/A'}</span></p>
                <p>Available Qty: <span className="font-bold text-slate-900">{Number(selectedItemForPrint.availableQuantity).toLocaleString()} {selectedItemForPrint.unit}</span></p>
                <p>Unit Valuation: <span className="font-semibold text-slate-900">৳ {Number(selectedItemForPrint.unitValuationBDT || 0).toLocaleString()}</span></p>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <p className="font-semibold uppercase text-[10px] text-slate-500">PO & QC Remarks:</p>
                <p className="text-slate-700 mt-0.5 italic">{selectedItemForPrint.remarks || 'Synced from purchase order.'}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-200 print:hidden">
              <button onClick={() => window.print()} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md">
                <Printer className="w-4 h-4" /> Print PDF Voucher
              </button>
              <button onClick={() => setSelectedItemForPrint(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}