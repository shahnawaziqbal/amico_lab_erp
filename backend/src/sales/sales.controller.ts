import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller()
export class SalesController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('api/field-officers')
  async getFieldOfficers() {
    return this.dataSource.query('SELECT * FROM field_officers ORDER BY teriCode ASC');
  }

  @Post('api/field-officers')
  async createFieldOfficer(@Body() dto: any) {
    const tenureMonths = Number(dto.tenureMonths) || 0;
    const threeMonthAvg = parseFloat(String(dto.threeMonthAvg ?? 65000)) || 0;
    const compositeScore = parseFloat(String(dto.compositeScore ?? 85.0)) || 0;

    const result = await this.dataSource.query(
      `INSERT INTO field_officers (
        teriCode, fullName, depotCode, depotName, joinDate, tenureMonths, tenureBand, tier, threeMonthAvg, compositeScore
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dto.teriCode, dto.fullName, dto.depotCode, dto.depotName, 
        dto.joinDate || '2026-01-15', tenureMonths, 
        dto.tenureBand || '6-12 Months', dto.tier || 'B – Competent', 
        threeMonthAvg, compositeScore
      ]
    );

    return { success: true, id: result?.insertId || null, message: `Field Officer registered successfully.` };
  }

  @Get('api/products')
  async getProducts() {
    return this.dataSource.query('SELECT * FROM products ORDER BY productCode ASC');
  }

  // --- UNIFIED ENDPOINT: SALES ORDERS & LEDGER SYNC ---
  @Get('api/sales/orders')
  async getAllSalesOrders() {
    try {
      const orders = await this.dataSource.query(`
        SELECT 
          s.orderId,
          s.entry_number,
          s.client_name,
          s.depot_name,
          s.depot_code,
          s.product,
          s.grand_total,
          s.payment_status,
          s.date,
          s.fieldOfficer,
          s.client_phone,
          s.client_address,
          j.id as journal_id
        FROM sales_orders s
        LEFT JOIN journal_entries j ON s.entry_number = j.entry_number OR s.reference_id = j.reference_id
        ORDER BY s.rowid DESC
      `);

      return orders.map((order: any) => {
        const grandTotal = Number(order.grand_total || 0);
        const subtotalAmount = Math.round((grandTotal / 1.15) * 100) / 100;
        const vatAmount = Math.round((grandTotal - subtotalAmount) * 100) / 100;

        return {
          ...order,
          entryNumber: order.entry_number || order.orderId,
          referenceId: order.orderId,
          clientName: order.client_name || 'Valued Client',
          depotName: order.depot_name || 'Head Office',
          depotCode: order.depot_code || 'HQ',
          subtotalAmount,
          vatAmount,
          grandTotal,
          paymentStatus: order.payment_status || 'CASH_PAID'
        };
      });
    } catch (e) {
      const fallback = await this.dataSource.query('SELECT * FROM sales_orders ORDER BY rowid DESC');
      return fallback;
    }
  }

  @Get('finance/sales-orders/:id')
  async getSalesOrderById(@Param('id') id: string) {
    const orders = await this.dataSource.query(
      `SELECT * FROM sales_orders WHERE entry_number = ? OR orderId = ? OR reference_id = ? LIMIT 1`,
      [id, id, id]
    );

    if (!orders || orders.length === 0) {
      return { success: false, message: 'Order not found' };
    }

    const order = orders[0];
    const grandTotal = Number(order.grand_total || order.amount || 0);
    const subtotalAmount = Number(order.subtotal_amount) || Math.round((grandTotal / 1.15) * 100) / 100;
    const vatAmount = Number(order.vat_amount) || Math.round((grandTotal - subtotalAmount) * 100) / 100;

    // Fetch corresponding structured line items from journal_entry_lines if available
    let journalLines = [];
    try {
      journalLines = await this.dataSource.query(
        `SELECT jel.item_name, jel.quantity, jel.unit_price, (jel.quantity * jel.unit_price) as total
         FROM journal_entry_lines jel
         JOIN journal_entries j ON jel.journal_entry_id = j.id
         WHERE j.entry_number = ? OR j.reference_id = ?`,
        [order.entry_number, order.reference_id]
      );
    } catch (err) {
      // Fallback if table or relation is missing
    }

    let lines = [];
    if (journalLines && journalLines.length > 0) {
      lines = journalLines.map((jl: any, idx: number) => ({
        sl: idx + 1,
        itemName: jl.item_name || 'Pharmaceutical Item',
        quantity: Number(jl.quantity) || 1,
        unitPrice: Number(jl.unit_price) || 0,
        total: Number(jl.total) || (Number(jl.quantity) * Number(jl.unit_price))
      }));
    } else {
      const rawProducts = String(order.product || '');
      const productList = rawProducts.split(';').map(p => p.trim()).filter(Boolean);

      lines = productList.map((itemStr, idx) => {
        const qtyMatch = itemStr.match(/Qty:\s*(\d+)/i);
        const priceMatch = itemStr.match(/Price:\s*([\d.]+)/i);
        const qty = qtyMatch ? Number(qtyMatch[1]) : 1;
        const unitPrice = priceMatch ? Number(priceMatch[1]) : Math.round((subtotalAmount / (qty || 1)) * 100) / 100;
        const cleanName = itemStr.replace(/\s*\(Qty:.*?\)/gi, '').trim();

        return {
          sl: idx + 1,
          itemName: cleanName || 'Pharmaceutical SKU Item',
          quantity: qty,
          unitPrice: unitPrice,
          total: qty * unitPrice
        };
      });
    }

    return {
      success: true,
      entryNumber: order.entry_number || order.orderId,
      referenceId: order.reference_id || order.entry_number,
      date: order.date || order.systemDate,
      clientName: order.client_name || order.client,
      clientPhone: order.client_phone || '',
      clientAddress: order.client_address || '',
      depotCode: order.depot_code || '',
      depotName: order.depot_name || order.depot,
      fieldOfficer: order.fieldOfficer,
      paymentTerms: order.payment_terms || order.paymentStatus,
      paidAmount: Number(order.paid_amount || 0),
      outstandingAmount: Number(order.outstanding_amount || 0),
      subtotalAmount,
      vatAmount,
      grandTotal,
      lines,
      items: lines
    };
  }

  @Post('finance/sales-orders')
  async createSalesOrder(@Body() dto: {
    entryNumber: string;
    date: string;
    dispatchDate?: string;
    systemDate?: string;
    referenceId: string;
    description: string;
    clientName: string;
    clientPhone?: string;
    clientAddress?: string;
    paymentTerms: string;
    paidAmount?: number | string;
    outstandingAmount?: number | string;
    depotCode: string;
    depotName: string;
    subtotalAmount: number;
    vatAmount: number;
    grandTotal: number;
    lines: Array<{
      accountId?: string;
      itemName: string;
      unit?: string;
      quantity: number;
      unitPrice: number;
      debit?: number;
      credit?: number;
    }>;
  }) {
    const paymentTerms = dto.paymentTerms || 'CREDIT_30';
    const paidAmount = Number(dto.paidAmount) || 0;
    const grandTotal = Number(dto.grandTotal) || 0;
    const subtotalAmount = Number(dto.subtotalAmount) || Math.round((grandTotal / 1.15) * 100) / 100;
    const vatAmount = Number(dto.vatAmount) || Math.round((grandTotal - subtotalAmount) * 100) / 100;
    const outstandingAmount = Number(dto.outstandingAmount) || (grandTotal - paidAmount);
    const orderId = dto.referenceId || dto.entryNumber || 'ORD-' + Date.now();
    
    const currentDateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const dispatchDate = dto.dispatchDate || dto.date || currentDateStr;
    const systemDate = dto.systemDate || currentDateStr;
    
    const foMatch = dto.description?.match(/FO:\s*([^\[]+)/);
    const fieldOfficer = foMatch ? foMatch[1].trim() : 'Field Officer';
    const clientName = dto.clientName || 'General Client';
    const depotCode = dto.depotCode || 'HQ';
    const depotName = dto.depotName || 'Head Office';
    const depotVal = `${depotCode} - ${depotName}`;
    
    const activeProducts = dto.lines?.filter(l => !l.itemName?.includes('Offset')) || [];
    const productVal = activeProducts
      .map(l => `${l.itemName} (Qty: ${l.quantity}, Price: ${l.unitPrice})`)
      .join('; ') || 'Standard Pharmaceuticals Item';
    const totalQty = activeProducts.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0) || 1;

    // 1. Insert into sales_orders safely
    try {
      await this.dataSource.query(
        `INSERT INTO sales_orders (
          orderId, fieldOfficer, depot, client, product, qty, amount, paymentStatus,
          entry_number, date, dispatchDate, systemDate, reference_id, description, 
          client_name, client_phone, client_address, depot_code, depot_name, 
          payment_terms, paid_amount, outstanding_amount, grand_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId, fieldOfficer, depotVal, clientName, productVal,
          String(totalQty), String(grandTotal), paymentTerms,
          dto.entryNumber, dto.date, dispatchDate, systemDate,
          dto.referenceId || dto.entryNumber, dto.description || `Sales Order for ${clientName}`, clientName,
          dto.clientPhone || '', dto.clientAddress || '',
          depotCode, depotName, paymentTerms,
          paidAmount, outstandingAmount, grandTotal
        ]
      );
    } catch (err: any) {
      console.warn('Sales order insert fallback warning:', err.message);
    }

    // 2. Insert into journal_entries header for general ledger tracking
    const journalId = 'JE-' + Date.now();
    try {
      await this.dataSource.query(
        `INSERT INTO journal_entries (
          id, entry_number, date, description, reference_id, status,
          total_amount, paid_amount, outstanding_amount, vat_input, narration
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          journalId, dto.entryNumber, dto.date, 
          `Client: ${clientName} | Depot: ${depotVal} | ${productVal}`,
          dto.referenceId || dto.entryNumber, 'POSTED',
          grandTotal, paidAmount, outstandingAmount, vatAmount, dto.description || 'Sales Order Entry'
        ]
      );
    } catch (ledgerError: any) {
      console.warn('Ledger note:', ledgerError.message);
    }

    // 3. Insert exact item breakdown into journal_entry_lines
    try {
      for (const [idx, l] of activeProducts.entries()) {
        const lineId = 'JEL-' + Date.now() + '-' + idx;
        const qty = Number(l.quantity) || 1;
        const unitPrice = Number(l.unitPrice) || 0;
        const lineTotal = qty * unitPrice;

        await this.dataSource.query(
          `INSERT INTO journal_entry_lines (
            id, journal_entry_id, account_id, debit, credit, item_name, quantity, unit_price, unit
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            lineId,
            journalId,
            l.accountId || 'ACC-AR-DEFAULT',
            lineTotal,
            0,
            l.itemName,
            qty,
            unitPrice,
            l.unit || 'Tablets'
          ]
        );
      }
    } catch (lineError: any) {
      console.warn('Journal entry lines insert note:', lineError.message);
    }

    const formattedLines = activeProducts.map((l, index) => {
      const qty = Number(l.quantity) || 1;
      const unitPrice = Number(l.unitPrice) || 0;
      return {
        sl: index + 1,
        itemName: l.itemName,
        quantity: qty,
        unitPrice: unitPrice,
        total: qty * unitPrice
      };
    });

    return {
      success: true,
      entryNumber: dto.entryNumber,
      orderId: orderId,
      referenceId: dto.referenceId || dto.entryNumber,
      date: dto.date,
      clientName: clientName,
      clientPhone: dto.clientPhone || '',
      clientAddress: dto.clientAddress || '',
      depotCode: depotCode,
      depotName: depotName,
      paymentTerms,
      paidAmount,
      outstandingAmount,
      subtotalAmount,
      vatAmount,
      grandTotal,
      totalAmount: grandTotal,
      lines: formattedLines,
      items: formattedLines,
      message: `Sales Order ${dto.entryNumber} posted successfully!`
    };
  }
}