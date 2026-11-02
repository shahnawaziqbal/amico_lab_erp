// InventoryModule.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Boxes, 
  Package, 
  Building2, 
  Truck, 
  ClipboardList, 
  Layers, 
  RefreshCw, 
  Download, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2,
  Printer,
  X,
  FileText,
  DollarSign
} from 'lucide-react';

// Import all sub-tab components matching your exact filenames (with 's')
import RawMaterialsStockTab from './RawMaterialsStockTab';
import PackagingStockTab from './PackagingStockTab';
import FinishedGoodsTab from './FinishedGoodsTab';
import DepotInventoryTab from './DepotInventoryTab';
import InternalRequisitionsTab from './InternalRequisitionsTab';
import MasterCatalogTab from './MasterCatalogTab';

const API_BASE_URL = '';
export default function InventoryModule() {
  const [activeTab, setActiveTab] = useState('RAW_MATERIALS');
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State for New Requisition
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [submittingReq, setSubmittingReq] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [reqForm, setReqForm] = useState({
    requestingDepartment: 'FACTORY_PRODUCTION',
    requestDate: new Date().toISOString().split('T')[0],
    purposeRemarks: 'Urgent departmental replenishment for batch execution.',
    items: [
      { itemCode: '', itemName: '', requestedQty: '', unit: 'kg', category: 'API' }
    ]
  });

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [stockRes, reqRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/inventory/stocks`),
        fetch(`${API_BASE_URL}/inventory/requisitions`)
      ]);

      setStocks(stockRes.status === 'fulfilled' && stockRes.value.ok ? await stockRes.value.json() : []);
      setRequisitions(reqRes.status === 'fulfilled' && reqRes.value.ok ? await reqRes.value.json() : []);
    } catch (err) {
      console.error('Inventory Sync Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Warehouse Datasets (Synchronized with depot component filter logic)
  const rawMaterials = useMemo(() => stocks.filter(s => s?.warehouseType === 'RAW_MATERIALS'), [stocks]);
  const packagingMaterials = useMemo(() => stocks.filter(s => s?.warehouseType === 'PACKAGING_MATERIALS'), [stocks]);
  const finishedGoods = useMemo(() => stocks.filter(s => s?.warehouseType === 'FINISHED_GOODS'), [stocks]);
  const depotStocks = useMemo(() => stocks.filter(s => 
    s?.warehouseType === 'REGIONAL_DEPOT' || 
    s?.locationName?.includes('Depot') || 
    s?.locationName?.includes('Hub') || 
    s?.locationName?.includes('Store')
  ), [stocks]);

  const handleAddReqItem = () => {
    setReqForm({
      ...reqForm,
      items: [...reqForm.items, { itemCode: '', itemName: '', requestedQty: '', unit: 'kg', category: 'API' }]
    });
  };

  const handleRemoveReqItem = (index) => {
    if (reqForm.items.length === 1) return;
    setReqForm({
      ...reqForm,
      items: reqForm.items.filter((_, i) => i !== index)
    });
  };

  const handleReqItemChange = (index, field, value) => {
    const updated = [...reqForm.items];
    updated[index][field] = value;
    setReqForm({ ...reqForm, items: updated });
  };

  const handleCreateRequisition = async (e) => {
    e.preventDefault();
    setSubmittingReq(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/requisitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqForm)
      });

      if (!res.ok) throw new Error('Failed to create internal requisition.');

      setSuccessMsg('Internal requisition successfully submitted & logged.');
      setIsReqModalOpen(false);
      fetchInventoryData();
      setReqForm({
        requestingDepartment: 'FACTORY_PRODUCTION',
        requestDate: new Date().toISOString().split('T')[0],
        purposeRemarks: 'Urgent departmental replenishment for batch execution.',
        items: [{ itemCode: '', itemName: '', requestedQty: '', unit: 'kg', category: 'API' }]
      });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingReq(false);
    }
  };

  const exportInventoryCSV = () => {
    const currentData = activeTab === 'RAW_MATERIALS' ? rawMaterials :
                        activeTab === 'PACKAGING' ? packagingMaterials :
                        activeTab === 'FINISHED_GOODS' ? finishedGoods : depotStocks;

    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Item Code,Item Name,Category,Batch Number,Available Qty,Quarantine Qty,Unit Valuation (BDT)"].join(",") + "\n"
      + currentData.map(i => `"${i?.itemCode || ''}","${i?.itemName || ''}","${i?.category || ''}","${i?.batchNumber || 'N/A'}",${i?.availableQuantity || 0},${i?.quarantineQuantity || 0},${i?.unitValuationBDT || 0}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `amico_inventory_${activeTab.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-16">
      
      {/* Header Command Bar */}
      <div className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                Central Inventory & Warehouse Command
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-normal">
                  Real-Time cGMP Synced
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Multi-Warehouse Matrix &bull; Real-time Stock Valuations &bull; Automated Reorder Triggers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={exportInventoryCSV}
              className="flex items-center gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl transition shadow-md"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV Report
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl transition"
            >
              <Printer className="w-3.5 h-3.5" /> Print PDF View
            </button>
            <button 
              onClick={fetchInventoryData}
              className="flex items-center gap-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              Sync DB
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-2 overflow-x-auto border-t border-slate-800/60 pt-2 no-scrollbar">
          {[
            { id: 'RAW_MATERIALS', label: 'Raw Materials', icon: Boxes, count: rawMaterials.length },
            { id: 'PACKAGING', label: 'Packaging Materials', icon: Package, count: packagingMaterials.length },
            { id: 'FINISHED_GOODS', label: 'Finished Goods', icon: Building2, count: finishedGoods.length },
            { id: 'DEPOT', label: 'Regional Depots', icon: Truck, count: depotStocks.length },
            { id: 'REQUISITIONS', label: 'Internal Requisitions', icon: ClipboardList, count: requisitions.length },
            { id: 'CATALOG', label: 'Item Master Catalog', icon: Layers, count: stocks.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'bg-slate-800/90 text-white border-emerald-500 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        
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
              placeholder="Search by Item Code, Name, or Batch Number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>

          {activeTab === 'REQUISITIONS' && (
            <button
              onClick={() => setIsReqModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md transition"
            >
              <Plus className="w-4 h-4" /> Create Internal Requisition
            </button>
          )}
        </div>

        {/* Dynamic Tab Views */}
        {activeTab === 'RAW_MATERIALS' && (
          <RawMaterialsStockTab />
        )}

        {activeTab === 'PACKAGING' && (
          <PackagingStockTab />
        )}

        {activeTab === 'FINISHED_GOODS' && (
          <FinishedGoodsTab />
        )}

        {activeTab === 'DEPOT' && (
          <DepotInventoryTab />
        )}

        {activeTab === 'CATALOG' && (
          <MasterCatalogTab />
        )}

        {activeTab === 'REQUISITIONS' && (
          <InternalRequisitionsTab />
        )}
      </main>

      {/* Internal Requisition Creation Modal */}
      {isReqModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-600" /> New Internal Requisition Form
              </h3>
              <button onClick={() => setIsReqModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateRequisition} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Requesting Department</label>
                  <select 
                    value={reqForm.requestingDepartment} 
                    onChange={(e) => setReqForm({ ...reqForm, requestingDepartment: e.target.value })} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="FACTORY_PRODUCTION">Factory Production</option>
                    <option value="HEAD_OFFICE_ADMIN">Head Office Administration</option>
                    <option value="DEPOT_LOGISTICS">Depot Logistics</option>
                    <option value="PLANT_MAINTENANCE">Plant Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Request Date</label>
                  <input 
                    type="date" 
                    required 
                    value={reqForm.requestDate} 
                    onChange={(e) => setReqForm({ ...reqForm, requestDate: e.target.value })} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Purpose & Remarks</label>
                <input 
                  type="text" 
                  value={reqForm.purposeRemarks} 
                  onChange={(e) => setReqForm({ ...reqForm, purposeRemarks: e.target.value })} 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" 
                />
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Requested Items</h4>
                  <button type="button" onClick={handleAddReqItem} className="text-xs bg-emerald-50 text-emerald-600 font-semibold px-3 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                {reqForm.items.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 relative">
                    {reqForm.items.length > 1 && (
                      <button type="button" onClick={() => handleRemoveReqItem(idx)} className="absolute right-3 top-3 text-rose-500 hover:text-rose-700" title="Remove Item">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Item Name</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. Paracetamol API / Carton Box" 
                          value={item.itemName} 
                          onChange={(e) => handleReqItemChange(idx, 'itemName', e.target.value)} 
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Category</label>
                        <select 
                          value={item.category} 
                          onChange={(e) => handleReqItemChange(idx, 'category', e.target.value)} 
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="API">API / Raw Material</option>
                          <option value="PACKAGING">Packaging Material</option>
                          <option value="OFFICE_SUPPLIES">Head Office Supplies</option>
                          <option value="FACTORY_CONSUMABLE">Factory Consumable</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Requested Quantity</label>
                        <input 
                          type="number" 
                          required 
                          step="0.01" 
                          placeholder="0.00" 
                          value={item.requestedQty} 
                          onChange={(e) => handleReqItemChange(idx, 'requestedQty', e.target.value)} 
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Unit</label>
                        <select 
                          value={item.unit} 
                          onChange={(e) => handleReqItemChange(idx, 'unit', e.target.value)} 
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        >
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
                <button type="button" onClick={() => setIsReqModalOpen(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium">Cancel</button>
                <button type="submit" disabled={submittingReq} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md disabled:opacity-50">
                  {submittingReq ? 'Submitting Requisition...' : 'Submit Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Reusable Inventory Data Grid Component
function InventoryGrid({ items, title }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
        <span className="text-xs text-slate-500 font-mono">Showing {items.length} records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <th className="p-3.5">Item Code & Name</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Batch / Lot No</th>
              <th className="p-3.5 text-right">Available Qty</th>
              <th className="p-3.5 text-right">Quarantine Qty</th>
              <th className="p-3.5 text-right">Unit Valuation (৳)</th>
              <th className="p-3.5">Stock Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {items.length === 0 ? (
              <tr><td colSpan="7" className="p-8 text-center text-slate-400">No inventory records matching query.</td></tr>
            ) : (
              items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{item.itemName}</div>
                    <div className="font-mono text-[10px] text-slate-400">{item.itemCode}</div>
                  </td>
                  <td className="p-3.5 font-mono text-slate-600">{item.category || 'General'}</td>
                  <td className="p-3.5 font-mono text-slate-600">{item.batchNumber || 'N/A'}</td>
                  <td className="p-3.5 text-right font-bold text-slate-900 font-mono">{Number(item.availableQuantity).toLocaleString()} {item.unit}</td>
                  <td className="p-3.5 text-right font-semibold text-amber-600 font-mono">{Number(item.quarantineQuantity || 0).toLocaleString()} {item.unit}</td>
                  <td className="p-3.5 text-right font-mono font-medium">৳ {Number(item.unitValuationBDT || 0).toLocaleString()}</td>
                  <td className="p-3.5">
                    {Number(item.availableQuantity) <= Number(item.reorderLevel || 100) ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[10px]">
                        <AlertTriangle className="w-3 h-3" /> Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> Optimal
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}