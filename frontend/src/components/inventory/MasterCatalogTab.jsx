import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, 
  Search, 
  RefreshCw, 
  Download, 
  Printer, 
  Plus, 
  X, 
  Boxes, 
  Package, 
  Building2, 
  Tag, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  FileSpreadsheet,
  FileText 
} from 'lucide-react';

const API_BASE_URL = '';

export default function MasterCatalogTab() {
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');

  // Modal State for Adding New Catalog Item & Printing Voucher
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItemForPrint, setSelectedItemForPrint] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    itemCode: `ITEM-${Math.floor(1000 + Math.random() * 9000)}`,
    itemName: '',
    category: 'API',
    warehouseType: 'RAW_MATERIALS',
    locationName: 'Birulia Central Store',
    availableQuantity: '',
    reorderLevel: '100',
    unit: 'kg',
    unitValuationBDT: '',
    batchNumber: `LOT-2026-${Math.floor(100 + Math.random() * 900)}`,
    remarks: 'Registered into master item catalog. Verified against enterprise pharmaceutical standards.'
  });

  useEffect(() => {
    fetchCatalogItems();
  }, []);

  const fetchCatalogItems = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch(`${API_BASE_URL}/inventory/stocks`);
      if (!res.ok) throw new Error('Failed to fetch item master catalog.');

      const data = await res.json();
      setCatalogItems(data);
    } catch (err) {
      console.error('Catalog fetch error:', err);
      setErrorMsg('Could not load item master catalog from backend.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered Catalog Items & Summary Metrics
  const filteredCatalog = useMemo(() => {
    return catalogItems.filter(item => {
      const matchesSearch = item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.batchNumber && item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
      const matchesWarehouse = warehouseFilter === 'ALL' || item.warehouseType === warehouseFilter;

      return matchesSearch && matchesCategory && matchesWarehouse;
    });
  }, [catalogItems, searchTerm, categoryFilter, warehouseFilter]);

  const totalCatalogValuation = useMemo(() => {
    return filteredCatalog.reduce((sum, item) => sum + ((Number(item.availableQuantity) || 0) * (Number(item.unitValuationBDT) || 0)), 0);
  }, [filteredCatalog]);

  const handleAddCatalogItem = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        warehouseType: form.warehouseType,
        locationName: form.locationName,
        itemCode: form.itemCode,
        itemName: form.itemName,
        category: form.category,
        quantity: parseFloat(form.availableQuantity) || 0,
        reorderLevel: parseFloat(form.reorderLevel) || 100,
        unit: form.unit,
        unitValuationBDT: parseFloat(form.unitValuationBDT) || 0,
        batchNumber: form.batchNumber || `LOT-2026-${Math.floor(100 + Math.random() * 900)}`,
        remarks: form.remarks
      };

      const res = await fetch(`${API_BASE_URL}/inventory/receive-qc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to register item in catalog.');

      setSuccessMsg(`Successfully registered ${form.itemName} (${form.itemCode}) into Master Catalog!`);
      setIsAddModalOpen(false);
      fetchCatalogItems();

      setForm({
        itemCode: `ITEM-${Math.floor(1000 + Math.random() * 9000)}`,
        itemName: '',
        category: 'API',
        warehouseType: 'RAW_MATERIALS',
        locationName: 'Birulia Central Store',
        availableQuantity: '',
        reorderLevel: '100',
        unit: 'kg',
        unitValuationBDT: '',
        batchNumber: `LOT-2026-${Math.floor(100 + Math.random() * 900)}`,
        remarks: 'Registered into master item catalog. Verified against enterprise pharmaceutical standards.'
      });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const exportCatalogCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Item Code,Item Name,Category,Warehouse,Location,Available Qty,Unit,Reorder Level,Unit Price (BDT),Total Valuation (BDT),Remarks"].join(",") + "\n"
      + filteredCatalog.map(i => `"${i.itemCode}","${i.itemName}","${i.category || 'GENERAL'}","${i.warehouseType}","${i.locationName || 'Main Store'}",${i.availableQuantity},"${i.unit}",${i.reorderLevel || 0},${i.unitValuationBDT || 0},${(i.availableQuantity * (i.unitValuationBDT || 0))},"${i.remarks || 'N/A'}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `amico_master_item_catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Metrics Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl shadow-xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-indigo-500/25">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/30 rounded-xl border border-indigo-500/30">
              <Layers className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Enterprise Master Item Catalog</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Centralized database of all active Raw Materials (APIs), Packaging Materials, Finished Goods, and operational logs.
              </p>
            </div>
          </div>
        </div>

        {/* Valuation Metrics Pill */}
        <div className="flex items-center gap-6 bg-slate-800/90 p-4 rounded-xl border border-slate-700/80 shadow-lg shrink-0">
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Catalog Asset Valuation</div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-0.5">
              ৳ {totalCatalogValuation.toLocaleString()}
            </div>
          </div>
          <div className="w-px h-10 bg-slate-700" />
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Total SKUs Registered</div>
            <div className="text-2xl font-extrabold text-indigo-400 font-mono mt-0.5">
              {filteredCatalog.length}
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
            placeholder="Search catalog by Code, Name, Category, or Batch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Warehouses</option>
            <option value="RAW_MATERIALS">Raw Materials Store</option>
            <option value="PACKAGING_MATERIALS">Packaging Store</option>
            <option value="FINISHED_GOODS">Finished Goods Store</option>
            <option value="REGIONAL_DEPOT">Regional Depots</option>
          </select>

          <button
            onClick={exportCatalogCSV}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-xl font-semibold text-xs shadow-md transition"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition"
          >
            <Printer className="w-3.5 h-3.5" /> Print PDF Report
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Comprehensive Entry Form
          </button>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> Master Item Register
          </h3>
          <span className="text-xs text-slate-500 font-mono">Showing {filteredCatalog.length} items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="p-3.5">SKU Code & Name</th>
                <th className="p-3.5">Warehouse Node</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 text-right">Stock Level</th>
                <th className="p-3.5 text-right">Unit Valuation (৳)</th>
                <th className="p-3.5 text-right">Asset Valuation (৳)</th>
                <th className="p-3.5">Operational Remarks</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr><td colSpan="9" className="p-8 text-center text-slate-400">Loading catalog from database...</td></tr>
              ) : filteredCatalog.length === 0 ? (
                <tr><td colSpan="9" className="p-8 text-center text-slate-400">No catalog records found matching query.</td></tr>
              ) : (
                filteredCatalog.map((item, idx) => {
                  const totalVal = (Number(item.availableQuantity) || 0) * (Number(item.unitValuationBDT) || 0);
                  const isLow = Number(item.availableQuantity) <= Number(item.reorderLevel || 100);

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{item.itemName}</div>
                        <div className="font-mono text-[10px] text-slate-400">{item.itemCode}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-medium text-slate-800 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-indigo-500" /> {item.warehouseType?.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">{item.locationName || 'Main Store'}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-700 text-[10px]">
                          {item.category || 'GENERAL'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900 font-mono">
                        {Number(item.availableQuantity).toLocaleString()} {item.unit}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-600">
                        ৳ {Number(item.unitValuationBDT || 0).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                        ৳ {totalVal.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate" title={item.remarks}>
                        {item.remarks || 'Standard catalog SKU registered.'}
                      </td>
                      <td className="p-3.5">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[10px]">
                            <AlertTriangle className="w-3 h-3" /> Below Reorder
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Active
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

      {/* Comprehensive Entry Form Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" /> Comprehensive Master Item SKU Registration Form
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddCatalogItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">SKU Item Code</label>
                  <input
                    type="text"
                    required
                    value={form.itemCode}
                    onChange={(e) => setForm({ ...form, itemCode: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Item Description / Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ciprofloxacin API / Blister Packaging"
                    value={form.itemName}
                    onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Target Warehouse Store</label>
                  <select
                    value={form.warehouseType}
                    onChange={(e) => setForm({ ...form, warehouseType: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                  >
                    <option value="RAW_MATERIALS">Raw Materials Warehouse</option>
                    <option value="PACKAGING_MATERIALS">Packaging Store</option>
                    <option value="FINISHED_GOODS">Finished Goods Depot</option>
                    <option value="REGIONAL_DEPOT">Regional Depot</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Material Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                  >
                    <option value="API">API / Active Ingredient</option>
                    <option value="EXCIPIENT">Excipient / Chemical</option>
                    <option value="FOIL">Aluminium Foil / Blister</option>
                    <option value="CARTON">Packaging Carton Box</option>
                    <option value="FINISHED_GOOD">Finished Product SKU</option>
                    <option value="OFFICE_SUPPLIES">Head Office / Plant Supply</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Initial Quantity</label>
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
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    required
                    placeholder="100"
                    value={form.reorderLevel}
                    onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
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
                    <option value="pcs">pcs</option>
                    <option value="box">box</option>
                    <option value="liters">liters</option>
                    <option value="rolls">rolls</option>
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
                    placeholder="0.00"
                    value={form.unitValuationBDT}
                    onChange={(e) => setForm({ ...form, unitValuationBDT: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
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
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Comprehensive Operational Remarks & Specification Notes</label>
                <textarea
                  rows="3"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Enter detailed catalog specifications, compliance notes, or storage instructions..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md disabled:opacity-50">
                  {submitting ? 'Registering...' : 'Save & Register SKU to Catalog'}
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
                <p className="text-xs text-slate-600">Enterprise Master Catalog Division &bull; {selectedItemForPrint.warehouseType?.replace(/_/g, ' ')}</p>
                <p className="text-xs text-slate-500 font-mono mt-1">MASTER ITEM CATALOG REGISTRATION VOUCHER</p>
              </div>
              <div className="text-right font-mono">
                <span className="text-sm font-bold text-indigo-600 block">{selectedItemForPrint.itemCode}</span>
                <span className="text-xs text-slate-500">Date: {new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <p>Item Name: <span className="font-bold text-slate-900">{selectedItemForPrint.itemName}</span></p>
                <p>Category: <span className="font-semibold text-slate-700">{selectedItemForPrint.category}</span></p>
                <p>Warehouse Node: <span className="font-semibold text-slate-700">{selectedItemForPrint.warehouseType}</span></p>
                <p>Batch / Lot No: <span className="font-bold font-mono text-indigo-600">{selectedItemForPrint.batchNumber || 'N/A'}</span></p>
                <p>Stock Level: <span className="font-bold text-slate-900">{Number(selectedItemForPrint.availableQuantity).toLocaleString()} {selectedItemForPrint.unit}</span></p>
                <p>Unit Valuation: <span className="font-semibold text-slate-900">৳ {Number(selectedItemForPrint.unitValuationBDT || 0).toLocaleString()}</span></p>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <p className="font-semibold uppercase text-[10px] text-slate-500">Operational Remarks / Specifications:</p>
                <p className="text-slate-700 mt-0.5 italic">{selectedItemForPrint.remarks || 'Standard master catalog registration verified.'}</p>
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