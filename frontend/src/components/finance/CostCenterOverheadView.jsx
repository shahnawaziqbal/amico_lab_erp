import React, { useState, useEffect } from 'react';
import { financeApi } from './api/financeApi';

export default function CostCenterOverheadView() {
  const [costCenters, setCostCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form state
  const [selectedCostCenterId, setSelectedCostCenterId] = useState('');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [formData, setFormData] = useState({
    employeeSalary: '',
    laborSalary: '',
    utilities: '',
    capex: '',
    opex: '',
    remarks: '',
  });

  useEffect(() => {
    loadCostCenters();
  }, []);

  const loadCostCenters = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await financeApi.getCostCenters();
      const centers = Array.isArray(data) ? data : [];
      setCostCenters(centers);
      if (centers.length > 0) {
        setSelectedCostCenterId(centers[0].id);
      }
    } catch (err) {
      console.error('Failed to load cost centers:', err);
      setError('Failed to fetch cost centers. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateTotal = () => {
    const emp = parseFloat(formData.employeeSalary) || 0;
    const lab = parseFloat(formData.laborSalary) || 0;
    const util = parseFloat(formData.utilities) || 0;
    const cap = parseFloat(formData.capex) || 0;
    const op = parseFloat(formData.opex) || 0;
    return (emp + lab + util + cap + op).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!selectedCostCenterId) {
      setError('Please select a valid Cost Center.');
      return;
    }

    try {
      const payload = {
        costCenterId: selectedCostCenterId,
        period,
        employeeSalary: parseFloat(formData.employeeSalary) || 0,
        laborSalary: parseFloat(formData.laborSalary) || 0,
        utilities: parseFloat(formData.utilities) || 0,
        capex: parseFloat(formData.capex) || 0,
        opex: parseFloat(formData.opex) || 0,
        remarks: formData.remarks,
      };

      await financeApi.upsertOverhead(payload);
      setSuccessMessage('Overhead and salary record saved successfully.');
    } catch (err) {
      console.error('Failed to save overhead entry:', err);
      setError(err.response?.data?.message || 'Failed to save overhead record.');
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Cost Center Overhead & Salary Management</h1>
        <p className="text-sm text-slate-500">Record monthly salaries, utilities, CAPEX, and OPEX for Head Office, Plants, and Depots</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-400 font-medium">Loading cost centers...</div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Cost Center</label>
              <select
                value={selectedCostCenterId}
                onChange={(e) => setSelectedCostCenterId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                required
              >
                {costCenters.map((cc) => (
                  <option key={cc.id} value={cc.id}>
                    {cc.code} - {cc.name} ({cc.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Period (YYYY-MM)</label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="YYYY-MM"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Employee Salary</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="employeeSalary"
                value={formData.employeeSalary}
                onChange={handleInputChange}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Labor Salary</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="laborSalary"
                value={formData.laborSalary}
                onChange={handleInputChange}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Utilities</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="utilities"
                value={formData.utilities}
                onChange={handleInputChange}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">CAPEX</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="capex"
                value={formData.capex}
                onChange={handleInputChange}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">OPEX</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="opex"
                value={formData.opex}
                onChange={handleInputChange}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Calculated Total Overhead</label>
              <div className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg font-mono font-bold text-slate-800">
                {calculateTotal()}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Remarks / Notes</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              rows="3"
              placeholder="Optional notes regarding this overhead period..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            ></textarea>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Save Overhead Record
            </button>
          </div>
        </form>
      )}
    </div>
  );
}