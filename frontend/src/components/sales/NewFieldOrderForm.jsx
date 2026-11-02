import React, { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin, ShoppingCart, Clock, ShieldCheck, FileText } from 'lucide-react';
import axios from 'axios';

export default function NewFieldOrderForm({ products, fieldOfficers, accounts, systemDate, setSuccessToast, onOrderSuccess }) {
  const [selectedTeri, setSelectedTeri] = useState(fieldOfficers[0]?.teriCode || '');
  const selectedFo = fieldOfficers.find(f => f.teriCode === selectedTeri) || fieldOfficers[0] || {};

  const [clientName, setClientName] = useState('Central Medical Hall');
  const [clientPhone, setClientPhone] = useState('01700000000');
  const [clientAddress, setClientAddress] = useState('Gulshan-2, Dhaka');
  
  // Expanded Enterprise Payment Terms State
  const [paymentTerms, setPaymentTerms] = useState('CASH_PAID');
  const [partialPaidAmount, setPartialPaidAmount] = useState(0);

  // Real-Time Live Clock State
  const [liveTimestamp, setLiveTimestamp] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', {
        month: 'long',
        day: '2-digit',
        year: 'numeric'
      });
      const formattedTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setLiveTimestamp(`${formattedDate} at ${formattedTime}`);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Multi-item rows state
  const [orderItems, setOrderItems] = useState([
    {
      productCode: products[0]?.productCode || '',
      itemName: products[0]?.productName || 'Amiflox 500 Tablet',
      unit: products[0]?.unit || 'Tablets',
      quantity: 100,
      unitPrice: 250.00
    }
  ]);

  const handleAddItem = () => {
    const defaultProd = products[0] || {};
    setOrderItems([
      ...orderItems,
      {
        productCode: defaultProd.productCode || '',
        itemName: defaultProd.productName || 'Standard Product',
        unit: defaultProd.unit || 'Tablets',
        quantity: 50,
        unitPrice: 200.00
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (orderItems.length === 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...orderItems];
    updated[index][field] = value;
    if (field === 'productCode') {
      const p = products.find(prod => prod.productCode === value);
      if (p) {
        updated[index].itemName = p.productName;
        updated[index].unit = p.unit || 'Tablets';
      }
    }
    setOrderItems(updated);
  };

  // Calculations: Subtotal, 15% NBR Mushak 6.3 VAT, and Grand Total
  const subtotalAmount = orderItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const vatAmount = subtotalAmount * 0.15; // 15% Standard NBR VAT rate
  const grandTotal = subtotalAmount + vatAmount;

  // Outstanding calculation for partial payment
  const effectivePaidAmount = paymentTerms === 'PARTIAL_PAID' ? Number(partialPaidAmount) || 0 : (paymentTerms.includes('PAID') ? grandTotal : 0);
  const effectiveOutstanding = Math.max(0, grandTotal - effectivePaidAmount);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (subtotalAmount <= 0) {
      alert('Order total must be greater than zero.');
      return;
    }

    const arAcc = accounts.find(a => a.code === '11500')?.id || accounts[0]?.id;
    const salesAcc = accounts.find(a => a.code === '41100')?.id || accounts[1]?.id;

    // Build multi-line journal entries
    const lines = orderItems.map(item => ({
      accountId: arAcc,
      itemName: `[${item.productCode}] ${item.itemName}`,
      unit: item.unit,
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      debit: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      credit: 0
    }));

    // Add Sales Revenue offsetting credit line
    lines.push({
      accountId: salesAcc,
      itemName: 'Sales Revenue Offset (Multi-Item Invoice)',
      unit: 'N/A',
      quantity: 0,
      unitPrice: 0,
      debit: 0,
      credit: subtotalAmount
    });

    const payload = {
      entryNumber: 'INV-' + Date.now().toString().slice(-6),
      date: liveTimestamp || systemDate,
      referenceId: 'SO-' + Date.now().toString().slice(-5),
      description: `Sales Order via FO: ${selectedFo.teriCode} - ${selectedFo.fullName || selectedFo.name} [Depot: ${selectedFo.depotCode} - ${selectedFo.depotName}] - Client: ${clientName}`,
      clientName,
      clientPhone,
      clientAddress,
      paymentTerms,
      paidAmount: effectivePaidAmount,
      outstandingAmount: effectiveOutstanding,
      depotCode: selectedFo.depotCode || 'DK',
      depotName: selectedFo.depotName || 'Dhaka',
      subtotalAmount,
      vatAmount,
      grandTotal,
      lines
    };

    try {
      await axios.post('http://localhost:3000/finance/sales-orders', payload);
      setSuccessToast(`Multi-item Sales Order ${payload.entryNumber} successfully posted (Total: ৳${grandTotal.toLocaleString()})!`);
      setTimeout(() => setSuccessToast(''), 5000);
      if (onOrderSuccess) onOrderSuccess();
    } catch (err) {
      alert('Failed to post sales order: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl max-w-5xl mx-auto space-y-6 shadow-2xl backdrop-blur-md">
      {/* Header with Live Real-Time System Timestamp */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div>
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-cyan-400" /> Multi-Item Sales Order & General Ledger Invoicing
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-bind territory depot, add multiple SKUs, and generate real-time NBR Mushak 6.3 tax invoice.
          </p>
        </div>

        <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-emerald-500/30 flex items-center gap-3 self-start md:self-auto">
          <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
          <div>
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
              System Invoicing Time (Live)
            </span>
            <span className="text-xs font-mono font-bold text-slate-200">
              {liveTimestamp || 'Loading timestamp...'}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleCreateOrder} className="space-y-5">
        {/* Field Officer & Auto-Bound Depot Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-300 block mb-1 font-medium">
              Select Field Officer ({fieldOfficers.length} Available)
            </label>
            <select 
              value={selectedTeri} 
              onChange={(e) => setSelectedTeri(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-cyan-400 outline-none cursor-pointer font-mono font-medium focus:border-cyan-500"
            >
              {fieldOfficers.map((fo, idx) => (
                <option key={idx} value={fo.teriCode}>
                  {fo.teriCode} : {fo.fullName || fo.name} [{fo.depotCode} - {fo.depotName}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-300 block mb-1 font-medium">
              Auto-Bound Territory Depot (Assigned Region)
            </label>
            <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-400 font-mono font-bold flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>Depot: {selectedFo.depotCode || 'DK'} — {selectedFo.depotName || 'Dhaka'}</span>
            </div>
          </div>
        </div>

        {/* Client Details & Dynamic Payment Terms */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-300 block mb-1 font-medium">Client / Pharmacy Name</label>
            <input 
              type="text" 
              value={clientName} 
              onChange={(e) => setClientName(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-500" 
              required 
            />
          </div>
          <div>
            <label className="text-xs text-slate-300 block mb-1 font-medium">Client Phone / Contact</label>
            <input 
              type="text" 
              value={clientPhone} 
              onChange={(e) => setClientPhone(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-mono focus:border-cyan-500" 
            />
          </div>
          <div>
            <label className="text-xs text-slate-300 block mb-1 font-medium">Payment Mode & Terms</label>
            <select
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none cursor-pointer focus:border-cyan-500 font-semibold text-cyan-300"
            >
              <option value="CASH_PAID">Paid (Cash)</option>
              <option value="CHEQUE_PAID">Paid (Bank Cheque)</option>
              <option value="DIGITAL_PAID">Paid (Digital Payment)</option>
              <option value="PARTIAL_PAID">Partially Paid</option>
              <option value="CREDIT_15">Unpaid (15 days of credit limit)</option>
              <option value="CREDIT_30">Unpaid (30 days credit limit)</option>
            </select>
          </div>
        </div>

        {/* Conditional Partial Payment Input */}
        {paymentTerms === 'PARTIAL_PAID' && (
          <div className="bg-slate-950 p-4 rounded-2xl border border-blue-500/30 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
            <div>
              <label className="text-xs text-blue-400 block mb-1 font-bold">Enter Paid Amount (BDT)</label>
              <input 
                type="number" 
                value={partialPaidAmount}
                onChange={(e) => setPartialPaidAmount(e.target.value)}
                className="w-full bg-slate-900 border border-blue-500/50 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none"
                placeholder="e.g., 20000"
                min="0"
                max={grandTotal}
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-bold">Calculated Outstanding Balance (BDT)</label>
              <div className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-amber-400 font-mono font-bold flex items-center">
                ৳ {effectiveOutstanding.toLocaleString()} BDT
              </div>
            </div>
          </div>
        )}

        {/* Multi-Item Product Line Items Table */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex justify-between items-center">
            <h5 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Product SKUs Line Items ({orderItems.length})
            </h5>
            <button 
              type="button" 
              onClick={handleAddItem}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-cyan-900/30"
            >
              <Plus className="w-3.5 h-3.5" /> Add Another Product SKU
            </button>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {orderItems.map((item, idx) => (
              <div key={idx} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-5">
                  <label className="text-[10px] text-slate-400 block mb-1">Product SKU ({products.length} Loaded)</label>
                  <select 
                    value={item.productCode} 
                    onChange={(e) => handleItemChange(idx, 'productCode', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-400 font-mono outline-none cursor-pointer"
                  >
                    {products.map((p, i) => (
                      <option key={i} value={p.productCode}>
                        {p.productCode} - {p.productName} ({p.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-1">Quantity</label>
                  <input 
                    type="number" 
                    value={item.quantity} 
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                    min="1"
                    required 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-1">Unit Price (BDT)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={item.unitPrice} 
                    onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                    required 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-1">Subtotal</label>
                  <div className="text-xs font-mono font-bold text-emerald-400 py-2">
                    ৳ {((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toLocaleString()}
                  </div>
                </div>

                <div className="md:col-span-1 flex justify-end pt-4">
                  {orderItems.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveItem(idx)}
                      className="p-2 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/30 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NBR Mushak 6.3 Compliant Valuation Breakdown Footer */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              <span>Subtotal: <strong className="text-slate-200">৳ {subtotalAmount.toLocaleString()}</strong></span>
              <span>●</span>
              <span className="text-amber-400">NBR VAT (15% Mushak 6.3): <strong>৳ {vatAmount.toLocaleString()}</strong></span>
            </div>
            <div className="text-xl font-mono font-bold text-emerald-400 flex items-center gap-2">
              <span>৳ {grandTotal.toLocaleString()} BDT</span>
              <span className="text-[10px] font-sans font-normal bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> NBR Tax Compliant
              </span>
            </div>
          </div>

          <button 
            type="submit" 
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/40 cursor-pointer transition-all flex items-center gap-2 self-end md:self-auto"
          >
            <Plus className="w-4 h-4" /> Post Multi-Item Order & Sync Ledger
          </button>
        </div>
      </form>
    </div>
  );
}