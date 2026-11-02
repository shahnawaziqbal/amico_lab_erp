import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Base relative URL routed through Vite proxy to NestJS
const API_BASE_URL = '/production';

export default function BomMatrixTab() {
  const [boms, setBoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dosageFilter, setDosageFilter] = useState('ALL');
  const [selectedBomForSheet, setSelectedBomForSheet] = useState(null);
  const [showCreateBomModal, setShowCreateBomModal] = useState(false);

  // New BOM Creation Form State
  const [newBomForm, setNewBomForm] = useState({
    productName: '',
    productCode: '',
    dosageForm: 'Tablet',
    batchSize: '100,000 Units',
    ingredients: [
      { materialCode: 'RM-001', materialName: '', qtyPerUnit: 0, theoreticalQtyKg: 0, potency: 100, overage: 0, calculatedQtyKg: 0 }
    ]
  });

  useEffect(() => {
    fetchBoms();
  }, []);

  const fetchBoms = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/boms`);
      setBoms(res.data || []);
    } catch (err) {
      console.error('Error fetching master BOM recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Safe helper to normalize and parse ingredients JSON
  const getParsedIngredients = (ingredientsJson) => {
    if (!ingredientsJson) return [];
    if (Array.isArray(ingredientsJson)) return ingredientsJson;
    if (typeof ingredientsJson === 'string') {
      try {
        const parsed = JSON.parse(ingredientsJson);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Add new raw material row in BOM creation modal
  const handleAddIngredientRow = () => {
    setNewBomForm({
      ...newBomForm,
      ingredients: [
        ...newBomForm.ingredients,
        { materialCode: `RM-00${newBomForm.ingredients.length + 1}`, materialName: '', qtyPerUnit: 0, theoreticalQtyKg: 0, potency: 100, overage: 0, calculatedQtyKg: 0 }
      ]
    });
  };

  // Remove raw material row
  const handleRemoveIngredientRow = (index) => {
    const updated = newBomForm.ingredients.filter((_, i) => i !== index);
    setNewBomForm({ ...newBomForm, ingredients: updated });
  };

  // Handle raw material input changes with automated theoretical quantity calculations
  const handleIngredientChange = (index, field, value) => {
    const updated = [...newBomForm.ingredients];
    updated[index][field] = value;

    // Automated Pharma Calculation: Calculated Qty (Kg) = (Theoretical Qty * (100 / Potency)) * (1 + Overage / 100)
    const theoretical = Number(updated[index].theoreticalQtyKg) || 0;
    const potency = Number(updated[index].potency) || 100;
    const overage = Number(updated[index].overage) || 0;

    if (theoretical > 0) {
      const calculated = (theoretical * (100 / (potency || 100))) * (1 + (overage / 100));
      updated[index].calculatedQtyKg = Number(calculated.toFixed(3));
    }

    setNewBomForm({ ...newBomForm, ingredients: updated });
  };

  // Submit and create new BOM in backend database
  const handleCreateBomSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        productName: newBomForm.productName,
        productCode: newBomForm.productCode,
        dosageForm: newBomForm.dosageForm,
        batchSize: newBomForm.batchSize,
        ingredientsJson: JSON.stringify(newBomForm.ingredients)
      };

      await axios.post(`${API_BASE_URL}/boms`, payload);
      setShowCreateBomModal(false);
      fetchBoms();
      setNewBomForm({
        productName: '',
        productCode: '',
        dosageForm: 'Tablet',
        batchSize: '100,000 Units',
        ingredients: [{ materialCode: 'RM-001', materialName: '', qtyPerUnit: 0, theoreticalQtyKg: 0, potency: 100, overage: 0, calculatedQtyKg: 0 }]
      });
    } catch (err) {
      console.error('Failed to create new master BOM:', err);
    }
  };

  // Export Master BOM list to Excel/CSV
  const handleExportBomMatrixCsv = () => {
    const headers = ['Product Code', 'Product Name', 'Dosage Form', 'Batch Size', 'Ingredient Count', 'Status'];
    const rows = filteredBoms.map(b => [
      `"${b.productCode || 'N/A'}"`,
      `"${b.productName}"`,
      `"${b.dosageForm || 'N/A'}"`,
      `"${b.batchSize || 'N/A'}"`,
      getParsedIngredients(b.ingredientsJson).length,
      b.status || 'ACTIVE'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Amico_BOM_Master_Matrix_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Formulation Order Sheet PDF
  const handlePrintFormulationSheet = () => {
    window.print();
  };

  // Filter logic
  const filteredBoms = boms.filter(b => {
    const matchesSearch = b.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.productCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDosage = dosageFilter === 'ALL' || b.dosageForm?.toUpperCase() === dosageFilter.toUpperCase();
    return matchesSearch && matchesDosage;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Filter and Actions Bar */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search by product code or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#1f2937] border border-slate-700 text-slate-100 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 w-full md:w-80 shadow-inner"
          />
          <select
            value={dosageFilter}
            onChange={(e) => setDosageFilter(e.target.value)}
            className="bg-[#1f2937] border border-slate-700 text-slate-100 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
          >
            <option value="ALL">All Product Forms ({boms.length})</option>
            <option value="TABLET">Tablet</option>
            <option value="CAPSULE">Capsule</option>
            <option value="PFS">PFS</option>
            <option value="SYRUP">Syrup / Oral Solution</option>
            <option value="ORS">ORS / Orsaline</option>
            <option value="DERMA">Derma / External</option>
            <option value="LOTION">Lotion / Emulsion</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={handleExportBomMatrixCsv}
            className="px-4 py-2.5 bg-[#1f2937] hover:bg-[#374151] text-emerald-400 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-2"
          >
            📊 Export CSV Matrix
          </button>
          <button
            onClick={() => setShowCreateBomModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-2"
          >
            + Formulate New BOM Recipe
          </button>
        </div>
      </div>

      {/* BOM Card Grid Display */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-[#111827] border border-slate-800 rounded-2xl">
          Loading Master BOM Recipes from SQLite Database...
        </div>
      ) : filteredBoms.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-[#111827] border border-slate-800 rounded-2xl">
          No Master BOM Recipes found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBoms.map((bom) => {
            const ingredients = getParsedIngredients(bom.ingredientsJson);
            return (
              <div
                key={bom.id}
                className="bg-[#111827] border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/50">
                        {bom.productCode || 'SKU-RECIPE'}
                      </span>
                      <h4 className="text-base font-bold text-white mt-1.5 group-hover:text-indigo-300 transition-colors">
                        {bom.productName}
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {bom.dosageForm || 'Tablet'}
                    </span>
                  </div>

                  <div className="bg-[#1f2937]/50 rounded-xl p-3 border border-slate-800/80 text-xs space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Standard Batch Size:</span>
                      <span className="font-mono text-slate-200 font-semibold">{bom.batchSize || '100,000 Units'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Formulation Ingredients:</span>
                      <span className={`font-mono font-bold ${ingredients.length > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {ingredients.length} Items Listed
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex gap-2">
                  <button
                    onClick={() => setSelectedBomForSheet(bom)}
                    className="flex-1 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 hover:border-indigo-600 text-xs font-bold rounded-xl transition text-center"
                  >
                    View Formulation Order Sheet
                  </button>
                  <button
                    onClick={handleExportBomMatrixCsv}
                    className="px-3 py-2 bg-[#1f2937] hover:bg-[#374151] text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition"
                    title="Export Single BOM"
                  >
                    📥
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Official Amico Formulation Order Sheet Modal (Print / PDF Enabled) */}
      {selectedBomForSheet && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header Controls */}
            <div className="bg-[#1f2937] px-6 py-4 border-b border-slate-800 flex justify-between items-center print:hidden">
              <div>
                <h3 className="text-base font-bold text-white">Amico Laboratories Formulation Order Sheet</h3>
                <p className="text-xs text-slate-400">Official Database Formula & Batch Master Direct Sync</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrintFormulationSheet}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  🖨️ Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedBomForSheet(null)}
                  className="text-slate-400 hover:text-white text-lg font-bold px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-100 bg-[#0d1117] print:p-0 print:bg-white print:text-black">
              
              {/* Official Header */}
              <div className="text-center border-b border-slate-800 print:border-black pb-4">
                <h1 className="text-xl font-black uppercase tracking-wider text-white print:text-black">
                  AMICO LABORATORIES LIMITED
                </h1>
                <p className="text-xs text-slate-400 print:text-gray-700">Khagan, Savar, Dhaka, Bangladesh</p>
                <p className="text-xs text-slate-400 print:text-gray-700">(Toll Manufacturing for Healthcare Pharmaceuticals Limited)</p>
                <div className="mt-3 inline-block px-4 py-1 bg-indigo-950/80 text-indigo-300 print:bg-gray-200 print:text-black text-xs font-bold uppercase rounded border border-indigo-800 print:border-black">
                  FORMULATION ORDER SHEET
                </div>
              </div>

              {/* Master Header Details */}
              <div className="grid grid-cols-3 gap-4 text-xs bg-[#161b22] print:bg-gray-100 p-4 rounded-xl border border-slate-800 print:border-black">
                <div>
                  <span className="text-slate-400 print:text-gray-600">Product Code:</span>
                  <p className="font-mono font-bold text-indigo-400 print:text-black text-sm">{selectedBomForSheet.productCode || 'REC-001'}</p>
                </div>
                <div>
                  <span className="text-slate-400 print:text-gray-600">Product Name:</span>
                  <p className="font-bold text-white print:text-black text-sm">{selectedBomForSheet.productName}</p>
                </div>
                <div>
                  <span className="text-slate-400 print:text-gray-600">Dosage Form:</span>
                  <p className="font-semibold text-slate-200 print:text-black">{selectedBomForSheet.dosageForm || 'Tablet'}</p>
                </div>
                <div>
                  <span className="text-slate-400 print:text-gray-600">Standard Batch Size:</span>
                  <p className="font-mono font-semibold text-slate-200 print:text-black">{selectedBomForSheet.batchSize || '100,000 Units'}</p>
                </div>
                <div>
                  <span className="text-slate-400 print:text-gray-600">Status / Authorization:</span>
                  <p className="font-bold text-emerald-400 print:text-black">{selectedBomForSheet.status || 'ACTIVE'}</p>
                </div>
                <div>
                  <span className="text-slate-400 print:text-gray-600">Issue Date:</span>
                  <p className="font-mono text-slate-300 print:text-black">{new Date().toISOString().split('T')[0]}</p>
                </div>
              </div>

              {/* Ingredients Table */}
              <div className="border border-slate-800 print:border-black rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#1f2937] print:bg-gray-200 text-slate-300 print:text-black uppercase text-[10px] border-b border-slate-800 print:border-black">
                    <tr>
                      <th className="p-3 border-r border-slate-800 print:border-black">Sl No.</th>
                      <th className="p-3 border-r border-slate-800 print:border-black">Material Code</th>
                      <th className="p-3 border-r border-slate-800 print:border-black">Material Name</th>
                      <th className="p-3 border-r border-slate-800 print:border-black text-right">Qty/Unit (mg)</th>
                      <th className="p-3 border-r border-slate-800 print:border-black text-right">Theoretical Qty (Kg)</th>
                      <th className="p-3 border-r border-slate-800 print:border-black text-right">Potency (%)</th>
                      <th className="p-3 border-r border-slate-800 print:border-black text-right">Overage (%)</th>
                      <th className="p-3 text-right">Calculated Qty (Kg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-black">
                    {getParsedIngredients(selectedBomForSheet.ingredientsJson).length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-6 text-center text-slate-400 print:text-gray-600">
                          No raw material line items found for this formula in database.
                        </td>
                      </tr>
                    ) : (
                      getParsedIngredients(selectedBomForSheet.ingredientsJson).map((ing, idx) => (
                        <tr key={idx} className="hover:bg-[#1f2937]/30 print:hover:bg-transparent">
                          <td className="p-3 border-r border-slate-800 print:border-black font-mono">{idx + 1}</td>
                          <td className="p-3 border-r border-slate-800 print:border-black font-mono text-indigo-400 print:text-black font-semibold">
                            {ing.materialCode || `RM-00${idx + 1}`}
                          </td>
                          <td className="p-3 border-r border-slate-800 print:border-black font-bold text-white print:text-black">
                            {ing.materialName || ing.name || 'API / Excipient Raw Material'}
                          </td>
                          <td className="p-3 border-r border-slate-800 print:border-black text-right font-mono text-slate-300 print:text-black">
                            {ing.qtyPerUnit || ing.qtyPerTab || '0'}
                          </td>
                          <td className="p-3 border-r border-slate-800 print:border-black text-right font-mono text-slate-300 print:text-black">
                            {ing.theoreticalQtyKg || '0.00'}
                          </td>
                          <td className="p-3 border-r border-slate-800 print:border-black text-right font-mono text-slate-300 print:text-black">
                            {ing.potency || '100'}%
                          </td>
                          <td className="p-3 border-r border-slate-800 print:border-black text-right font-mono text-slate-300 print:text-black">
                            {ing.overage || '0'}%
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-400 print:text-black">
                            {ing.calculatedQtyKg || ing.theoreticalQtyKg || '0.00'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* cGMP Authorized Signatures */}
              <div className="grid grid-cols-4 gap-4 pt-12 text-center text-[10px] print:pt-16">
                <div className="border-t border-slate-700 print:border-black pt-2">
                  <p className="font-bold text-slate-300 print:text-black">Executive Warehouse</p>
                  <p className="text-slate-500 print:text-gray-600">Material Dispensing Sign</p>
                </div>
                <div className="border-t border-slate-700 print:border-black pt-2">
                  <p className="font-bold text-slate-300 print:text-black">Executive QA</p>
                  <p className="text-slate-500 print:text-gray-600">cGMP Verification Sign</p>
                </div>
                <div className="border-t border-slate-700 print:border-black pt-2">
                  <p className="font-bold text-slate-300 print:text-black">Executive Production</p>
                  <p className="text-slate-500 print:text-gray-600">Manufacturing Execution Sign</p>
                </div>
                <div className="border-t border-slate-700 print:border-black pt-2">
                  <p className="font-bold text-slate-300 print:text-black">Manager Production / GM</p>
                  <p className="text-slate-500 print:text-gray-600">Final Release Sign</p>
                </div>
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="bg-[#1f2937] p-4 border-t border-slate-800 flex justify-end print:hidden">
              <button
                onClick={() => setSelectedBomForSheet(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Close Formulation Sheet
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Author / Create New Master BOM Modal */}
      {showCreateBomModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 w-full max-w-3xl shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Formulate New Master BOM Recipe</h3>
                <p className="text-xs text-slate-400">Add new product master formula to Amico ERP database</p>
              </div>
              <button onClick={() => setShowCreateBomModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateBomSubmit} className="space-y-5 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol 500mg Suspension"
                    value={newBomForm.productName}
                    onChange={(e) => setNewBomForm({ ...newBomForm, productName: e.target.value })}
                    className="w-full bg-[#1f2937] border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Product Code / SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PRD-SYR-005"
                    value={newBomForm.productCode}
                    onChange={(e) => setNewBomForm({ ...newBomForm, productCode: e.target.value })}
                    className="w-full bg-[#1f2937] border border-slate-700 rounded-xl p-3 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Dosage Form / Product Line *</label>
                  <select
                    value={newBomForm.dosageForm}
                    onChange={(e) => setNewBomForm({ ...newBomForm, dosageForm: e.target.value })}
                    className="w-full bg-[#1f2937] border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="PFS">PFS</option>
                    <option value="Syrup">Syrup / Oral Solution</option>
                    <option value="ORS">ORS / Orsaline</option>
                    <option value="Derma">Derma / External</option>
                    <option value="Lotion">Lotion / Emulsion</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Standard Batch Size *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 100,000 Tablets or 1,000 Liters"
                    value={newBomForm.batchSize}
                    onChange={(e) => setNewBomForm({ ...newBomForm, batchSize: e.target.value })}
                    className="w-full bg-[#1f2937] border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Dynamic Raw Material Ingredient Rows */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-200">Raw Material Ingredients Breakdown</h4>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-lg text-xs font-bold transition"
                  >
                    + Add Material Row
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {newBomForm.ingredients.map((ing, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 bg-[#1f2937]/60 p-2.5 rounded-xl border border-slate-800 items-center">
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="Code"
                          value={ing.materialCode}
                          onChange={(e) => handleIngredientChange(idx, 'materialCode', e.target.value)}
                          className="w-full bg-[#111827] border border-slate-700 rounded-lg p-2 text-slate-100 font-mono text-[10px]"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          required
                          placeholder="Raw Material Name (e.g. Paracetamol BP)"
                          value={ing.materialName}
                          onChange={(e) => handleIngredientChange(idx, 'materialName', e.target.value)}
                          className="w-full bg-[#111827] border border-slate-700 rounded-lg p-2 text-slate-100 text-[10px]"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Theo (Kg)"
                          value={ing.theoreticalQtyKg}
                          onChange={(e) => handleIngredientChange(idx, 'theoreticalQtyKg', e.target.value)}
                          className="w-full bg-[#111827] border border-slate-700 rounded-lg p-2 text-slate-100 font-mono text-[10px]"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          readOnly
                          placeholder="Calc (Kg)"
                          value={ing.calculatedQtyKg}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-emerald-400 font-mono font-bold text-[10px]"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        {newBomForm.ingredients.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredientRow(idx)}
                            className="text-rose-400 hover:text-rose-300 font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateBomModal(false)}
                  className="px-4 py-2.5 bg-[#1f2937] hover:bg-[#374151] text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition"
                >
                  Save Master BOM Formula
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}