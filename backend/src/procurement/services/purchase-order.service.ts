import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PurchaseOrder, PurchaseOrderItem } from '../entities/purchase-order.entity';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly poRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly poItemRepository: Repository<PurchaseOrderItem>,
    private readonly dataSource: DataSource,
  ) {}

  // 1. Fetch Master Vendors Seeded from DB
  async getMasterSuppliers(): Promise<string[]> {
    try {
      const queryRunner = this.poRepository.manager.connection.createQueryRunner();
      const rmSuppliers = await queryRunner.query(
        `SELECT DISTINCT "Supplier Name" as name FROM rm_suppliers WHERE "Supplier Name" IS NOT NULL`,
      );
      const packSuppliers = await queryRunner.query(
        `SELECT DISTINCT "Supplier Name" as name FROM pack_suppliers WHERE "Supplier Name" IS NOT NULL`,
      );
      await queryRunner.release();

      const merged = Array.from(
        new Set([
          ...(rmSuppliers || []).map((s: any) => s.name),
          ...(packSuppliers || []).map((s: any) => s.name),
        ]),
      ).filter(Boolean) as string[];

      return merged;
    } catch {
      return ['Acme Pharma Raw Materials Ltd', 'Beximco Fine Chemicals', 'Square API Division', 'Nobel link Corp.'];
    }
  }

  // 2. Fetch Master Materials Seeded from DB
  async getMasterMaterials(category?: string): Promise<any[]> {
    try {
      const queryRunner = this.poRepository.manager.connection.createQueryRunner();
      const query =
        category === 'PACKAGING_MATERIAL'
          ? `SELECT "Material Code" as code, "Material Name" as name, "Type" as type, "Unit" as unit FROM packing_materials_master WHERE "Material Name" IS NOT NULL`
          : `SELECT "Material Code" as code, "Material Name" as name, "Type" as type, "Unit" as unit FROM raw_materials_master WHERE "Material Name" IS NOT NULL`;

      const rows = await queryRunner.query(query);
      await queryRunner.release();
      return rows || [];
    } catch {
      return [];
    }
  }

  // 3. Fetch All Orders (Including Relational Line Items & Seeded Records with System Dates)
  async getAllOrders(): Promise<any[]> {
    const userOrders = await this.poRepository.find({
      relations: { items: true },
      order: { createdAt: 'DESC' },
    });

    const systemDate = new Date().toISOString().split('T')[0];

    try {
      const queryRunner = this.poRepository.manager.connection.createQueryRunner();
      const rmPos = await queryRunner.query(`SELECT * FROM rm_purchase_orders`).catch(() => []);
      const packPos = await queryRunner.query(`SELECT * FROM pack_purchase_orders`).catch(() => []);
      await queryRunner.release();

      const formattedRm = (rmPos || []).map((po: any, idx: number) => {
        const qty = parseFloat(po['Quantity']) || 100;
        const unitPrice = parseFloat(po['Unit Price']) || 150;
        return {
          id: `RM-PO-${idx + 1}`,
          poNumber: po['PO Number'] || `AMICO-RM-PO-${100 + idx}`,
          vendorName: po['Supplier Name'] || 'Seeded Raw Supplier',
          vendorType: 'LOCAL',
          orderDate: po['Order Date'] || systemDate,
          expectedDeliveryDate: po['Delivery Date'] || systemDate,
          grandTotal: qty * unitPrice,
          status: po['Status'] === 'Completed' ? 'QC_PASSED_GRN' : 'IN_QUARANTINE',
          ledgerStatus: 'POSTED_TO_AP_21100',
          items: [
            {
              materialCategory: 'RAW_MATERIAL',
              materialSubtype: 'API',
              itemName: po['Material Name'] || 'Active Pharma Ingredient',
              quantity: qty,
              unit: po['Unit'] || 'kg',
              unitPrice: unitPrice,
              qcStatus: 'QUARANTINE_PENDING',
            },
          ],
        };
      });

      const formattedPack = (packPos || []).map((po: any, idx: number) => {
        const qty = parseFloat(po['Quantity']) || 5000;
        const unitPrice = parseFloat(po['Unit Price']) || 3.5;
        return {
          id: `PACK-PO-${idx + 1}`,
          poNumber: po['PO Number'] || `AMICO-PACK-PO-${100 + idx}`,
          vendorName: po['Supplier Name'] || 'Seeded Packaging Supplier',
          vendorType: 'LOCAL',
          orderDate: po['Order Date'] || systemDate,
          expectedDeliveryDate: po['Delivery Date'] || systemDate,
          grandTotal: qty * unitPrice,
          status: po['Status'] === 'Completed' ? 'QC_PASSED_GRN' : 'IN_QUARANTINE',
          ledgerStatus: 'POSTED_TO_AP_21100',
          items: [
            {
              materialCategory: 'PACKAGING_MATERIAL',
              materialSubtype: 'CARTON',
              itemName: po['Material Name'] || 'Packaging Carton Box',
              quantity: qty,
              unit: po['Unit'] || 'pcs',
              unitPrice: unitPrice,
              qcStatus: 'QUARANTINE_PENDING',
            },
          ],
        };
      });

      return [...userOrders, ...formattedRm, ...formattedPack];
    } catch {
      return userOrders;
    }
  }

  // 4. Create Purchase Order with Dynamic Schema Inspection, Party Registration, and Finance AP/GL Sync
  async createOrder(data: any): Promise<PurchaseOrder> {
    const grandTotal = data.items.reduce(
      (sum: number, item: any) => sum + parseFloat(item.quantity) * parseFloat(item.unitPrice),
      0,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const vendorName = data.vendorName || 'General Vendor';
      const vendorType = data.vendorType || 'LOCAL';
      const orderDate = data.orderDate || new Date().toISOString().split('T')[0];
      
      // Ensure poNumber uniqueness check to avoid SQLite constraint crash
      let basePoNumber = data.poNumber || `AMICO-PO-2026-${Math.floor(100 + Math.random() * 900)}`;
      let poNumber = basePoNumber;
      
      const existingPo = await queryRunner.query(
        `SELECT id FROM procurement_purchase_orders WHERE poNumber = ?`,
        [poNumber]
      );
      if (existingPo && existingPo.length > 0) {
        poNumber = `${basePoNumber}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      // Step A: Dynamically inspect parties table schema and register party
      const partyTableInfo = await queryRunner.query(`PRAGMA table_info(parties);`);
      const partyCols = new Set<string>(partyTableInfo.map((col: any) => String(col.name)));

      const existingParty = await queryRunner.query(`SELECT * FROM parties WHERE name = ?`, [vendorName]);
      let partyIdVal = '';
      if (existingParty && existingParty.length > 0) {
        partyIdVal = existingParty[0].id;
      } else {
        partyIdVal = `PRT-${Math.floor(100000 + Math.random() * 900000)}`;
        const partyInsertCols: string[] = ['name'];
        const partyInsertVals: any[] = [vendorName];

        if (partyCols.has('id')) {
          partyInsertCols.unshift('id');
          partyInsertVals.unshift(partyIdVal);
        }
        if (partyCols.has('type')) {
          partyInsertCols.push('type');
          partyInsertVals.push('VENDOR');
        }
        if (partyCols.has('category')) {
          partyInsertCols.push('category');
          partyInsertVals.push(vendorType);
        }
        if (partyCols.has('status')) {
          partyInsertCols.push('status');
          partyInsertVals.push('ACTIVE');
        }
        if (partyCols.has('created_at')) {
          partyInsertCols.push('created_at');
          partyInsertVals.push(new Date().toISOString());
        } else if (partyCols.has('createdAt')) {
          partyInsertCols.push('createdAt');
          partyInsertVals.push(new Date());
        }

        const placeholders = partyInsertCols.map(() => '?').join(', ');
        await queryRunner.query(
          `INSERT INTO parties (${partyInsertCols.join(', ')}) VALUES (${placeholders})`,
          partyInsertVals
        );
      }

      // Step B: Save Purchase Order & Items via ORM
      const po = new PurchaseOrder();
      po.poNumber = poNumber;
      po.vendorName = vendorName;
      po.vendorType = vendorType;
      po.orderDate = orderDate;
      po.expectedDeliveryDate = data.expectedDeliveryDate || orderDate;
      po.grandTotal = grandTotal;
      po.status = 'IN_QUARANTINE';
      po.ledgerStatus = 'POSTED_TO_AP_21100';

      po.items = data.items.map((item: any) => {
        const poi = new PurchaseOrderItem();
        poi.materialCategory = item.materialCategory;
        poi.materialSubtype = item.materialSubtype;
        poi.itemName = item.itemName;
        poi.quantity = parseFloat(item.quantity);
        poi.unit = item.unit;
        poi.unitPrice = parseFloat(item.unitPrice);
        poi.qcStatus = 'QUARANTINE_PENDING';
        return poi;
      });

      const savedPo = await queryRunner.manager.save(PurchaseOrder, po);

      // Step C: Dynamically inspect journal_entries schema and insert Journal Entry as PAYABLE with party_name
      const jeTableInfo = await queryRunner.query(`PRAGMA table_info(journal_entries);`);
      const jeCols = new Set<string>(jeTableInfo.map((col: any) => String(col.name)));
      const voucherNo = `JV-${Math.floor(100000 + Math.random() * 900000)}`;
      const jeId = `JE-${Math.floor(Date.now() / 1000)}-${Math.floor(Math.random() * 1000)}`;

      const jeMapping: { [key: string]: any } = {
        id: jeId,
        entry_number: voucherNo,
        entryNumber: voucherNo,
        voucher_number: voucherNo,
        voucherNumber: voucherNo,
        entry_type: 'PAYABLE',
        entryType: 'PAYABLE',
        type: 'PAYABLE',
        channel: 'PURCHASE_CREDIT',
        payment_category: 'BANK_CHEQUE',
        paymentCategory: 'BANK_CHEQUE',
        date: orderDate,
        party_name: vendorName,
        partyName: vendorName,
        party_id: partyIdVal,
        partyId: partyIdVal,
        total_amount: grandTotal,
        totalAmount: grandTotal,
        settled_amount: 0,
        settledAmount: 0,
        due_amount: grandTotal,
        dueAmount: grandTotal,
        outstanding_amount: grandTotal,
        outstandingAmount: grandTotal,
        status: 'OUTSTANDING',
        reference: poNumber,
        narration: `Purchase Order AP Sync for ${poNumber}`,
        created_at: new Date().toISOString(),
        createdAt: new Date(),
      };

      const jeInsertCols: string[] = [];
      const jeInsertVals: any[] = [];

      for (const colName of jeCols) {
        if (jeMapping[colName] !== undefined) {
          jeInsertCols.push(colName);
          jeInsertVals.push(jeMapping[colName]);
        }
      }

      if (jeInsertCols.length > 0) {
        const placeholders = jeInsertCols.map(() => '?').join(', ');
        await queryRunner.query(
          `INSERT INTO journal_entries (${jeInsertCols.join(', ')}) VALUES (${placeholders})`,
          jeInsertVals
        );
      }

      // Step D: Lookup account IDs for 11800 and 21100 from chart_of_accounts
      const accounts = await queryRunner.query(`SELECT id, code FROM chart_of_accounts`);
      let acc11800Id = '';
      let acc21100Id = '';
      for (const acc of accounts) {
        if (acc.code && String(acc.code).includes('11800')) acc11800Id = acc.id;
        if (acc.code && String(acc.code).includes('21100')) acc21100Id = acc.id;
      }
      if (!acc11800Id && accounts.length > 0) acc11800Id = accounts[0].id;
      if (!acc21100Id && accounts.length > 1) acc21100Id = accounts[1].id;
      if (!acc11800Id) acc11800Id = 'ACC-11800';
      if (!acc21100Id) acc21100Id = 'ACC-21100';

      // Step E: Dynamically inspect journal_entry_lines schema and insert lines with foreign keys
      const jelTableInfo = await queryRunner.query(`PRAGMA table_info(journal_entry_lines);`);
      const jelCols = new Set<string>(jelTableInfo.map((col: any) => String(col.name)));

      const firstItemName = data.items.length > 0 ? data.items[0].itemName : 'Raw Material Purchase';
      const qtyVal = data.items.length > 0 ? data.items[0].quantity : 1;
      const unitPriceVal = data.items.length > 0 ? data.items[0].unitPrice : grandTotal;
      const timestampBase = Date.now();

      const linesToInsert = [
        {
          id: `JEL-${timestampBase}-1`,
          journal_entry_id: jeId,
          journalEntryId: jeId,
          voucher_number: voucherNo,
          voucherNumber: voucherNo,
          item_name: firstItemName,
          itemName: firstItemName,
          account_id: acc11800Id,
          accountId: acc11800Id,
          chart_of_accounts: '11800 - Inventory Raw Materials',
          chartOfAccounts: '11800 - Inventory Raw Materials',
          qty: qtyVal,
          quantity: qtyVal,
          unit: data.items.length > 0 ? data.items[0].unit : 'kg',
          unit_price: unitPriceVal,
          unitPrice: unitPriceVal,
          party_id: partyIdVal,
          partyId: partyIdVal,
          debit: grandTotal,
          credit: 0,
        },
        {
          id: `JEL-${timestampBase}-2`,
          journal_entry_id: jeId,
          journalEntryId: jeId,
          voucher_number: voucherNo,
          voucherNumber: voucherNo,
          item_name: 'Vendor Accounts Payable Attribution',
          itemName: 'Vendor Accounts Payable Attribution',
          account_id: acc21100Id,
          accountId: acc21100Id,
          chart_of_accounts: '21100 - Accounts Payable',
          chartOfAccounts: '21100 - Accounts Payable',
          qty: 1,
          quantity: 1,
          unit: 'pcs',
          unit_price: grandTotal,
          unitPrice: grandTotal,
          party_id: partyIdVal,
          partyId: partyIdVal,
          debit: 0,
          credit: grandTotal,
        },
      ];

      for (const lineData of linesToInsert) {
        const jelInsertCols: string[] = [];
        const jelInsertVals: any[] = [];

        for (const colName of jelCols) {
          if (lineData[colName as keyof typeof lineData] !== undefined) {
            jelInsertCols.push(colName);
            jelInsertVals.push(lineData[colName as keyof typeof lineData]);
          }
        }

        if (jelInsertCols.length > 0) {
          const placeholders = jelInsertCols.map(() => '?').join(', ');
          await queryRunner.query(
            `INSERT INTO journal_entry_lines (${jelInsertCols.join(', ')}) VALUES (${placeholders})`,
            jelInsertVals
          );
        }
      }

      await queryRunner.commitTransaction();
      return savedPo;
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Failed to create PO and sync finance AP: ${err?.message || err}`);
    } finally {
      await queryRunner.release();
    }
  }
}