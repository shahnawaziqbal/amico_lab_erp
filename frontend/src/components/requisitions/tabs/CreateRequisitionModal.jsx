import React, { useState } from 'react';
import { createRequisition } from '../requisitions.service';

export default function CreateRequisitionModal({ isOpen, onClose, onSuccess }) {
  const [locationType, setLocationType] = useState('Head Office');
  const [department, setDepartment] = useState('Administration & General Services');
  const [requestDate, setRequestDate] = useState(new Date().toISOString().slice(0, 10));
  const [purposeRemarks, setPurposeRemarks] = useState('Daily official supplies and office operational items replenishment.');
  const [items, setItems] = useState([
    { 
      materialCode: 'OFF-SUP-01', 
      materialName: 'A4 Executive Printing Paper Ream', 
      category: 'Office Stationery', 
      requestedQty: 10, 
      unit: 'Ream', 
      remarks: 'Urgent stock for administrative desk printing' 
    }
  ]);

  const locationsList = [
    'Head Office',
    'Factory',
    'Depot - Dhaka (DK)',
    'Depot - Mymensingh (MYM)',
    'Depot - Dinajpur (DIN)',
    'Depot - Rajshahi (RAJ)',
    'Depot - Bogura (BOG)',
    'Depot - Chittagong (CTG)',
    'Depot - Comilla (COM)',
    'Depot - Noakhali (NOA)',
    'Depot - Sylhet (SYL)',
    'Depot - Barisal (BAR)',
    'Depot - Faridpur (FAR)',
    'Depot - Jessore (JES)',
    'Depot - Kushtia (KUS)'
  ];

  const categoriesList = [
    'Office Stationery',
    'IT & Computer Accessories',
    'Pantry & Refreshments',
    'Cleaning & Sanitation',
    'Electrical & Hardware Spares',
    'Office Furniture & Fixtures'
  ];

  const unitsList = ['Pcs', 'Ream', 'Box', 'Pack', 'Bottles', 'Sets', 'Rolls', 'Units'];

  if (!isOpen) return null;

  const addItemRow = () => {
    setItems([...items, { materialCode: '', materialName: '', category: 'Office Stationery', requestedQty: 1, unit: 'Pcs', remarks: '' }]);
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createRequisition({
        locationType,
        department,
        requestDate,
        purposeRemarks,
        items
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create requisition:', err);
      alert('Error creating requisition.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Daily Office Requisition & Material Issue Form
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl cursor-pointer">&times;</button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Top Info Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Center / Location</label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {locationsList.map((loc, idx) => (
                  <option key={idx} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Requesting Department</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Administration, Sales, Accounts"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Request Date</label>
              <input
                type="date"
                required
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Remarks Row */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Purpose & Operational Remarks</label>
            <textarea
              rows="2"
              value={purposeRemarks}
              onChange={(e) => setPurposeRemarks(e.target.value)}
              placeholder="Enter official reason or usage purpose..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Line Items Matrix Section */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Requested Official Items Matrix</h4>
              <button
                type="button"
                onClick={addItemRow}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-sm"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 relative space-y-3">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="absolute top-3 right-3 text-rose-400 hover:text-rose-300 text-base cursor-pointer"
                      title="Remove item"
                    >
                      &times;
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Item Description</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Ballpoint Pens, Toner Cartridge, A4 Paper"
                        value={item.materialName}
                        onChange={(e) => updateItem(index, 'materialName', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                      <select
                        value={item.category}
                        onChange={(e) => updateItem(index, 'category', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        {categoriesList.map((cat, cIdx) => (
                          <option key={cIdx} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Requested Qty</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={item.requestedQty}
                        onChange={(e) => updateItem(index, 'requestedQty', Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unit</label>
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        {unitsList.map((u, uIdx) => (
                          <option key={uIdx} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Submit Official Requisition
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}