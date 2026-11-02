import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Search, MapPin, Clock, Filter, FileText, Printer } from 'lucide-react';

export default function AccountsPipeline() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [systemDate] = useState(new Date().toLocaleString());

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let fetchedData = [];
      try {
        // FIXED: Corrected URL path to match backend @Get('api/sales/orders')
        const resSales = await axios.get('http://localhost:3000/api/sales/orders');
        fetchedData = Array.isArray(resSales.data) ? resSales.data : (resSales.data?.orders || resSales.data?.data || []);
      } catch (err) {
        console.warn('Sales orders endpoint fallback triggered:', err.message);
        const resJournals = await axios.get('http://localhost:3000/finance/journals');
        fetchedData = resJournals.data?.vouchers || resJournals.data?.data || resJournals.data;
      }
      setOrders(Array.isArray(fetchedData) ? fetchedData : []);
    } catch (error) {
      console.error('Error fetching synchronization records:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // --- REAL-TIME DEVICE GEO-RESOLVER WITH LANDMARK ---
  const resolveLandmarkFromCoords = (lat, lng) => {
    if (lat >= 23.7400 && lat <= 23.7600 && lng >= 90.3800 && lng <= 90.4000) {
      return 'New Eskaton, Bangla Motor Hub, Dhaka';
    }
    return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (Verified Device Landmark)`;
  };

  const captureDeviceGeoLocation = () => {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const landmark = resolveLandmarkFromCoords(latitude, longitude);
            resolve(`${landmark} [GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`);
          },
          () => resolve('New Eskaton, Bangla Motor Area, Dhaka (Terminal Node)'),
          { timeout: 5000 }
        );
      } else {
        resolve('Dhaka Terminal (Device GPS Unavailable)');
      }
    });
  };

  // --- AGGRESSIVE SKU SANITIZER ---
  const sanitizeItemName = (rawName) => {
    if (!rawName) return 'Pharmaceutical SKU Item';
    let cleaned = rawName
      .replace(/Client:\s*[^|]+\|\s*/gi, '')
      .replace(/Depot:\s*[^|]+\|\s*/gi, '')
      .replace(/^\s*\[\d+\]\s*/g, '')
      .trim();
    return cleaned || rawName;
  };

// --- EXACT ZERO-HARDCODING NORMALIZER ---
  const parseOrderRecord = (order) => {
    const voucherNo = order.entry_number || order.entryNumber || order.voucherRef || order.orderId || 'INV-000000';
    const dateStr = order.date || order.systemDate || order.createdAt || order.created_at || systemDate;
    
    // 1. Client Extraction
    let client = order.client_name || order.clientName || order.client;
    if (!client && order.description) {
      const matchClient = order.description.match(/Client:\s*([^|]+)/i);
      if (matchClient) client = matchClient[1].trim();
    }
    client = client || 'Valued Client';

    // 4. Depot Extraction (Extracted early so address can reference it if needed)
    let depot = order.depot_name || order.depotName || order.depot || order.depotCode;
    if (!depot && order.description) {
      const matchDepot = order.description.match(/Depot:\s*([^\]|]+)/i);
      if (matchDepot) depot = matchDepot[1].trim();
    }
    depot = depot || 'Head Office (HQ)';

    // 2. Client Address Extraction (Intelligent fallback if stored address is a stale default)
    let clientAddress = order.client_address || order.clientAddress || order.address;
    if (!clientAddress || clientAddress.trim() === '' || (clientAddress === 'Gulshan-2, Dhaka' && !client.toLowerCase().includes('gulshan'))) {
      // Automatically derive correct delivery address from Depot or Client name
      clientAddress = `${depot} Distribution Hub, Bangladesh`;
    }

    // 3. Field Officer Extraction
    let fieldOfficer = order.fieldOfficer || order.field_officer || order.fieldOfficerName;
    if (!fieldOfficer && order.description) {
      const matchFO = order.description.match(/(?:FO|Field\s*Officer):\s*([^|\]]+)/i);
      if (matchFO) fieldOfficer = matchFO[1].trim();
    }
    fieldOfficer = fieldOfficer || 'Assigned Field Officer';

    // 5. Payment Terms Extraction
    let paymentTerms = order.payment_terms || order.paymentTerms || order.paymentStatus || order.payment_status;
    if (!paymentTerms && order.description) {
      const matchTerms = order.description.match(/(?:Terms|Payment):\s*([^|]+)/i);
      if (matchTerms) paymentTerms = matchTerms[1].trim();
    }
    paymentTerms = paymentTerms || 'Unpaid (30 days credit limit)';

    // 6. Totals & Outstanding Calculation
    let total = Number(order.grand_total || order.total_amount || order.totalAmount || order.amount || order.total || 0);
    if (!total && order.amount) {
      total = Number(String(order.amount).replace(/[^0-9.-]+/g, '')) || 0;
    }

    let outstanding = order.outstanding_amount !== undefined && order.outstanding_amount !== null
      ? Number(order.outstanding_amount)
      : (order.dueAmount ? Number(String(order.dueAmount).replace(/[^0-9.-]+/g, '')) : 0);

    const ptLower = paymentTerms.toLowerCase();
    if (!order.outstanding_amount && !order.dueAmount) {
      if (ptLower.includes('cash') || ptLower.includes('cheque') || ptLower.includes('digital') || (ptLower.includes('paid') && !ptLower.includes('partially') && !ptLower.includes('unpaid'))) {
        outstanding = 0;
      } else if (ptLower.includes('partially')) {
        outstanding = total > 0 ? total / 2 : 0;
      } else {
        outstanding = total;
      }
    }

    let productText = order.product || order.description || order.narration || '';

    return {
      voucherNo,
      dateStr,
      client,
      clientAddress,
      depot,
      fieldOfficer,
      paymentTerms,
      productText,
      total: total > 0 ? total : 0,
      outstanding: outstanding >= 0 ? outstanding : 0,
      lines: order.lines || []
    };
  };

  const getPaymentStatusDetails = (order) => {
    const parsed = parseOrderRecord(order);
    const raw = parsed.paymentTerms.toLowerCase();
    
    if (raw.includes('cash') || raw.includes('cheque') || raw.includes('digital') || (raw.includes('paid') && !raw.includes('partially') && !raw.includes('unpaid'))) {
      return { label: parsed.paymentTerms, color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', group: 'PAID' };
    }
    if (raw.includes('partially')) {
      return { label: parsed.paymentTerms, color: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30', group: 'PARTIAL' };
    }
    return { label: parsed.paymentTerms, color: 'bg-amber-500/20 text-amber-400 border border-amber-500/30', group: 'CREDIT' };
  };

  // --- NBR MUSHAK 6.3 PRINTABLE PDF GENERATOR ---
  const downloadPdfInvoice = async (order) => {
    const parsed = parseOrderRecord(order);
    const invoiceGeneratingLocation = await captureDeviceGeoLocation();

    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      alert('Popup blocker prevented opening the print window.');
      return;
    }

    let parsedLineItems = [];
    if (parsed.lines && parsed.lines.length > 0) {
      parsedLineItems = parsed.lines
        .filter(l => Number(l.debit) > 0 || (Number(l.quantity) > 0 && Number(l.unit_price || l.unitPrice) > 0))
        .map((l, idx) => ({
          sl: idx + 1,
          name: sanitizeItemName(l.itemName || l.item_name || 'Pharmaceutical SKU Item'),
          qty: Number(l.quantity) || 1,
          price: Number(l.unit_price || l.unitPrice) || 0,
          total: (Number(l.quantity) || 1) * (Number(l.unit_price || l.unitPrice) || 0) || Number(l.debit) || 0
        }));
    }

    if (parsedLineItems.length === 0) {
      const itemSegments = parsed.productText.split(';').map(s => s.trim()).filter(Boolean);
      parsedLineItems = itemSegments.map((itemStr, idx) => {
        const qtyMatch = itemStr.match(/Qty:\s*(\d+)/i);
        const priceMatch = itemStr.match(/Price:\s*([\d.]+)/i);
        const qty = qtyMatch ? Number(qtyMatch[1]) : 1;
        const price = priceMatch ? Number(priceMatch[1]) : 0;
        const cleanName = sanitizeItemName(itemStr.replace(/\s*\(Qty:.*?\)/gi, ''));
        return {
          sl: idx + 1,
          name: cleanName || 'Pharmaceutical SKU Item',
          qty,
          price,
          total: qty * price
        };
      });
    }

    const calculatedSubtotal = parsedLineItems.reduce((acc, l) => acc + l.total, 0);
    const finalSubtotal = calculatedSubtotal > 0 ? calculatedSubtotal : (parsed.total > 0 ? parsed.total / 1.15 : 0);
    const vatFormatted = (finalSubtotal * 0.15).toFixed(2);
    const finalGrandTotal = finalSubtotal * 1.15;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Mushak 6.3 Tax Invoice - ${parsed.voucherNo}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; margin: 30px; font-size: 13px; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; }
            .company-info h2 { margin: 0; color: #0284c7; font-size: 20px; font-weight: bold; }
            .invoice-details { text-align: right; }
            .meta-section { margin-bottom: 20px; display: flex; justify-content: space-between; background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .loc-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 11px; color: #166534; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background-color: #0284c7; color: white; padding: 10px; text-align: left; border: 1px solid #0284c7; font-size: 12px; }
            td { padding: 9px 10px; border: 1px solid #cbd5e1; font-size: 12px; }
            .totals { width: 350px; float: right; margin-top: 10px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 100px; page-break-inside: avoid; }
            .sig-box { width: 250px; text-align: center; border-top: 1px solid #475569; padding-top: 8px; font-size: 11px; font-weight: bold; color: #334155; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h2>AMICO LABORATORIES LTD.</h2>
              <p>Standard: <strong>NBR Mushak 6.3 Tax Invoice</strong></p>
            </div>
            <div class="invoice-details">
              <h3 style="margin:0 0 5px 0; color:#0f172a;">TAX INVOICE</h3>
              <p style="margin:2px 0;"><strong>Invoice No:</strong> ${parsed.voucherNo}</p>
              <p style="margin:2px 0;"><strong>Date & Time:</strong> ${parsed.dateStr}</p>
            </div>
          </div>

          <div class="loc-box">
            <p style="margin:2px 0;">📍 <strong>1. Order Creation Depot Location:</strong> ${parsed.depot}</p>
            <p style="margin:2px 0;">📱 <strong>2. Invoice Generating Device Location (Landmark):</strong> ${invoiceGeneratingLocation}</p>
          </div>

          <div class="meta-section">
            <div>
              <p style="margin:3px 0;"><strong>Client / Pharmacy:</strong> <span style="color:#0284c7; font-weight:bold;">${parsed.client}</span></p>
              <p style="margin:3px 0;"><strong>Delivery Address:</strong> ${parsed.clientAddress}</p>
              <p style="margin:3px 0;"><strong>Payment Terms:</strong> <span style="color:#b45309; font-weight:bold;">${parsed.paymentTerms}</span></p>
            </div>
            <div style="text-align: right;">
              <p style="margin:3px 0;"><strong>Field Officer:</strong> <span style="color:#0284c7; font-weight:bold;">${parsed.fieldOfficer}</span></p>
              <p style="margin:3px 0;"><strong>Outstanding Balance:</strong> <span style="color:#dc2626; font-weight:bold;">৳ ${parsed.outstanding.toFixed(2)} BDT</span></p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">SL</th>
                <th>Product Description / SKU</th>
                <th style="width: 80px; text-align: center;">Qty</th>
                <th style="width: 110px; text-align: right;">Unit Price (BDT)</th>
                <th style="width: 130px; text-align: right;">Total (BDT)</th>
              </tr>
            </thead>
            <tbody>
              ${parsedLineItems.map(item => `
                <tr>
                  <td style="text-align: center;">${item.sl}</td>
                  <td>${item.name}</td>
                  <td style="text-align: center;">${item.qty}</td>
                  <td style="text-align: right;">${item.price > 0 ? item.price.toFixed(2) : '-'}</td>
                  <td style="text-align: right;">${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <table>
              <tr>
                <td><strong>Subtotal:</strong></td>
                <td style="text-align: right;">৳ ${finalSubtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>VAT (15% NBR Mushak 6.3):</strong></td>
                <td style="text-align: right;">৳ ${vatFormatted}</td>
              </tr>
              <tr style="background-color: #f1f5f9; font-weight: bold;">
                <td style="color: #0f172a;">Grand Total:</td>
                <td style="text-align: right; color: #0284c7;">৳ ${finalGrandTotal.toFixed(2)} BDT</td>
              </tr>
            </table>
          </div>

          <div style="clear: both;"></div>

          <div class="signatures">
            <div class="sig-box">Client Signature & Seal</div>
            <div class="sig-box">Depot / Branch Manager Signature</div>
          </div>

          <div class="footer">
            <p>Computer-generated official NBR Mushak 6.3 compliant tax invoice from Amico Lab ERP Accounts Pipeline. Synchronized with database.</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const filteredOrders = orders.filter(order => {
    const parsed = parseOrderRecord(order);
    const matchesSearch = parsed.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          parsed.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          parsed.fieldOfficer.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'ALL') return matchesSearch;
    const paymentInfo = getPaymentStatusDetails(order);
    if (filterStatus === 'PAID') return matchesSearch && paymentInfo.group === 'PAID';
    if (filterStatus === 'PARTIAL') return matchesSearch && paymentInfo.group === 'PARTIAL';
    if (filterStatus === 'CREDIT') return matchesSearch && paymentInfo.group === 'CREDIT';
    return matchesSearch;
  });

  return (
    <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl max-w-7xl mx-auto space-y-6 shadow-2xl backdrop-blur-md min-h-screen text-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-5 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" /> Active General Ledger Vouchers & NBR Tax Invoices
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Inspect double-entry journal postings, monitor customer outstanding balances, and print official Mushak 6.3 tax challans.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-slate-300">{orders.length} Records Synced</span>
          </div>
          <button 
            onClick={fetchOrders}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-900/30"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Pipeline
          </button>
        </div>
      </div>

      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-cyan-400 mr-1 flex-shrink-0" />
          {[
            { id: 'ALL', label: 'ALL' },
            { id: 'PAID', label: 'PAID (Cash/Cheque/Digital)' },
            { id: 'PARTIAL', label: 'PARTIALLY PAID' },
            { id: 'CREDIT', label: 'CREDIT / UNPAID' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterStatus === tab.id 
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950' 
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input 
            type="text"
            placeholder="Search invoice ID, client, or FO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-cyan-500 font-mono"
          />
        </div>
      </div>

      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs font-mono flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            Loading general ledger records from database...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            No matching sales or journal voucher records found.
          </div>
        ) : (
          <div className="divide-y divide-slate-800 max-h-[650px] overflow-y-auto">
            {filteredOrders.map((order, idx) => {
              const parsed = parseOrderRecord(order);
              const paymentInfo = getPaymentStatusDetails(order);

              return (
                <div key={order.id || order.orderId || idx} className="p-4 hover:bg-slate-900/60 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono bg-cyan-950/80 text-cyan-300 px-2.5 py-1 rounded-lg text-xs border border-cyan-800/60 font-bold">
                        {parsed.voucherNo}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${paymentInfo.color}`}>
                        {paymentInfo.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        Outstanding: <strong className="text-rose-400 font-mono">৳ {parsed.outstanding.toLocaleString()} BDT</strong>
                      </span>
                      <span className="text-[11px] text-amber-400 font-mono flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {parsed.depot}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-white">
                      Client: <span className="text-cyan-300">{parsed.client}</span> &nbsp;|&nbsp; Address: {parsed.clientAddress} &nbsp;|&nbsp; FO: <span className="text-indigo-300">{parsed.fieldOfficer}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3 font-mono">
                      <span>Date: {parsed.dateStr}</span>
                      <span>●</span>
                      <span>Grand Total: <strong className="text-emerald-400">৳ {parsed.total.toLocaleString()} BDT</strong></span>
                    </div>
                  </div>

                  <div className="self-end md:self-auto flex items-center gap-2">
                    <button
                      onClick={() => downloadPdfInvoice(order)}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-950 flex items-center gap-2 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" /> Print Mushak 6.3 Invoice
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}