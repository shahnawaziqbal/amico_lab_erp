import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { fetchAllBatches, createProductionBatch } from '../production.service';

export default function BatchLineupTab({ onSelectBmr }) {
  const [batches, setBatches] = useState([]);
  const [boms, setBoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showNewModal, setShowNewModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    productName: '',
    productCode: '',
    productType: 'Tablet',
    unitType: 'Units',
    targetQuantity: 100000,
    lineReference: 'Solid Oral Suite B / Line 01',
    selectedBom: null,
    scaledIngredients: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [batchRes, bomRes] = await Promise.all([
        fetchAllBatches(),
        axios.get('/production/boms').catch(() => ({ data: [] }))
      ]);
      setBatches(batchRes || []);
      setBoms(bomRes.data || []);
    } catch (err) {
      console.error('Failed to load batches or BOMs:', err);
    } finally {
      setLoading(false);
    }
  };
  // Helper to determine standard unit type based on dosage form
  const getUnitTypeForDosage = (dosageForm) => {
    const upper = (dosageForm || '').toUpperCase();
    if (upper.includes('SYRUP') || upper.includes('SOLUTION') || upper.includes('EMULSION') || upper.includes('SUSPENSION')) return 'Liters';
    if (upper.includes('LOTION')) return 'Bottles';
    if (upper.includes('ORS')) return 'Sachets';
    if (upper.includes('DERMA') || upper.includes('CREAM') || upper.includes('OINTMENT')) return 'Tubes';
    if (upper.includes('CAPSULE')) return 'Capsules';
    return 'Tablets';
  };

  // Handle Product Selection & Auto-populate complete BOM ingredients matrix
  const handleProductSelect = (e) => {
    const selectedName = e.target.value;
    const foundBom = boms.find(b => b.productName === selectedName);

    if (foundBom) {
      const dosage = foundBom.dosageForm || 'Tablet';
      const unit = getUnitTypeForDosage(dosage);
      const ingredients = foundBom.ingredientsJson || [];
      const stdBatchSizeNum = parseFloat(String(foundBom.batchSize || '').replace(/[^0-9.]/g, '')) || 100000;

      const scaled = ingredients.map(ing => {
        const theo = Number(ing.theoreticalQtyKg || ing.qtyPerUnit || 10);
        const scaledQty = Number(((theo / stdBatchSizeNum) * form.targetQuantity).toFixed(3));
        return {
          ...ing,
          calculatedBatchQtyKg: scaledQty
        };
      });

      setForm({
        ...form,
        productName: foundBom.productName,
        productCode: foundBom.productCode || 'SKU-001',
        productType: dosage,
        unitType: unit,
        selectedBom: foundBom,
        scaledIngredients: scaled
      });
    } else {
      setForm({
        ...form,
        productName: selectedName,
        selectedBom: null,
        scaledIngredients: []
      });
    }
  };

  // Recalculate raw material quantities dynamically on Target Quantity change
  const handleTargetQuantityChange = (newQty) => {
    const target = Number(newQty) || 0;
    let scaled = [];

    if (form.selectedBom && form.selectedBom.ingredientsJson) {
      const stdBatchSizeNum = parseFloat(String(form.selectedBom.batchSize || '').replace(/[^0-9.]/g, '')) || 100000;
      scaled = form.selectedBom.ingredientsJson.map(ing => {
        const theo = Number(ing.theoreticalQtyKg || ing.qtyPerUnit || 10);
        const scaledQty = Number(((theo / stdBatchSizeNum) * target).toFixed(3));
        return {
          ...ing,
          calculatedBatchQtyKg: scaledQty
        };
      });
    }

    setForm({
      ...form,
      targetQuantity: target,
      scaledIngredients: scaled
    });
  };

  // Handle manual adjustments to specific ingredient batch quantities
  const handleIngredientQtyOverride = (index, value) => {
    const updated = [...form.scaledIngredients];
    updated[index].calculatedBatchQtyKg = value !== '' ? Number(value) : 0;
    setForm({ ...form, scaledIngredients: updated });
  };

  // Direct Button Submission Click Handler
  const handleCreateBatch = async (e) => {
    if (e) e.preventDefault();
    if (!form.productName) {
      alert('Please select a Master Product / Formulation first.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        batchNumber: `B-${Math.floor(10000 + Math.random() * 90000)}`,
        productName: form.productName,
        productCode: form.productCode || 'PRD-001',
        productType: form.productType,
        targetQuantity: Number(form.targetQuantity) || 1000,
        lineReference: form.lineReference || 'Solid Oral Suite B / Line 01',
        ingredientsOverride: JSON.stringify(form.scaledIngredients)
      };

      await createProductionBatch(payload);
      
      setShowNewModal(false);
      await loadData(); // Refresh UI table immediately
      
      // Reset Form
      setForm({
        productName: '',
        productCode: '',
        productType: 'Tablet',
        unitType: 'Units',
        targetQuantity: 100000,
        lineReference: 'Solid Oral Suite B / Line 01',
        selectedBom: null,
        scaledIngredients: []
      });
    } catch (err) {
      console.error('Failed to initiate batch:', err);
      alert('Error saving batch to database. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBatches = batches.filter(b => {
    const matchesSearch = b.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search by batch number or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#1f2937] border border-slate-700 text-slate-100 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 w-full md:w-80 shadow-inner"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#1f2937] border border-slate-700 text-slate-100 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
          >
            <option value="ALL">All Statuses ({batches.length})</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="DISPENSED">Dispensed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="QC_HOLD">QC Hold</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
        >
          + Initiate Production Batch
        </button>
      </div>

      {/* Batch Lineup Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-[#1f2937]/50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">Batch Number</th>
              <th className="p-4">Product Name</th>
              <th className="p-4">Target Qty</th>
              <th className="p-4">Line Reference</th>
              <th className="p-4">Status</th>
              <th className="p-4">Start Date</th>
              <th className="p-4 text-right">Actions / BMR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan="7" className="p-12 text-center text-slate-400">Loading database batch lineups...</td></tr>
            ) : filteredBatches.length === 0 ? (
              <tr><td colSpan="7" className="p-12 text-center text-slate-400">No production batches found. Click Initiate Production Batch.</td></tr>
            ) : (
              filteredBatches.map((b) => (
                <tr key={b.id} className="hover:bg-[#1f2937]/40 transition-colors">
                  <td className="p-4 font-mono text-indigo-400 font-bold">{b.batchNumber}</td>
                  <td className="p-4 font-semibold text-white">{b.productName}</td>
                  <td className="p-4 text-slate-300 font-mono">{b.targetQuantity}</td>
                  <td className="p-4 text-slate-300 text-xs">{b.lineReference}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                      b.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                      b.status === 'IN_PROGRESS' ? 'bg-indigo-950 text-indigo-400 border-indigo-800' :
                      'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 text-xs">{b.startDate || 'N/A'}</td>
                  <td className="p-4 text-right space-x-3">
                    <button
                      onClick={() => onSelectBmr(b)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                    >
                      BMR Sheet & QC Gates
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Comprehensive Master BOM Populated Batch Initiation Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="bg-[#1f2937] px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">Initiate Comprehensive Production Batch</h3>
                <p className="text-xs text-slate-400">Automated Master BOM & Pro-rata Raw Material Calculation Engine</p>
              </div>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
            </div>

            {/* Modal Body Form */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              
              {/* Product & Pipeline Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Select Seeded Master Product / Formula *</label>
                  <select
                    value={form.productName}
                    onChange={handleProductSelect}
                    className="w-full bg-[#1f2937] border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    <option value="">-- Choose from {boms.length} Seeded Formulations --</option>
                    {boms.map((bom, idx) => (
                      <option key={idx} value={bom.productName}>
                        {bom.productName} ({bom.productCode || 'SKU'}) — [{bom.dosageForm || 'Tablet'}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Product Code / SKU</label>
                  <input
                    type="text"
                    value={form.productCode}
                    onChange={(e) => setForm({ ...form, productCode: e.target.value })}
                    className="w-full bg-[#1f2937] border border-slate-700 rounded-xl p-3 text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Batch Nature, Line, and Unit Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Product Nature / Pipeline *</label>
                  <select
                    value={form.productType}
                    onChange={(e) => {
                      const dosage = e.target.value;
                      setForm({
                        ...form,
                        productType: dosage,
                        unitType: getUnitTypeForDosage(dosage)
                      });
                    }}
                    className="w-full bg-[#1f2937] border border-slate-700 rounded-xl p-3 text-slate-100"
                  >
                    <option value="Tablet">Tablet (6-Step Pipeline)</option>
                    <option value="Capsule">Capsule (5-Step Pipeline)</option>
                    <option value="PFS">PFS (4-Step Pipeline)</option>
                    <option value="Syrup">Syrup / Oral Solution / Emulsion (6-Step)</option>
                    <option value="ORS">ORS / Orsaline (4-Step Pipeline)</option>
                    <option value="Derma">Derma & External (4-Step Pipeline)</option>
                    <option value="Lotion">Lotion & Emulsion (4-Step Pipeline)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Target Batch Quantity ({form.unitType}) *</label>
                  <input
                    type="number"
                    min="1"
                    value={form.targetQuantity}
                    onChange={(e) => handleTargetQuantityChange(e.target.value)}
                    className="w-full bg-[#1f2937] border border-slate-700 rounded-xl p-3 text-slate-100 font-mono font-bold text-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Production Line Reference</label>
                  <input
                    type="text"
                    value={form.lineReference}
                    onChange={(e) => setForm({ ...form, lineReference: e.target.value })}
                    className="w-full bg-[#1f2937] border border-slate-700 rounded-xl p-3 text-slate-100"
                  />
                </div>
              </div>

              {/* Automatically Populated BOM Ingredients Breakdown Matrix */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-200">
                      Auto-Populated Master BOM Ingredients Matrix ({form.scaledIngredients.length} Items)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Pro-rata quantities automatically scaled for target batch size of <span className="text-indigo-400 font-mono font-bold">{form.targetQuantity.toLocaleString()} {form.unitType}</span>
                    </p>
                  </div>
                  {form.selectedBom && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
                      Standard Batch Base: {form.selectedBom.batchSize || '100,000 Units'}
                    </span>
                  )}
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#1f2937] text-slate-300 uppercase text-[9px] border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Sl No.</th>
                        <th className="p-2.5">Material Code</th>
                        <th className="p-2.5">Raw Material Name</th>
                        <th className="p-2.5 text-right">Std Recipe Qty</th>
                        <th className="p-2.5 text-right">Scaled Batch Qty (Kg / Pcs)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-[#111827]/40">
                      {form.scaledIngredients.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-slate-500">
                            Select a product above to auto-populate the master formulation raw materials.
                          </td>
                        </tr>
                      ) : (
                        form.scaledIngredients.map((ing, idx) => (
                          <tr key={idx} className="hover:bg-[#1f2937]/30">
                            <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-2.5 font-mono text-indigo-400 font-semibold">{ing.materialCode || `RM-00${idx + 1}`}</td>
                            <td className="p-2.5 font-bold text-white">{ing.materialName || ing.name}</td>
                            <td className="p-2.5 text-right font-mono text-slate-400">{ing.theoreticalQtyKg || ing.qtyPerUnit || '10'} Kg</td>
                            <td className="p-2.5 text-right font-mono">
                              <input
                                type="number"
                                step="0.001"
                                value={ing.calculatedBatchQtyKg}
                                onChange={(e) => handleIngredientQtyOverride(idx, e.target.value)}
                                className="w-28 bg-[#1f2937] border border-slate-700 rounded-lg p-1.5 text-right text-emerald-400 font-bold font-mono focus:outline-none focus:border-indigo-500"
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-5 py-2.5 bg-[#1f2937] hover:bg-[#374151] text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateBatch}
                  disabled={isSubmitting || !form.productName}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg transition ${
                    isSubmitting || !form.productName
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 cursor-pointer'
                  }`}
                >
                  {isSubmitting ? 'Saving Batch...' : 'Initialize Batch with QC Gates & Calculated BOM'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}