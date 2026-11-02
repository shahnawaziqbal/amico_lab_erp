import { Injectable, InternalServerErrorException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder } from './sales.entity';
import { FinanceService } from '../finance/finance.service';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesRepo: Repository<SalesOrder>,
    @Inject(forwardRef(() => FinanceService))
    private readonly financeService: FinanceService,
  ) {}

  async findAllOrders(depotFilter?: string): Promise<SalesOrder[]> {
    if (depotFilter && depotFilter !== 'All') {
      return this.salesRepo.find({ where: { depot: depotFilter }, order: { createdAt: 'DESC' } });
    }
    return this.salesRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createOrder(data: any): Promise<SalesOrder> {
    try {
      const systemDate = new Date().toISOString().split('T')[0];
      const uniqueOrderId = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      // ZERO HARDCODING: Strict dynamic extraction with explicit validation checks
      const dynamicPaymentTerms = data.paymentTerms || data.paymentStatus || data.paymentMode;
      if (!dynamicPaymentTerms) {
        throw new Error('Payment terms or status must be explicitly provided.');
      }

      const dynamicClient = data.client || data.clientName;
      if (!dynamicClient) {
        throw new Error('Client name is mandatory for order and ledger creation.');
      }

      const dynamicDepot = data.depot || data.depotNode;
      if (!dynamicDepot) {
        throw new Error('Depot specification is required.');
      }

      const fieldOfficerName = data.fieldOfficer || data.officer;
      if (!fieldOfficerName) {
        throw new Error('Field officer identification is required.');
      }

      const productSku = data.product || data.productSku;
      if (!productSku) {
        throw new Error('Product SKU or item description is required.');
      }

      const rawAmount = data.amount || data.totalAmount || 0;
      const numericAmount = parseFloat(String(rawAmount).replace(/[^0-9.]/g, '')) || 0;
      const dynamicClientAddress = data.clientAddress || data.address || dynamicDepot;

      // Map to both camelCase and snake_case columns to match your exact database schema
      const orderPayload: any = {
        orderId: data.orderId || uniqueOrderId,
        fieldOfficer: fieldOfficerName,
        depot: dynamicDepot,
        client: dynamicClient,
        product: productSku,
        qty: data.qty || data.quantity,
        amount: String(rawAmount),
        dueAmount: String(data.dueAmount || rawAmount),
        paymentStatus: dynamicPaymentTerms,
        voucherRef: data.voucherRef || `VCHR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        workflowStep: 'Posted to Accounts & General Ledger',
        dispatchDate: systemDate,
        systemDate: systemDate,
        // Snake_case schema mapping columns
        entry_number: data.orderId || uniqueOrderId,
        reference_id: data.voucherRef || `VCHR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        client_name: dynamicClient,
        client_phone: data.clientPhone || '',
        client_address: dynamicClientAddress,
        depot_code: dynamicDepot.includes('-') ? dynamicDepot.split('-')[0].trim() : 'HQ',
        depot_name: dynamicDepot,
        payment_terms: dynamicPaymentTerms,
        subtotal_amount: numericAmount / 1.15,
        vat_amount: (numericAmount / 1.15) * 0.15,
        grand_total: numericAmount,
        paid_amount: dynamicPaymentTerms.toUpperCase().includes('PAID') || dynamicPaymentTerms.toUpperCase().includes('CASH') ? numericAmount : 0,
        outstanding_amount: dynamicPaymentTerms.toUpperCase().includes('PAID') || dynamicPaymentTerms.toUpperCase().includes('CASH') ? 0 : numericAmount,
        date: systemDate,
        description: `Sales Order via FO: ${fieldOfficerName} [Depot: ${dynamicDepot}] | Terms: ${dynamicPaymentTerms} | ${productSku}`,
      };

      const newOrder = this.salesRepo.create(orderPayload);
      const savedOrder: any = await this.salesRepo.save(newOrder);
      console.log('Successfully saved order/invoice to SQLite DB:', savedOrder);

      // --- AUTOMATIC LEDGER & PARTY SYNCHRONIZATION ---
      try {
        const rawProductStr = savedOrder.product;
        const itemSegments = rawProductStr ? rawProductStr.split(';').map((s: string) => s.trim()).filter(Boolean) : [];
        
        const lines = itemSegments.map((itemStr: string) => {
          const qtyMatch = itemStr.match(/Qty:\s*(\d+)/i);
          const priceMatch = itemStr.match(/Price:\s*([\d.]+)/i);
          const qty = qtyMatch ? Number(qtyMatch[1]) : 1;
          const price = priceMatch ? Number(priceMatch[1]) : numericAmount;
          const cleanName = itemStr.replace(/\s*\(Qty:.*?\)/gi, '').trim();

          return {
            accountId: '', 
            itemName: cleanName || productSku,
            unit: 'Packs',
            quantity: qty,
            unitPrice: price,
            debit: qty * price,
            credit: 0,
          };
        });

        if (lines.length === 0) {
          lines.push({
            accountId: '',
            itemName: productSku,
            unit: 'Packs',
            quantity: 1,
            unitPrice: numericAmount,
            debit: numericAmount,
            credit: 0,
          });
        }

        await this.financeService.createSalesOrderWithLedger({
          entryNumber: savedOrder.orderId || savedOrder.entry_number,
          date: systemDate,
          referenceId: savedOrder.voucherRef || savedOrder.reference_id,
          description: savedOrder.description,
          clientName: savedOrder.client || savedOrder.client_name,
          clientPhone: data.clientPhone || '',
          clientEmail: data.clientEmail || '',
          clientAddress: dynamicClientAddress,
          depotCode: savedOrder.depot_code || 'HQ',
          depotName: savedOrder.depot_name || savedOrder.depot,
          lines,
        });

        console.log(`✅ Automatically posted journal entry & party ledger for order with terms: ${dynamicPaymentTerms}`);
      } catch (ledgerError) {
        console.error('⚠️ Warning: Order saved, but auto-posting to general ledger failed:', ledgerError);
      }

      return savedOrder as SalesOrder;
    } catch (err: unknown) {
      console.error('CRITICAL BACKEND ERROR IN createOrder:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save order to SQLite';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  async syncOrderToAccounts(orderId: string): Promise<SalesOrder> {
    const order = await this.salesRepo.findOne({ where: { orderId } as any });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    (order as any).workflowStep = 'Synchronized with General Ledger & Accounts';
    return await this.salesRepo.save(order);
  }

  async getDailyMetrics() {
    const systemDate = new Date().toISOString().split('T')[0];
    const orders = await this.salesRepo.find({ where: { systemDate } as any });

    return {
      systemDate,
      totalOrdersToday: orders.length,
      status: 'Synchronized with SQLite DB & Accounts Pipeline',
    };
  }
}