import React, { useState, useEffect } from 'react';
import { financeApi } from './api/financeApi';
import { 
  FileText, Calendar, Filter, RefreshCw, CheckCircle2, 
  TrendingUp, Scale, PieChart, Download, Building2 
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function FinancialReportsView() {
  const [reportType, setReportType] = useState('P_L');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 8) + '01');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [costCenterId, setCostCenterId] = useState('');
  const [costCenters, setCostCenters] = useState([]);
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCostCenters();
    generateReport();
  }, []);

  const loadCostCenters = async () => {
    try {
      const data = await financeApi.getCostCenters();
      setCostCenters(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load cost centers for filtering:', err);
    }
  };

  const generateReport = async (e) => {
    e?.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const data = await financeApi.getReport(reportType, startDate, endDate, costCenterId || undefined);
      setReportData(data);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError(err.response?.data?.message || 'Failed to generate financial report. Please check date ranges and backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    if (!reportData || !reportData.data) return { totalDebit: 0, totalCredit: 0 };
    let totalDebit = 0;
    let totalCredit = 0;

    reportData.data.forEach(row => {
      totalDebit += parseFloat(row.totalDebit || 0);
      totalCredit += parseFloat(row.totalCredit || 0);
    });

    return {
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
    };
  };

  const totals = calculateTotals();

  const getCostCenterLabel = (id) => {
    if (!id) return 'Consolidated / All Cost Centers';
    const match = costCenters.find(cc => cc.id === id || cc.code === id);
    return match ? `${match.code} - ${match.name}` : id;
  };

  // PDF Export Handler using jsPDF & autotable
  const downloadPDFReport = () => {
    if (!reportData || !reportData.data) return;

    const doc = new jsPDF();
    
    // Header styling
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text(`AMICO Lab ERP - Financial Statement`, 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Report Type: ${reportType === 'P_L' ? 'Profit & Loss (P&L)' : reportType === 'BALANCE_SHEET' ? 'Balance Sheet' : 'Trial Balance'}`, 14, 28);
    doc.text(`Period: ${reportData.period?.startDate || startDate} to ${reportData.period?.endDate || endDate}`, 14, 34);
    doc.text(`Scope / Cost Center: ${getCostCenterLabel(reportData.costCenterId || costCenterId)}`, 14, 40);

    // Table mapping
    const tableColumns = ['Account Code', 'Account Name', 'Category', 'Total Debit (BDT)', 'Total Credit (BDT)'];
    const tableRows = reportData.data.map(row => [
      row.code || row.accountCode,
      row.accountName || row.name,
      row.accountType,
      parseFloat(row.totalDebit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
      parseFloat(row.totalCredit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })
    ]);

    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: 48,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 9, cellPadding: 4 },
      foot: [[
        'Total Aggregate', '', '',
        parseFloat(totals.totalDebit).toLocaleString(undefined, { minimumFractionDigits: 2 }),
        parseFloat(totals.totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })
      ]],
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' }
    });

    doc.save(`AMICO_${reportType}_Report_${startDate}_to_${endDate}.pdf`);
  };

  return (
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen font-sans">
      
      {/* Header Banner */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide text-white">Financial Reports & PDF Export Engine</h1>
            <p className="text-xs text-slate-400 mt-0.5">Dynamically aggregate Trial Balance, Profit & Loss, and Balance Sheets with instant PDF download.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {reportData && reportData.data && reportData.data.length > 0 && (
            <button
              onClick={downloadPDFReport}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"
            >
              <Download className="w-4 h-4" /> Download PDF Report
            </button>
          )}
          <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live GL Database Sync Active
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-500/15 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      {/* Filter Controls Form */}
      <form onSubmit={generateReport} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end shadow-lg">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Report Statement</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
          >
            <option value="P_L">Profit & Loss (P&L)</option>
            <option value="BALANCE_SHEET">Balance Sheet</option>
            <option value="TRIAL_BALANCE">Trial Balance</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cost Center Scope</label>
          <select
            value={costCenterId}
            onChange={(e) => setCostCenterId(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Locations / Consolidated</option>
            {costCenters.map(cc => (
              <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
            ))}
          </select>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
            {loading ? 'Generating...' : 'Generate Statement'}
          </button>
        </div>
      </form>

      {/* Report Display Section */}
      {reportData && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80">
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                {reportData.reportType === 'P_L' ? <TrendingUp className="w-5 h-5 text-emerald-400" /> :
                 reportData.reportType === 'BALANCE_SHEET' ? <Scale className="w-5 h-5 text-blue-400" /> : <PieChart className="w-5 h-5 text-cyan-400" />}
                {reportData.reportType === 'P_L' ? 'Profit & Loss Statement' :
                 reportData.reportType === 'BALANCE_SHEET' ? 'Balance Sheet Statement' : 'Trial Balance Report'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Period: <span className="font-mono font-bold text-white">{reportData.period?.startDate || startDate}</span> to <span className="font-mono font-bold text-white">{reportData.period?.endDate || endDate}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-lg font-mono">
                Scope: {getCostCenterLabel(reportData.costCenterId || costCenterId)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Account Code</th>
                  <th className="py-3.5 px-4">Account Name</th>
                  <th className="py-3.5 px-4">Account Category</th>
                  <th className="py-3.5 px-4 text-right">Total Debit (BDT)</th>
                  <th className="py-3.5 px-4 text-right">Total Credit (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {!reportData.data || reportData.data.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-slate-500 font-medium">
                      No journal transaction records found for this period and cost center selection.
                    </td>
                  </tr>
                ) : (
                  reportData.data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{row.code || row.accountCode}</td>
                      <td className="py-3.5 px-4 font-medium text-white">{row.accountName || row.name}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                          row.accountType === 'ASSET' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                          row.accountType === 'LIABILITY' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
                          row.accountType === 'EQUITY' ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' :
                          row.accountType === 'REVENUE' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}>
                          {row.accountType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-200">
                        {parseFloat(row.totalDebit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-200">
                        {parseFloat(row.totalCredit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {reportData.data && reportData.data.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-950/90 border-t-2 border-slate-800 text-xs font-bold text-white">
                    <td colSpan="3" className="py-4 px-4 text-right uppercase tracking-wider text-slate-400">Total Aggregate:</td>
                    <td className="py-4 px-4 text-right font-mono text-cyan-400 text-sm">
                      BDT {parseFloat(totals.totalDebit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-emerald-400 text-sm">
                      BDT {parseFloat(totals.totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}