import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function NewRecipeBuilderModal({ onClose, onRecipeCreated }) {
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form state for creating a new master BOM recipe
  const [form, setForm] = useState({
    productCode: '',
    productName: '',
    dosageForm: 'Tablet',
    batchSize: '100,000 Units',
    ingredients: [
      { materialCode: 'RM-001', materialName: '', qtyPerUnit: 0, theoreticalQtyKg: 0, potency: 100, overage: 0, calculatedQtyKg: 0 }
    ]
  });

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const [prodRes, matRes] = await Promise.all([
        axios.get('/api/products').catch(() => ({ data: [] })),
        axios.get('/procurement/materials/master').catch(() => ({ data: [] }))
      ]);
      setProducts(prodRes.data || []);
      setRawMaterials(matRes.data || []);
    } catch (err) {
      console.error('Failed to fetch master data for recipe builder:', err);
    }
  };

  const handleProductSelection = (e) => {
    const selectedName = e.target.value;
    const found = products.find(p => p.name === selectedName || p.productName === selectedName);
    if (found) {
      setForm({
        ...form,
        productName: found.name || found.productName,
        productCode: found.productCode || found.code || 'SKU-001',
        dosageForm: found.dosageForm || found.category || 'Tablet'
      });
    } else {
      setForm({ ...form, productName: selectedName });
    }
  };

  const handleAddIngredientRow = () => {
    setForm({
      ...form,
      ingredients: [
        ...form.ingredients,
        { materialCode: `RM-00${form.ingredients.length + 1}`, materialName: '', qtyPerUnit: 0, theoreticalQtyKg: 0, potency: 100, overage: 0, calculatedQtyKg: 0 }
      ]
    });
  };

  const handleRemoveIngredientRow = (index) => {
    if (form.ingredients.length <= 1) return;
    const updated = form.ingredients.filter((_, i) => i !== index);
    setForm({ ...form, ingredients: updated });
  };

  const handleIngredientChange = (index, field, value) => {
    const updated = [...form.ingredients];
    updated[index][field] = value;

    if (field === 'materialName') {
      const matchedMat = rawMaterials.find(m => (m.materialName || m.name) === value);
      if (matchedMat) {
        updated[index].materialCode = matchedMat.materialCode || matchedMat.code || updated[index].materialCode;
      }
    }

    // Automated Pharma Calculation: Calculated Qty (Kg) = (Theoretical Qty * (100 / Potency)) * (1 + Overage / 100)
    const theoretical = Number(updated[index].theoreticalQtyKg) || 0;
    const potency = Number(updated[index].potency) || 100;
    const overage = Number(updated[index].overage) || 0;

    if (theoretical > 0) {
      const calculated = (theoretical * (100 / (potency || 100))) * (1 + (overage / 100));
      updated[index].calculatedQtyKg = Number(calculated.toFixed(3));
    }

    setForm({ ...form, ingredients: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        productName: form.productName,
        productCode: form.productCode,
        dosageForm: form.dosageForm,
        batchSize: form.batchSize,
        ingredientsJson: JSON.stringify(form.ingredients)
      };

      await axios.post('/production/boms', payload);
      if (onRecipeCreated) onRecipeCreated();
      onClose();
    } catch (err) {
      console.error('Failed to save master BOM recipe to database:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-[#1f2937] px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-white">Formulate New Master BOM Recipe</h3>
            <p className="text-xs text-slate-400">Database Synchronized Master Formula Authoring Tool</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Select Product / Formulate Formula *</label>
              <select
                required
                value={form.productName}
                onChange={handleProductSelection}
                className="w-full bg-[#1f2937] border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Choose from Database Products --</option>
                {products.map((prod, idx) => (
                  <option key={idx} value={prod.name || prod.productName}>
                    {prod.name || prod.productName} ({prod.productCode || prod.code || 'SKU'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Product Code / SKU *</label>
              <input
                type="text"
                required
                placeholder="e.g. PRD-TAB-161"
                value={form.productCode}
                onChange={(e) => setForm({ ...form, productCode: e.target.value })}
                className="w-full bg-[#1f2937] border border-slate-700 rounded-xl p-3 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Product Nature / Pipeline *</label>
              <select
                value={form.dosageForm}
                onChange={(e) => setForm({ ...form, dosageForm: e.target.value })}
                className="w-full bg-[#1f2937] border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="Tablet">1. Tablet (6-Step Pipeline)</option>
                <option value="Capsule">2. Capsule (5-Step Pipeline)</option>
                <option value="PFS">3. PFS (4-Step Pipeline)</option>
                <option value="Syrup">4. Syrup / Oral Solution (6-Step Pipeline)</option>
                <option value="ORS">5. ORS / Orsaline (4-Step Pipeline)</option>
                <option value="Derma">6. Derma & External Solution (4-Step Pipeline)</option>
                <option value="Lotion">7. Lotion & Emulsion (4-Step Pipeline)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Standard Batch Size *</label>
              <input
                type="text"
                required
                placeholder="e.g. 100,000 Tablets or 2,000 L"
                value={form.batchSize}
                onChange={(e) => setForm({ ...form, batchSize: e.target.value })}
                className="w-full bg-[#1f2937] border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Dynamic Raw Material Ingredients Matrix */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-200">Raw Material Breakdown Matrix</h4>
                <p className="text-[11px] text-slate-400">Fetched directly from procurement inventory master</p>
              </div>
              <button
                type="button"
                onClick={handleAddIngredientRow}
                className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-lg text-xs font-bold transition"
              >
                + Add Raw Material Row
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {form.ingredients.map((ing, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 bg-[#1f2937]/60 p-2.5 rounded-xl border border-slate-800 items-center">
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="RM Code"
                      value={ing.materialCode}
                      onChange={(e) => handleIngredientChange(idx, 'materialCode', e.target.value)}
                      className="w-full bg-[#111827] border border-slate-700 rounded-lg p-2 text-indigo-400 font-mono text-[10px]"
                    />
                  </div>
                  
                  <div className="col-span-4">
                    <select
                      required
                      value={ing.materialName}
                      onChange={(e) => handleIngredientChange(idx, 'materialName', e.target.value)}
                      className="w-full bg-[#111827] border border-slate-700 rounded-lg p-2 text-slate-100 text-[10px]"
                    >
                      <option value="">-- Choose Raw Material --</option>
                      {rawMaterials.map((rm, rIdx) => (
                        <option key={rIdx} value={rm.materialName || rm.name}>
                          {rm.materialCode || rm.code || 'RM'} - {rm.materialName || rm.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.001"
                      placeholder="Theo (Kg)"
                      value={ing.theoreticalQtyKg}
                      onChange={(e) => handleIngredientChange(idx, 'theoreticalQtyKg', e.target.value)}
                      className="w-full bg-[#111827] border border-slate-700 rounded-lg p-2 text-slate-100 font-mono text-[10px]"
                    />
                  </div>

                  <div className="col-span-1">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Pot %"
                      value={ing.potency}
                      onChange={(e) => handleIngredientChange(idx, 'potency', e.target.value)}
                      className="w-full bg-[#111827] border border-slate-700 rounded-lg p-2 text-slate-100 font-mono text-[10px]"
                    />
                  </div>

                  <div className="col-span-3 flex items-center gap-2">
                    <input
                      type="number"
                      step="0.001"
                      readOnly
                      placeholder="Calc Qty"
                      value={ing.calculatedQtyKg}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-emerald-400 font-mono font-bold text-[10px]"
                    />
                    {form.ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredientRow(idx)}
                        className="text-rose-400 hover:text-rose-300 font-bold px-1"
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
              onClick={onClose}
              className="px-4 py-2.5 bg-[#1f2937] hover:bg-[#374151] text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition"
            >
              {loading ? 'Saving Recipe...' : 'Save Master BOM to Database'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}