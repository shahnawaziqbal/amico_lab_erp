import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function JournalEntryForm() {
  const [accounts, setAccounts] = useState([]);
  const [parties, setParties] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [journals, setJournals] = useState([]);
  const [activeTab, setActiveTab] = useState('history');
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [entryMode, setEntryMode] = useState('RECEIVABLE');

  const [selectedPartyHistory, setSelectedPartyHistory] = useState([]);
  const [partyAnalytics, setPartyAnalytics] = useState({
    opening: 0,
    totalBusiness: 0,
    totalPaid: 0,
    balance: 0,
    transactionCount: 0,
  });

  const [formData, setFormData] = useState({
    entryNumber: `JV-${Date.now().toString().slice(-6)}`,
    partyId: '',
    paymentCategory: 'CASH',
    date: new Date().toISOString().split('T')[0],
    referenceId: '',
    vatAmount: '',
    aitAmount: '',
    settledAmount: '',     
    outstandingAmount: '', 
    description: '',
    lines: [
      { itemName: '', unit: 'pieces', accountId: '', costCenterId: '', quantity: '', unitPrice: '', debit: '', credit: '' },
    ],
  });

  useEffect(() => {
    loadMasterData();
  }, []);

  // --- DYNAMIC ANALYTICS EFFECT ---
  useEffect(() => {
    if (!formData.partyId) {
      setSelectedPartyHistory([]);
      let gBusiness = 0;
      let gPaid = 0;
      let gBalance = 0;
      journals.forEach((j) => {
        const { totalAmt, paidAmt, outAmt } = getVoucherFinancials(j);
        gBusiness += totalAmt;
        gPaid += paidAmt;
        gBalance += outAmt;
      });
      setPartyAnalytics({
        opening: 0,
        totalBusiness: gBusiness,
        totalPaid: gPaid,
        balance: gBalance,
        transactionCount: journals.length,
      });
      return;
    }

    const matchedJournals = journals.filter((j) => j.partyId === formData.partyId || j.party?.id === formData.partyId);
    setSelectedPartyHistory(matchedJournals);

    let tBusiness = 0;
    let tPaid = 0;
    let tBalance = 0;

    matchedJournals.forEach((j) => {
      const { totalAmt, paidAmt, outAmt } = getVoucherFinancials(j);
      tBusiness += totalAmt;
      tPaid += paidAmt;
      tBalance += outAmt;
    });

    const targetParty = parties.find(p => p.id === formData.partyId);
    const openingBal = targetParty ? Number(targetParty.openingBalance || 0) : 0;

    setPartyAnalytics({
      opening: openingBal,
      totalBusiness: tBusiness,
      totalPaid: tPaid,
      balance: tBalance,
      transactionCount: matchedJournals.length,
    });
  }, [formData.partyId, journals, parties]);

  async function loadMasterData() {
    try {
      setLoading(true);
      const [accRes, partyRes, ccRes, jeRes] = await Promise.all([
        axios.get('http://localhost:3000/finance/accounts').catch(() => ({ data: [] })),
        axios.get('http://localhost:3000/finance/parties').catch(() => ({ data: [] })),
        axios.get('http://localhost:3000/finance/cost-centers').catch(() => ({ data: [] })),
        axios.get('http://localhost:3000/finance/journals').catch(() => ({ data: [] })),
      ]);

      setAccounts(Array.isArray(accRes.data) ? accRes.data : accRes.data?.data || accRes.data?.accounts || []);
      setParties(Array.isArray(partyRes.data) ? partyRes.data : partyRes.data?.data || partyRes.data?.parties || []);
      setCostCenters(Array.isArray(ccRes.data) ? ccRes.data : ccRes.data?.data || ccRes.data?.costCenters || []);
      
      const rawJournals = jeRes.data;
      const fetchedJournals = Array.isArray(rawJournals) 
        ? rawJournals 
        : (rawJournals?.data || rawJournals?.journals || rawJournals?.result || []);
      
      setJournals(fetchedJournals);

      let gBusiness = 0;
      let gPaid = 0;
      let gBalance = 0;
      fetchedJournals.forEach(j => {
        const { totalAmt, paidAmt, outAmt } = getVoucherFinancials(j);
        gBusiness += totalAmt;
        gPaid += paidAmt;
        gBalance += outAmt;
      });

      setPartyAnalytics({
        opening: 0,
        totalBusiness: gBusiness,
        totalPaid: gPaid,
        balance: gBalance,
        transactionCount: fetchedJournals.length
      });

    } catch (err) {
      console.error('Failed to load master records:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleLineChange = (index, field, value) => {
    const updated = [...formData.lines];
    updated[index][field] = value;

    if (field === 'quantity' || field === 'unitPrice') {
      const qty = parseFloat(field === 'quantity' ? value : updated[index].quantity) || 0;
      const price = parseFloat(field === 'unitPrice' ? value : updated[index].unitPrice) || 0;
      if (qty > 0 || price > 0) {
        const total = (qty * price).toFixed(2);
        if (entryMode === 'PAYABLE') {
          updated[index]['credit'] = total;
          updated[index]['debit'] = '';
        } else {
          updated[index]['debit'] = total;
          updated[index]['credit'] = '';
        }
      }
    }

    setFormData({ ...formData, lines: updated });
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [
        ...formData.lines,
        { itemName: '', unit: 'pieces', accountId: '', costCenterId: '', quantity: '', unitPrice: '', debit: '', credit: '' },
      ],
    });
  };

  const removeLine = (index) => {
    if (formData.lines.length <= 1) return;
    setFormData({ ...formData, lines: formData.lines.filter((_, i) => i !== index) });
  };

  const totalDebits = formData.lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredits = formData.lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const grossTotal = entryMode === 'PAYABLE' ? (totalCredits > 0 ? totalCredits : totalDebits) : (totalDebits > 0 ? totalDebits : totalCredits);

  const vat = parseFloat(formData.vatAmount) || 0;
  const ait = parseFloat(formData.aitAmount) || 0;
  const netClosingAmount = Math.max(0, grossTotal - (vat + ait));

  const settled = parseFloat(formData.settledAmount) || 0;
  const calculatedUnsettled = Math.max(0, netClosingAmount - settled);

  const currentSlipStatus = settled >= netClosingAmount 
    ? 'PAID' 
    : (entryMode === 'RECEIVABLE' ? 'OUTSTANDING' : 'DUE');

  const getVoucherFinancials = (voucher) => {
    if (!voucher) return { totalAmt: 0, paidAmt: 0, outAmt: 0 };
    
    const totalAmt = Number(
      voucher.totalAmount || 
      voucher.total_amount || 
      voucher.grand_total || 
      voucher.lines?.filter(l => Number(l.debit || 0) > 0 || Number(l.credit || 0) > 0).reduce((acc, l) => acc + Number(l.debit || l.credit || 0), 0) || 0
    );
    
    let paidAmt = Number(voucher.paidAmount || voucher.paid_amount || voucher.settledAmount || 0);
    let outAmt = Number(voucher.outstandingAmount || voucher.outstanding_amount || voucher.dueAmount || -1);

    if (paidAmt === 0 && outAmt < 0) {
      const desc = (voucher.description || '').toLowerCase();
      if (desc.includes('cash') || desc.includes('paid') || desc.includes('cheque') || desc.includes('digital')) {
        paidAmt = totalAmt;
        outAmt = 0;
      } else {
        paidAmt = 0;
        outAmt = totalAmt;
      }
    } else if (outAmt < 0) {
      outAmt = Math.max(0, totalAmt - paidAmt);
    }
    return { totalAmt, paidAmt, outAmt };
  };

  const getPartyName = (voucher) => {
    const pId = voucher.partyId || voucher.party?.id;
    if (pId) {
      const found = parties.find((p) => p.id === pId);
      if (found) return `${found.name} (${found.type})`;
    }
    if (voucher.party?.name) {
      return `${voucher.party.name} (${voucher.party.type || 'CLIENT'})`;
    }

    if (voucher.description) {
      const match = voucher.description.match(/Client:\s*([^|]+)/i);
      if (match) return match[1].trim();
    }

    return 'General Party / Walk-in';
  };

  const getDisplayLines = (voucher) => {
    const rawLines = voucher.lines?.filter(l => l.unit !== 'service' && (Number(l.debit || 0) > 0 || Number(l.credit || 0) > 0)) || voucher.lines || [];
    if (rawLines.length > 0) return rawLines;
    return [{ itemName: 'General Ledger Item Entry', quantity: 1, unit: 'pieces', unitPrice: voucher.totalAmount || 0, debit: 0, credit: voucher.totalAmount || 0 }];
  };

  // --- SETTLEMENT / PAYMENT APPREND HANDLER ---
  const handleSettleOrPayPayment = (voucher) => {
    const { outAmt } = getVoucherFinancials(voucher);
    const targetPartyId = voucher.partyId || voucher.party?.id || '';
    const isPayable = (voucher.entryType || voucher.entry_type) === 'PAYABLE';

    setEntryMode(isPayable ? 'PAYABLE' : 'RECEIVABLE');

    setFormData({
      entryNumber: `JV-${Date.now().toString().slice(-6)}`,
      partyId: targetPartyId,
      paymentCategory: voucher.paymentCategory || 'CASH',
      date: new Date().toISOString().split('T')[0],
      referenceId: voucher.referenceId || voucher.reference_id || '',
      vatAmount: '',
      aitAmount: '',
      settledAmount: outAmt > 0 ? outAmt : 0, // Auto-fill remaining due/outstanding for full settlement
      outstandingAmount: '0.00',
      description: `Settlement / Payment for ${voucher.entryNumber || voucher.entry_number}`,
      lines: [
        {
          itemName: isPayable ? 'Vendor Balance Settlement (Payment Made)' : 'Client Balance Settlement (Receipt Received)',
          unit: 'service',
          accountId: accounts.find(a => a.code?.startsWith('2' ) || a.name?.toLowerCase().includes('payable'))?.id || accounts[0]?.id || '',
          costCenterId: '',
          quantity: 1,
          unitPrice: outAmt,
          debit: isPayable ? outAmt : 0,    // Debiting AP reduces liability when paying vendor
          credit: isPayable ? 0 : outAmt,   // Crediting AR reduces asset when receiving from client
        },
      ],
    });
    setSelectedVoucher(null);
    setActiveTab('create');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (grossTotal <= 0) {
      setMessage({ type: 'error', text: 'Please enter valid item quantities, prices, or amounts.' });
      return;
    }

    if (!formData.partyId) {
      setMessage({ type: 'error', text: 'Please select a Client or Vendor before posting.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const defaultAccountId = accounts[0]?.id || null;
    const contraAccount = accounts.find(a => a.code?.startsWith(entryMode === 'PAYABLE' ? '1' : '4') || a.name?.toLowerCase().includes(entryMode === 'PAYABLE' ? 'inventory' : 'sales'))?.id || defaultAccountId;
    
    const settledVal = parseFloat(formData.settledAmount) || 0;
    const unsettledVal = calculatedUnsettled;

    const itemLines = formData.lines.map((line) => {
      if (!line.itemName || line.itemName.trim() === '') {
        throw new Error('Every item line must have a valid name.');
      }
      const debitVal = parseFloat(line.debit) || 0;
      const creditVal = parseFloat(line.credit) || 0;
      const fallbackAmt = parseFloat(line.quantity || 0) * parseFloat(line.unitPrice || 0);
      
      let finalDebit = debitVal;
      let finalCredit = creditVal;

      if (debitVal === 0 && creditVal === 0) {
        if (entryMode === 'PAYABLE') {
          finalCredit = fallbackAmt;
        } else {
          finalDebit = fallbackAmt;
        }
      }
      
      return {
        itemName: line.itemName.trim(),
        item_name: line.itemName.trim(),
        unit: line.unit || 'pieces',
        accountId: line.accountId && line.accountId !== '' ? line.accountId : defaultAccountId,
        partyId: formData.partyId && formData.partyId !== '' ? formData.partyId : null,
        costCenterId: line.costCenterId && line.costCenterId !== '' ? line.costCenterId : null,
        debit: finalDebit,
        credit: finalCredit,
        quantity: parseFloat(line.quantity) || 0,
        unitPrice: parseFloat(line.unitPrice) || 0,
        unit_price: parseFloat(line.unitPrice) || 0,
      };
    });

    const balancingLine = {
      itemName: entryMode === 'RECEIVABLE' ? 'Sales Revenue / Ledger Settlement' : 'Inventory Purchase / Expense',
      item_name: entryMode === 'RECEIVABLE' ? 'Sales Revenue / Ledger Settlement' : 'Inventory Purchase / Expense',
      unit: 'service',
      accountId: contraAccount && contraAccount !== '' ? contraAccount : defaultAccountId,
      partyId: formData.partyId && formData.partyId !== '' ? formData.partyId : null,
      costCenterId: null,
      debit: entryMode === 'PAYABLE' ? grossTotal : 0,
      credit: entryMode === 'RECEIVABLE' ? grossTotal : 0,
      quantity: 1,
      unitPrice: grossTotal,
      unit_price: grossTotal,
    };

    const lines = [...itemLines, balancingLine];

    const payload = {
      entryNumber: formData.entryNumber,
      entry_number: formData.entryNumber,
      entryType: entryMode,
      paymentCategory: formData.paymentCategory,
      partyId: formData.partyId || null,
      date: formData.date,
      referenceId: formData.referenceId || null,
      vatAmount: vat,
      aitAmount: ait,
      settledAmount: settledVal,
      outstandingAmount: unsettledVal,
      dueAmount: unsettledVal,
      totalAmount: grossTotal,
      description: formData.description,
      lines,
    };

    try {
      await axios.post('http://localhost:3000/finance/journal-entries', payload);
      setMessage({ type: 'success', text: `✓ Voucher ${formData.entryNumber} successfully posted and synced with database!` });

      setFormData({
        entryNumber: `JV-${Date.now().toString().slice(-6)}`,
        partyId: '',
        paymentCategory: 'CASH',
        date: new Date().toISOString().split('T')[0],
        referenceId: '',
        vatAmount: '',
        aitAmount: '',
        settledAmount: '',
        outstandingAmount: '',
        description: '',
        lines: [
          { itemName: '', unit: 'pieces', accountId: '', costCenterId: '', quantity: '', unitPrice: '', debit: '', credit: '' },
        ],
      });
      loadMasterData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to post voucher entry.' });
    } finally {
      setSubmitting(false);
    }
  };

  const exportToCSV = () => {
    const { paidAmt, outAmt } = getVoucherFinancials({ lines: formData.lines });
    const csv =
      'data:text/csv;charset=utf-8,' +
      ['Voucher Number,Party,Date,Type,Payment Mode,Settled,Unsettled,Net Closing,Status'].join(',') +
      '\n' +
      `${formData.entryNumber},"${getPartyName({ partyId: formData.partyId })}",${formData.date},${entryMode},${formData.paymentCategory},${paidAmt},${outAmt},${netClosingAmount},${currentSlipStatus}`;
    const uri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', uri);
    link.setAttribute('download', `Journal_${formData.entryNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading Financial Ledger Module...</div>;
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 min-h-screen p-6 transition-colors duration-300">
        
        {/* Top Header & Theme / Mode Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
          <div>
            <h2 className="text-xl font-bold">Single-Entry Journal & Party Ledger</h2>
            <p className="text-sm text-slate-500">Manage Payables & Receivables with single-entry tracking, continual records, and live database sync.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 cursor-pointer flex items-center gap-2"
            >
              {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setEntryMode('RECEIVABLE')}
                className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  entryMode === 'RECEIVABLE' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                1. Receivables (AR)
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('PAYABLE')}
                className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  entryMode === 'PAYABLE' ? 'bg-amber-600 text-white shadow' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                2. Payables (AP)
              </button>
            </div>
          </div>
        </div>

        {/* Real-Time Party Analytics & Balance Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-xl border border-slate-800">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Business Transactions</span>
            <span className="text-lg font-mono font-bold text-blue-400">{partyAnalytics.transactionCount} Vouchers</span>
          </div>
          <div className="flex flex-col border-x border-slate-800 px-4">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Cumulative Business</span>
            <span className="text-lg font-mono font-bold text-slate-100">{partyAnalytics.totalBusiness.toFixed(2)} BDT</span>
          </div>
          <div className="flex flex-col px-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Settled / Paid</span>
            <span className="text-lg font-mono font-bold text-emerald-400">{partyAnalytics.totalPaid.toFixed(2)} BDT</span>
          </div>
          <div className="flex flex-col border-l border-slate-800 pl-4">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              {entryMode === 'PAYABLE' ? 'Current Due / Payables (AP)' : 'Current Outstanding Dues (AR)'}
            </span>
            <span className="text-lg font-mono font-bold text-amber-400">{partyAnalytics.balance.toFixed(2)} BDT</span>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {message.text}
          </div>
        )}

        {/* Navigation tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer ${
              activeTab === 'create' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            + New {entryMode === 'PAYABLE' ? 'Payable' : 'Receivable'} Entry
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer ${
              activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            📊 Transaction Records & Detailed Party Reports ({Array.isArray(journals) ? journals.length : 0})
          </button>
        </div>

        {activeTab === 'create' ? (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">a) Transaction Type *</label>
                <input
                  type="text"
                  readOnly
                  value={entryMode === 'PAYABLE' ? 'Vendor Purchase / Payment (AP)' : 'Client Sales / Receipt (AR)'}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">b) Payment Category *</label>
                <select
                  value={formData.paymentCategory}
                  onChange={(e) => setFormData({ ...formData, paymentCategory: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-blue-600"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_CHEQUE">Bank Account (Cheque)</option>
                  <option value="ONLINE_TRANSFER">Online Money Transfer via Bank</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">c) Voucher Number *</label>
                <input
                  type="text"
                  readOnly
                  value={formData.entryNumber}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">d) Client / Vendor Name *</label>
                <select
                  value={formData.partyId}
                  onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs font-bold text-blue-600"
                  required
                >
                  <option value="">Select Client / Vendor...</option>
                  {Array.isArray(parties) && parties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Historical Party Records Preview Section */}
            {formData.partyId && selectedPartyHistory.length > 0 && (
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-slate-950 border border-blue-200 dark:border-blue-900/40 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    📁 Previous Records for {getPartyName({ partyId: formData.partyId })} ({selectedPartyHistory.length} Past Vouchers)
                  </h4>
                  <div className="text-xs font-mono">
                    <span className="text-slate-400 mr-3">Total Business: <strong>{partyAnalytics.totalBusiness.toFixed(2)}</strong></span>
                    <span className="text-amber-400">
                      {entryMode === 'PAYABLE' ? 'Total Due (AP):' : 'Total Outstanding (AR):'} <strong>{partyAnalytics.balance.toFixed(2)} BDT</strong>
                    </span>
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {selectedPartyHistory.map((h, i) => {
                    const { outAmt } = getVoucherFinancials(h);
                    return (
                      <div key={i} className="text-xs flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                        <span className="font-mono font-bold text-blue-600">{h.entryNumber || h.entry_number} ({h.date})</span>
                        <span className="text-slate-600 dark:text-slate-400">{h.description || 'No remarks'}</span>
                        <span className={`font-mono font-bold ${outAmt > 0 ? 'text-amber-600' : 'text-emerald-500'}`}>
                          {outAmt > 0 ? `${entryMode === 'PAYABLE' ? 'Due' : 'Outstanding'}: ${outAmt.toFixed(2)}` : 'Fully Paid'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">e) Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">f) Billing Reference</label>
                <input
                  type="text"
                  placeholder="e.g. INV-2026-001"
                  value={formData.referenceId}
                  onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">g) Settled / Paid (BDT)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.settledAmount}
                  onChange={(e) => setFormData({ ...formData, settledAmount: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-emerald-500/50 rounded-lg px-3.5 py-2.5 text-xs font-mono text-emerald-400 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  {entryMode === 'PAYABLE' ? 'h) Due / Payable (BDT)' : 'h) Outstanding (BDT)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  readOnly
                  value={calculatedUnsettled.toFixed(2)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs font-mono text-amber-400 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">i) VAT Deduction</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.vatAmount}
                  onChange={(e) => setFormData({ ...formData, vatAmount: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">j) AIT Deduction</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.aitAmount}
                  onChange={(e) => setFormData({ ...formData, aitAmount: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">k) Remarks / Narration *</label>
              <textarea
                rows="2"
                placeholder="Enter transaction narration..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs"
              ></textarea>
            </div>

            {/* Itemized Entry Grid */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Itemized Line Entries ({entryMode === 'PAYABLE' ? 'Payable Credit Attribution' : 'Receivable Debit Attribution'})
                </h3>
                <button type="button" onClick={addLine} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer">
                  + Add Item Line
                </button>
              </div>

              <div className="space-y-3">
                {formData.lines.map((line, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                      <div className="lg:col-span-4">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">ITEM NAME *</label>
                        <input
                          type="text"
                          placeholder="e.g. Benzyl Benzoate"
                          value={line.itemName}
                          onChange={(e) => handleLineChange(idx, 'itemName', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold"
                        />
                      </div>

                      <div className="lg:col-span-3">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">CHART OF ACCOUNTS</label>
                        <select
                          value={line.accountId}
                          onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                        >
                          <option value="">Select Account...</option>
                          {Array.isArray(accounts) && accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="lg:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">QTY & UNIT</label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            step="any"
                            placeholder="0"
                            value={line.quantity}
                            onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                            className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-2 text-xs font-mono"
                          />
                          <select
                            value={line.unit}
                            onChange={(e) => handleLineChange(idx, 'unit', e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-1 py-2 text-[11px]"
                          >
                            <option value="pieces">pcs</option>
                            <option value="boxes">box</option>
                            <option value="kg">kg</option>
                            <option value="ltr">ltr</option>
                            <option value="vials">vial</option>
                            <option value="packs">pack</option>
                          </select>
                        </div>
                      </div>

                      <div className="lg:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">UNIT PRICE</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={line.unitPrice}
                          onChange={(e) => handleLineChange(idx, 'unitPrice', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                        />
                      </div>

                      <div className="lg:col-span-1 flex justify-center">
                        {formData.lines.length > 1 && (
                          <button type="button" onClick={() => removeLine(idx)} className="text-rose-500 px-3 py-2 hover:bg-rose-50 rounded-lg cursor-pointer font-bold text-sm" title="Remove Line">✕</button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800/60">
                      <div>
                        <label className="block text-[10px] font-semibold text-emerald-500 mb-1">DEBIT (BDT)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={line.debit}
                          onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-emerald-500/50 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-amber-500 mb-1">CREDIT (BDT)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={line.credit}
                          onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-2 text-xs font-mono text-amber-400 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border gap-4">
              <div className="text-xs font-semibold flex flex-wrap gap-4 items-center">
                <span>Total Debits: <strong className="font-mono text-emerald-400">{totalDebits.toFixed(2)}</strong></span>
                <span>Total Credits: <strong className="font-mono text-amber-400">{totalCredits.toFixed(2)}</strong></span>
                <span>Settled: <strong className="font-mono">{settled.toFixed(2)}</strong></span>
                <span>{entryMode === 'PAYABLE' ? 'Due (AP):' : 'Outstanding (AR):'} <strong className="font-mono text-amber-500">{calculatedUnsettled.toFixed(2)}</strong></span>
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                  currentSlipStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  Status: {currentSlipStatus}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={exportToCSV}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  📊 Export CSV
                </button>
                <button
                  type="submit"
                  disabled={submitting || grossTotal <= 0}
                  className={`px-6 py-2.5 rounded-xl text-xs font-semibold ${submitting || grossTotal <= 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white cursor-pointer'}`}
                >
                  {submitting ? 'Posting...' : 'Post Single-Entry Voucher'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Transaction Status & Record History */
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border space-y-6 shadow-sm">
            <h3 className="text-lg font-bold">Party Transaction Records & Detailed Reports</h3>
            <p className="text-xs text-slate-500">Click any voucher row to inspect itemized lines, verify settled amounts, and due balances.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="p-3">Voucher #</th>
                    <th className="p-3">Client / Vendor Name</th>
                    <th className="p-3">Type / Channel</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Total Amount (BDT)</th>
                    <th className="p-3 text-right">Settled (Paid)</th>
                    <th className="p-3 text-right">Due / Outstanding</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {Array.isArray(journals) && journals.map((j) => {
                    const { totalAmt, paidAmt, outAmt } = getVoucherFinancials(j);
                    const voucherNum = j.entryNumber || j.entry_number || 'JV-XXX';
                    const isPaidRow = outAmt <= 0;
                    const isPayable = (j.entryType || j.entry_type) === 'PAYABLE';

                    return (
                      <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => setSelectedVoucher(j)}>
                        <td className="p-3 font-mono font-bold text-blue-600">{voucherNum}</td>
                        <td className="p-3 font-semibold">{getPartyName(j)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-[10px] font-semibold ${isPayable ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                            {j.entryType || j.entry_type || 'RECEIVABLE'} ({j.paymentCategory || j.payment_category || 'CASH'})
                          </span>
                        </td>
                        <td className="p-3">{j.date}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">{totalAmt.toFixed(2)}</td>
                        <td className="p-3 text-right font-mono text-emerald-600">{paidAmt.toFixed(2)}</td>
                        <td className="p-3 text-right font-mono text-amber-600">{outAmt.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isPaidRow ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {isPaidRow ? 'PAID' : (isPayable ? 'DUE' : 'OUTSTANDING')}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-blue-600 font-semibold underline">Inspect / Report</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Clickable Record Details Modal */}
        {selectedVoucher && (() => {
          const { totalAmt, paidAmt, outAmt } = getVoucherFinancials(selectedVoucher);
          const voucherNum = selectedVoucher.entryNumber || selectedVoucher.entry_number || 'JV-XXX';
          const voucherRef = selectedVoucher.referenceId || selectedVoucher.reference_id || '';
          const isPayableModal = (selectedVoucher.entryType || selectedVoucher.entry_type) === 'PAYABLE';

          const directPartyId = selectedVoucher.partyId || selectedVoucher.party?.id;
          let foundParty = parties.find((p) => p.id === directPartyId);
          
          if (!foundParty) {
            const partyNameStr = getPartyName(selectedVoucher).toLowerCase();
            foundParty = parties.find((p) => p.name && partyNameStr.includes(p.name.toLowerCase()));
          }

          const activePartyId = foundParty?.id || directPartyId;
          const activePartyName = foundParty?.name || getPartyName(selectedVoucher);

          const clientJournals = Array.isArray(journals) 
            ? journals.filter((j) => {
                const jPartyId = j.partyId || j.party?.id;
                if (activePartyId && jPartyId === activePartyId) return true;
                if (activePartyName && getPartyName(j).toLowerCase().includes(activePartyName.toLowerCase())) return true;
                return false;
              }) 
            : [];

          const linkedContinuations = clientJournals.filter((j) => {
            const jNum = j.entryNumber || j.entry_number;
            const jDesc = (j.description || '').toLowerCase();
            const jRef = j.referenceId || j.reference_id || '';

            if (jNum === voucherNum) return false;

            const matchesVoucherNum = jDesc.includes(voucherNum.toLowerCase());
            const matchesReference = voucherRef !== '' && jRef === voucherRef;

            return matchesVoucherNum || matchesReference;
          });

          const primaryDisplayLines = getDisplayLines(selectedVoucher);
          const continualDisplayLines = linkedContinuations.flatMap(lc => getDisplayLines(lc));
          const allChainLines = [...primaryDisplayLines, ...continualDisplayLines];

          let chainTotalBusiness = totalAmt;
          let chainTotalPaid = paidAmt;

          linkedContinuations.forEach((lc) => {
            const { totalAmt: lcTot, paidAmt: lcPaid } = getVoucherFinancials(lc);
            chainTotalBusiness += lcTot;
            chainTotalPaid += lcPaid;
          });

          const chainBalance = Math.max(0, chainTotalBusiness - chainTotalPaid);

          let partyOverallBusiness = 0;
          let partyOverallPaid = 0;
          clientJournals.forEach((j) => {
            const { totalAmt: jTot, paidAmt: jPaid } = getVoucherFinancials(j);
            partyOverallBusiness += jTot;
            partyOverallPaid += jPaid;
          });

          const openingBalance = foundParty ? Number(foundParty.openingBalance || 0) : 0;
          const closingBalance = openingBalance + (partyOverallBusiness - partyOverallPaid);
          const isVoucherPaid = outAmt <= 0;

          return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm print:bg-white print:p-0">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl max-w-4xl w-full space-y-4 max-h-[95vh] overflow-y-auto text-slate-900 dark:text-white shadow-2xl border border-slate-800 print:shadow-none print:border-none print:max-h-none print:text-black print:dark:text-black">
                
                {/* Modal Header */}
                <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800 print:border-black">
                  <div>
                    <h4 className="font-bold text-base text-blue-600 dark:text-blue-400 print:text-black">
                      Voucher Report Slip & {isPayableModal ? 'Vendor Statement' : 'Client Statement'}: {voucherNum}
                    </h4>
                    <p className="text-xs font-semibold text-slate-500 print:text-gray-700">
                      {isPayableModal ? 'Vendor' : 'Client'}: <span className="text-slate-900 dark:text-white font-bold print:text-black">{activePartyName}</span>
                      {foundParty?.phone && <span className="ml-2 text-slate-400 print:text-gray-600">({foundParty.phone})</span>}
                    </p>
                  </div>
                  <button onClick={() => setSelectedVoucher(null)} className="text-slate-500 font-bold cursor-pointer text-lg print:hidden">✕</button>
                </div>

                <div className="text-xs space-y-1 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950 print:bg-gray-100 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p><strong>Date:</strong> {selectedVoucher.date}</p>
                  <p><strong>Type:</strong> {selectedVoucher.entryType || selectedVoucher.entry_type || 'RECEIVABLE'}</p>
                  <p><strong>Payment Mode:</strong> {selectedVoucher.paymentCategory || selectedVoucher.payment_category || 'CASH'}</p>
                  <p><strong>Reference:</strong> {voucherRef || 'N/A'}</p>
                  <p><strong>Voucher Total:</strong> <span className="text-emerald-400 print:text-green-700 font-bold">{totalAmt.toFixed(2)} BDT</span></p>
                  <p><strong>Settled / Paid:</strong> <span className="text-emerald-500 print:text-green-600 font-bold">{paidAmt.toFixed(2)} BDT</span></p>
                  <p><strong>{isPayableModal ? 'Due (AP):' : 'Outstanding (AR):'}</strong> <span className="text-amber-500 print:text-orange-600 font-bold">{outAmt.toFixed(2)} BDT</span></p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isVoucherPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {isVoucherPaid ? 'PAID' : (isPayableModal ? 'DUE' : 'OUTSTANDING')}
                    </span>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-200 text-white print:text-black border border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-slate-400 print:text-gray-700 font-semibold">Opening Balance</span>
                    <span className="text-sm font-mono font-bold">{openingBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col border-x border-slate-800 print:border-gray-400 px-2">
                    <span className="text-[10px] uppercase text-slate-400 print:text-gray-700 font-semibold">Total Business</span>
                    <span className="text-sm font-mono font-bold text-blue-400 print:text-blue-800">{partyOverallBusiness.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col px-2">
                    <span className="text-[10px] uppercase text-slate-400 print:text-gray-700 font-semibold">Total Settled</span>
                    <span className="text-sm font-mono font-bold text-emerald-400 print:text-green-700">{partyOverallPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col border-x border-slate-800 print:border-gray-400 px-2">
                    <span className="text-[10px] uppercase text-slate-400 print:text-gray-700 font-semibold">{isPayableModal ? 'Chain Due' : 'Chain Outstanding'}</span>
                    <span className="text-sm font-mono font-bold text-amber-400 print:text-orange-700">{chainBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-slate-400 print:text-gray-700 font-semibold">Net Closing Balance</span>
                    <span className="text-sm font-mono font-bold text-rose-400 print:text-red-700">{closingBalance.toFixed(2)} BDT</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 print:text-black"><strong>Narration / Remarks:</strong> {selectedVoucher.description || 'N/A'}</p>

                {linkedContinuations.length > 0 && (
                  <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-slate-950 print:bg-gray-50 border border-blue-200 dark:border-blue-900/40 space-y-2">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      🔗 Linked Continual Transactions ({linkedContinuations.length})
                    </h5>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {linkedContinuations.map((lc, lci) => {
                        const lcNum = lc.entryNumber || lc.entry_number;
                        const { totalAmt: lcTotal } = getVoucherFinancials(lc);
                        return (
                          <div key={lci} className="text-xs flex justify-between items-center bg-white dark:bg-slate-900 print:bg-white p-2 rounded border border-slate-200 dark:border-slate-800">
                            <span className="font-mono font-bold text-blue-600">{lcNum} ({lc.date})</span>
                            <span className="text-slate-500 truncate max-w-xs">{lc.description}</span>
                            <span className="font-mono text-emerald-400 print:text-green-700 font-bold">{lcTotal.toFixed(2)} BDT</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-500">Itemized Breakdown (Including Chain & Continual Records)</h5>
                  <table className="w-full text-xs border border-slate-200 dark:border-slate-800 print:border-black">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 print:bg-gray-200">
                        <th className="p-2 border border-slate-200 dark:border-slate-800 print:border-black text-left">Item Name</th>
                        <th className="p-2 border border-slate-200 dark:border-slate-800 print:border-black text-right">Qty & Unit</th>
                        <th className="p-2 border border-slate-200 dark:border-slate-800 print:border-black text-right">Unit Price</th>
                        <th className="p-2 border border-slate-200 dark:border-slate-800 print:border-black text-right">Debit</th>
                        <th className="p-2 border border-slate-200 dark:border-slate-800 print:border-black text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allChainLines.map((l, i) => (
                        <tr key={i}>
                          <td className="p-2 border border-slate-200 dark:border-slate-800 print:border-black font-mono font-semibold">{l.itemName || l.item_name || 'General Entry Line'}</td>
                          <td className="p-2 border border-slate-200 dark:border-slate-800 print:border-black text-right font-mono font-bold text-blue-600 print:text-black">{l.quantity ? `${l.quantity} ${l.unit || 'pieces'}` : '-'}</td>
                          <td className="p-2 border border-slate-200 dark:border-slate-800 print:border-black text-right font-mono">{l.unitPrice || l.unit_price ? Number(l.unitPrice || l.unit_price).toFixed(2) : '-'}</td>
                          <td className="p-2 border border-slate-200 dark:border-slate-800 print:border-black text-right font-mono text-emerald-500">{Number(l.debit || 0) > 0 ? Number(l.debit).toFixed(2) : '-'}</td>
                          <td className="p-2 border border-slate-200 dark:border-slate-800 print:border-black text-right font-mono text-amber-500">{Number(l.credit || 0) > 0 ? Number(l.credit).toFixed(2) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800 print:hidden">
                  <button
                    onClick={() => handleSettleOrPayPayment(selectedVoucher)}
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-emerald-700 transition"
                  >
                    💸 Record Payment / Settlement for this Voucher
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => window.print()} className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-xs font-semibold rounded-lg cursor-pointer">🖨 PDF / Print</button>
                    <button onClick={() => setSelectedVoucher(null)} className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg cursor-pointer">Close</button>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}