import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Package, 
  Trash2, 
  X, 
  Download,
  Printer
} from 'lucide-react';

const API_BASE_URL = '';

export default function PurchaseOrderTab() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Master Data Options fetched from database seeding
  const [vendorList, setVendorList] = useState([]);
  const [rawMaterialsList, setRawMaterialsList] = useState([]);
  const [packMaterialsList, setPackMaterialsList] = useState([]);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPoForPrint, setSelectedPoForPrint] = useState(null); // PO Voucher Print Preview Modal
  const [selectedPoItems, setSelectedPoItems] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // System Date Helper
  const getSystemDate = () => new Date().toISOString().split('T')[0];

  // New PO Form State with Dynamic System Date
  const [formData, setFormData] = useState({
    poNumber: `AMICO-PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    vendorName: '',
    vendorType: 'LOCAL',
    orderDate: getSystemDate(),
    expectedDeliveryDate: getSystemDate(),
    paymentTerms: 'NET_30',
    remarks: 'Deliver to Birulia Plant Store in cGMP Compliant Sealed Packaging.',
    items: [
      {
        materialCategory: 'RAW_MATERIAL',
        materialSubtype: 'API',
        itemName: '',
        quantity: '',
        unit: 'kg',
        unitPrice: ''
      }
    ]
  });

  useEffect(() => {
    fetchPurchaseOrders();
    fetchMasterData();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/procurement/orders`);
      if (!res.ok) throw new Error('Failed to fetch purchase orders from backend.');
      const data = await res.json();
      setPurchaseOrders(data);
    } catch (err) {
      console.error(err);
      setErrorMessage('Could not load purchase orders. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [vendorsRes, rawMatRes, packMatRes] = await Promise.all([
        fetch(`${API_BASE_URL}/procurement/suppliers/master`),
        fetch(`${API_BASE_URL}/procurement/materials/master?category=RAW_MATERIAL`),
        fetch(`${API_BASE_URL}/procurement/materials/master?category=PACKAGING_MATERIAL`)
      ]);

      const vendors = vendorsRes.ok ? await vendorsRes.json() : [];
      const rawMats = rawMatRes.ok ? await rawMatRes.json() : [];
      const packMats = packMatRes.ok ? await packMatRes.json() : [];

      setVendorList(vendors);
      setRawMaterialsList(rawMats);
      setPackMaterialsList(packMats);
    } catch (err) {
      console.error('Error loading master dataset dropdowns:', err);
    }
  };

  const handleAddItemRow = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          materialCategory: 'RAW_MATERIAL',
          materialSubtype: 'API',
          itemName: '',
          quantity: '',
          unit: 'kg',
          unitPrice: ''
        }
      ]
    });
  };

  const handleRemoveItemRow = (index) => {
    if (formData.items.length === 1) return;
    const updated = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updated });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;

    // Auto-populate unit if item is matched from database master lists
    if (field === 'itemName') {
      const category = updated[index].materialCategory;
      const matList = category === 'PACKAGING_MATERIAL' ? packMaterialsList : rawMaterialsList;
      const matched = matList.find(m => (m.name || m.itemName || m['Material Name']) === value);
      if (matched && matched.unit) {
        updated[index].unit = matched.unit.toLowerCase().includes('kg') ? 'kg' :
                             matched.unit.toLowerCase().includes('lit') ? 'liters' :
                             matched.unit.toLowerCase().includes('pc') ? 'pcs' : 'rolls';
      }
    }

    setFormData({ ...formData, items: updated });
  };

  const handleSubmitPO = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        ...formData,
        items: formData.items.map(item => ({
          ...item,
          quantity: parseFloat(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0
        }))
      };

      const res = await fetch(`${API_BASE_URL}/procurement/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create Purchase Order.');
      }

      setSuccessMessage('Purchase Order successfully created & synced with GL Accounts Payable (21100)!');
      setIsCreateModalOpen(false);
      fetchPurchaseOrders();
      fetchMasterData(); 
      
      setFormData({
        poNumber: `AMICO-PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        vendorName: '',
        vendorType: 'LOCAL',
        orderDate: getSystemDate(),
        expectedDeliveryDate: getSystemDate(),
        paymentTerms: 'NET_30',
        remarks: 'Deliver to Birulia Plant Store in cGMP Compliant Sealed Packaging.',
        items: [{ materialCategory: 'RAW_MATERIAL', materialSubtype: 'API', itemName: '', quantity: '', unit: 'kg', unitPrice: '' }]
      });
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const exportExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["PO Number,Vendor Name,Vendor Type,Order Date,Expected Delivery,Grand Total (BDT),Quarantine Status,Ledger Status"].join(",") + "\n"
      + filteredOrders.map(o => `"${o.poNumber}","${o.vendorName}","${o.vendorType}","${o.orderDate}","${o.expectedDeliveryDate || ''}",${o.grandTotal},"${o.status}","AP 21100 Synced"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `amico_purchase_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = purchaseOrders.filter(po => {
    const matchesSearch = po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          po.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
    const matchesDate = (!startDate || po.orderDate >= startDate) && (!endDate || po.orderDate <= endDate);
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Searchable Datalists for Seeded & Entry-able Options */}
      <datalist id="seeded-vendors">
        {vendorList.map((vendor, idx) => (
          <option key={idx} value={vendor} />
        ))}
      </datalist>

      <datalist id="seeded-raw-materials">
        {rawMaterialsList.map((mat, idx) => (
          <option key={idx} value={mat.name || mat.itemName || mat['Material Name']} />
        ))}
      </datalist>

      <datalist id="seeded-pack-materials">
        {packMaterialsList.map((mat, idx) => (
          <option key={idx} value={mat.name || mat.itemName || mat['Material Name']} />
        ))}
      </datalist>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl shadow-xl text-white">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/30 rounded-xl border border-indigo-500/30">
              <ShoppingCart className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Purchase Order Command Hub</h1>
              <p className="text-slate-400 text-sm">Manage multi-vendor procurement, cGMP quarantine gates, and GL sync (Accounts Payable 21100).</p>
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
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" /> Create New PO
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
            placeholder="Search by PO Number or Vendor Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
            <option value="ALL">All Quarantine Statuses</option>
            <option value="IN_QUARANTINE">In Quarantine</option>
            <option value="QC_PASSED_GRN">QC Passed (GRN)</option>
            <option value="VENDOR_RETURN">Vendor Return</option>
          </select>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs tracking-wider font-semibold">
                <th className="p-4">PO Number</th>
                <th className="p-4">Vendor & Type</th>
                <th className="p-4">Order Date</th>
                <th className="p-4">Expected Delivery</th>
                <th className="p-4">Grand Total</th>
                <th className="p-4">Quarantine Status</th>
                <th className="p-4">Finance Ledger</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
              {loading ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-400">Loading purchase orders from database...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-400">No purchase orders found. Create your first PO above.</td></tr>
              ) : (
                filteredOrders.map((po) => (
                  <tr key={po.id || po.poNumber} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-semibold text-indigo-600 font-mono">{po.poNumber}</td>
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{po.vendorName}</div>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono">{po.vendorType}</span>
                    </td>
                    <td className="p-4 text-slate-600">{po.orderDate}</td>
                    <td className="p-4 text-slate-600">{po.expectedDeliveryDate || 'N/A'}</td>
                    <td className="p-4 font-semibold text-slate-900">৳ {Number(po.grandTotal).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        po.status === 'IN_QUARANTINE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        po.status === 'QC_PASSED_GRN' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {po.status ? po.status.replace(/_/g, ' ') : 'IN QUARANTINE'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium border border-indigo-100">
                        <DollarSign className="w-3.5 h-3.5" /> AP 21100 Synced
                      </span>
                    </td>
                    <td className="p-4 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedPoItems(po.items)}
                        className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-medium"
                      >
                        <Eye className="w-4 h-4" /> Items ({po.items?.length || 0})
                      </button>
                      <button
                        onClick={() => setSelectedPoForPrint(po)}
                        className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-medium"
                      >
                        <Printer className="w-4 h-4" /> Print PO
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official PO Voucher / Print Modal with Signatures */}
      {selectedPoForPrint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl space-y-6 my-8 print:p-0 print:shadow-none print:w-full">
            
            {/* Header Voucher */}
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Amico Laboratories Ltd.</h2>
                <p className="text-xs text-slate-600">cGMP Certified Pharmaceutical Manufacturing Plant &bull; Birulia, Savar, Dhaka</p>
                <p className="text-xs text-slate-500 font-mono mt-1">OFFICIAL PURCHASE ORDER VOUCHER</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-indigo-600 font-mono block">{selectedPoForPrint.poNumber}</span>
                <span className="text-xs text-slate-500">Date: {selectedPoForPrint.orderDate}</span>
              </div>
            </div>

            {/* Vendor & Delivery Metadata */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-800">
              <div>
                <h4 className="font-bold uppercase text-slate-500 mb-1">Vendor Details:</h4>
                <p className="font-bold text-slate-900 text-sm">{selectedPoForPrint.vendorName}</p>
                <p>Vendor Type: <span className="font-semibold">{selectedPoForPrint.vendorType}</span></p>
                <p>Payment Terms: <span className="font-semibold">Net 30 Days</span></p>
              </div>
              <div>
                <h4 className="font-bold uppercase text-slate-500 mb-1">Delivery & Shipping:</h4>
                <p>Target Delivery Date: <span className="font-semibold">{selectedPoForPrint.expectedDeliveryDate || 'Immediate'}</span></p>
                <p>Delivery Location: <span className="font-semibold">Birulia Plant Raw/Pack Material Store</span></p>
                <p>GL Account: <span className="font-mono text-indigo-600 font-semibold">21100 (Accounts Payable)</span></p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300">Item Description</th>
                  <th className="p-2 border-r border-slate-300">Category / Subtype</th>
                  <th className="p-2 border-r border-slate-300 text-right">Qty</th>
                  <th className="p-2 border-r border-slate-300 text-right">Unit Price (৳)</th>
                  <th className="p-2 text-right">Total Price (৳)</th>
                </tr>
              </thead>
              <tbody>
                {selectedPoForPrint.items?.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="p-2 border-r border-slate-200 font-semibold text-slate-800">{item.itemName}</td>
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-600">{item.materialCategory} ({item.materialSubtype})</td>
                    <td className="p-2 border-r border-slate-200 text-right font-medium">{item.quantity} {item.unit}</td>
                    <td className="p-2 border-r border-slate-200 text-right">৳ {Number(item.unitPrice).toLocaleString()}</td>
                    <td className="p-2 text-right font-bold">৳ {(item.quantity * item.unitPrice).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold text-sm">
                  <td colSpan="4" className="p-2 text-right border-t border-slate-300 uppercase">Grand Total Amount:</td>
                  <td className="p-2 text-right border-t border-slate-300 text-indigo-700">৳ {Number(selectedPoForPrint.grandTotal).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>

            {/* Official Signatures Footer */}
            <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs text-slate-700">
              <div>
                <div className="border-b border-slate-800 w-3/4 mx-auto mb-1"></div>
                <p className="font-bold">Authorized Supply Chain Director</p>
                <p className="text-[10px] text-slate-500">Amico Laboratories Ltd.</p>
              </div>
              <div>
                <div className="border-b border-slate-800 w-3/4 mx-auto mb-1"></div>
                <p className="font-bold">Factory General Manager (GM)</p>
                <p className="text-[10px] text-slate-500">Birulia Plant Operations</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200 print:hidden">
              <button onClick={() => window.print()} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm flex items-center gap-2 shadow-lg">
                <Printer className="w-4 h-4" /> Print Purchase Order Voucher
              </button>
              <button onClick={() => setSelectedPoForPrint(null)} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* View Items Modal */}
      {selectedPoItems && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" /> Purchase Order Line Items
              </h3>
              <button onClick={() => setSelectedPoItems(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedPoItems.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-slate-800">{item.itemName}</h4>
                    <p className="text-xs text-slate-500 font-mono">{item.materialCategory} &bull; {item.materialSubtype}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-slate-900">{item.quantity} {item.unit} &times; ৳ {item.unitPrice}</div>
                    <div className="text-xs text-indigo-600 font-semibold">Total: ৳ {(item.quantity * item.unitPrice).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button onClick={() => setSelectedPoItems(null)} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Create PO Modal with Seeded + Custom Dynamic Fields */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-indigo-600" /> New Purchase Order & GL Sync
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmitPO} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">PO Number</label>
                  <input type="text" required value={formData.poNumber} onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm" />
                </div>

                {/* Hybrid Dropdown / Entry-able Vendor Input */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Vendor Name <span className="text-indigo-600 text-[10px] lowercase font-normal">(select seeded or type new)</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="seeded-vendors"
                    placeholder="e.g. Acme Pharma Raw Materials Ltd"
                    value={formData.vendorName}
                    onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Vendor Type</label>
                  <select value={formData.vendorType} onChange={(e) => setFormData({ ...formData, vendorType: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                    <option value="LOCAL">Local Vendor</option>
                    <option value="IMPORT">Import / International</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Order Date</label>
                  <input type="date" required value={formData.orderDate} onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Expected Delivery Date</label>
                  <input type="date" required value={formData.expectedDeliveryDate} onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Line Items (AP 21100 & Inventory 11800)</h4>
                  <button type="button" onClick={handleAddItemRow} className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                {formData.items.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 relative">
                    {formData.items.length > 1 && (
                      <button type="button" onClick={() => handleRemoveItemRow(idx)} className="absolute right-3 top-3 text-rose-500 hover:text-rose-700" title="Remove Item">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Category</label>
                        <select value={item.materialCategory} onChange={(e) => handleItemChange(idx, 'materialCategory', e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs">
                          <option value="RAW_MATERIAL">Raw Material</option>
                          <option value="PACKAGING_MATERIAL">Packaging Material</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Subtype</label>
                        <select value={item.materialSubtype} onChange={(e) => handleItemChange(idx, 'materialSubtype', e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs">
                          <option value="API">API</option>
                          <option value="EXCIPIENT">Excipient</option>
                          <option value="ALUMINIUM_FOIL">Aluminium Foil</option>
                          <option value="PLASTIC_BOTTLE">Plastic Bottle</option>
                          <option value="GLASS_BOTTLE">Glass Bottle</option>
                          <option value="BOTTLE_HEAD">Bottle Head (Cap)</option>
                          <option value="CARTON">Carton</option>
                        </select>
                      </div>

                      {/* Hybrid Dropdown / Entry-able Item Name */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Item Name <span className="text-indigo-600 text-[9px] font-normal lowercase">(select or type)</span>
                        </label>
                        <input
                          type="text"
                          required
                          list={item.materialCategory === 'PACKAGING_MATERIAL' ? 'seeded-pack-materials' : 'seeded-raw-materials'}
                          placeholder="e.g. Paracetamol USP / Blister Foil"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Quantity</label>
                        <input type="number" required step="0.01" placeholder="0.00" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Unit</label>
                        <select value={item.unit} onChange={(e) => handleItemChange(idx, 'unit', e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs">
                          <option value="kg">kg</option>
                          <option value="liters">liters</option>
                          <option value="pcs">pcs</option>
                          <option value="rolls">rolls</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Unit Price (৳)</label>
                        <input type="number" required step="0.01" placeholder="0.00" value={item.unitPrice} onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button type="button" onClick={() => window.print()} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium flex items-center gap-1.5">
                  <Printer className="w-4 h-4" /> Print PO Sheet
                </button>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium shadow-lg disabled:opacity-50">
                    {submitting ? 'Posting & Syncing GL...' : 'Save & Post to AP (21100)'}
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