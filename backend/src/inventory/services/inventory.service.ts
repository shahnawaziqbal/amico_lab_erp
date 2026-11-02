// inventory.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class InventoryService implements OnModuleInit {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.ensureTableSchema();
  }

  private async ensureTableSchema() {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS inventory_warehouse_stocks (
          id TEXT PRIMARY KEY,
          warehouseType TEXT DEFAULT 'FINISHED_GOODS',
          locationName TEXT DEFAULT 'Birulia Central Finished Goods Warehouse',
          itemCode TEXT,
          itemName TEXT,
          category TEXT DEFAULT 'FINISHED_GOOD',
          availableQuantity REAL DEFAULT 0,
          quarantineQuantity REAL DEFAULT 0,
          reorderLevel REAL DEFAULT 1000,
          unit TEXT DEFAULT 'box',
          unitValuationBDT REAL DEFAULT 500,
          batchNumber TEXT,
          rfid TEXT,
          qrPayload TEXT,
          expiryDate DATE,
          status TEXT DEFAULT 'RECEIVED',
          remarks TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `).catch(() => {});

      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS inventory_raw_material_lots (
          id TEXT PRIMARY KEY,
          lotNumber TEXT,
          materialName TEXT,
          receivedQuantity REAL DEFAULT 0,
          unit TEXT DEFAULT 'kg',
          unitPrice REAL DEFAULT 0,
          qcStatus TEXT DEFAULT 'PASSED',
          poNumber TEXT,
          vendorName TEXT,
          receivedDate DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `).catch(() => {});

      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS inventory_packaging_material_lots (
          id TEXT PRIMARY KEY,
          lotNumber TEXT,
          materialName TEXT,
          receivedQuantity REAL DEFAULT 0,
          unit TEXT DEFAULT 'pcs',
          unitPrice REAL DEFAULT 0,
          qcStatus TEXT DEFAULT 'PASSED',
          poNumber TEXT,
          vendorName TEXT,
          receivedDate DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `).catch(() => {});

      // Safely ensure columns exist
      await this.dataSource.query(`ALTER TABLE inventory_warehouse_stocks ADD COLUMN status TEXT DEFAULT 'RECEIVED';`).catch(() => {});
      await this.dataSource.query(`ALTER TABLE inventory_warehouse_stocks ADD COLUMN remarks TEXT;`).catch(() => {});
      await this.dataSource.query(`ALTER TABLE inventory_warehouse_stocks ADD COLUMN rfid TEXT;`).catch(() => {});
      await this.dataSource.query(`ALTER TABLE inventory_warehouse_stocks ADD COLUMN qrPayload TEXT;`).catch(() => {});
      await this.dataSource.query(`ALTER TABLE inventory_raw_material_lots ADD COLUMN unitPrice REAL;`).catch(() => {});
      await this.dataSource.query(`ALTER TABLE inventory_raw_material_lots ADD COLUMN poNumber TEXT;`).catch(() => {});
      await this.dataSource.query(`ALTER TABLE inventory_raw_material_lots ADD COLUMN vendorName TEXT;`).catch(() => {});
      await this.dataSource.query(`ALTER TABLE inventory_packaging_material_lots ADD COLUMN unitPrice REAL;`).catch(() => {});
      await this.dataSource.query(`ALTER TABLE inventory_packaging_material_lots ADD COLUMN poNumber TEXT;`).catch(() => {});
      await this.dataSource.query(`ALTER TABLE inventory_packaging_material_lots ADD COLUMN vendorName TEXT;`).catch(() => {});
    } catch (err) {
      console.error('Error ensuring inventory schema:', err);
    }
  }

  private normalizeName(name: string): string {
    return (name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Retrieves all warehouse stocks strictly segregated by warehouse type.
   */
  async getAllStocks() {
    try {
      await this.ensureTableSchema();

      // 1. Fetch Raw Materials 100% dynamically from Purchase Order QC-Passed Lots & PO Items
      const rawMaterialsMap = new Map();
      let rmIdx = 1;

      // Fetch QC-Passed Lots from inventory_raw_material_lots
      const dynamicLots: any[] = await this.dataSource.query(`
        SELECT materialName, SUM(receivedQuantity) as totalQty, unit, MAX(lotNumber) as lotNumber, 
               MAX(COALESCE(unitPrice, 500)) as unitPrice, MAX(receivedDate) as receivedDate,
               MAX(poNumber) as poNumber, MAX(vendorName) as vendorName
        FROM inventory_raw_material_lots
        WHERE qcStatus = 'PASSED' OR qcStatus IS NULL
        GROUP BY LOWER(TRIM(materialName)), unit
      `).catch(() => []);

      for (const lot of dynamicLots) {
        if (!lot.materialName) continue;
        const nameKey = lot.materialName.trim().toLowerCase();
        rawMaterialsMap.set(nameKey, {
          id: `rm-lot-${rmIdx++}`,
          warehouseType: 'RAW_MATERIALS',
          locationName: 'Birulia Central Raw Material Store',
          itemCode: `RM-${1000 + rmIdx}`,
          itemName: lot.materialName,
          category: 'API',
          availableQuantity: Number(lot.totalQty || 0),
          quarantineQuantity: 0,
          reorderLevel: 200,
          unit: lot.unit || 'kg',
          unitValuationBDT: Number(lot.unitPrice || 500),
          batchNumber: lot.lotNumber || `LOT-2026-${rmIdx}`,
          status: 'RECEIVED',
          createdAt: lot.receivedDate || new Date().toISOString().replace('T', ' ').substring(0, 19),
          remarks: `QC passed lot from PO #${lot.poNumber || 'N/A'} (${lot.vendorName || 'Supplier'}).`
        });
      }

      // Fetch from purchase_order_items where QC passed but not yet in inventory_raw_material_lots
      const poPassedItems: any[] = await this.dataSource.query(`
        SELECT itemName, SUM(quantity) as totalQty, MAX(unit) as unit, MAX(unitPrice) as unitPrice,
               MAX(poNumber) as poNumber, MAX(vendorName) as vendorName, MAX(createdAt) as createdAt
        FROM purchase_order_items
        WHERE (materialCategory = 'RAW_MATERIAL' OR materialCategory IS NULL || materialSubtype = 'API' OR materialSubtype = 'EXCIPIENT')
          AND (qcStatus = 'PASSED' OR qcStatus = 'PASSED_GRN')
        GROUP BY LOWER(TRIM(itemName))
      `).catch(() => []);

      for (const item of poPassedItems) {
        if (!item.itemName) continue;
        const nameKey = item.itemName.trim().toLowerCase();
        if (!rawMaterialsMap.has(nameKey)) {
          rawMaterialsMap.set(nameKey, {
            id: `rm-po-${rmIdx++}`,
            warehouseType: 'RAW_MATERIALS',
            locationName: 'Birulia Central Raw Material Store',
            itemCode: `RM-${1000 + rmIdx}`,
            itemName: item.itemName,
            category: 'API',
            availableQuantity: Number(item.totalQty || 0),
            quarantineQuantity: 0,
            reorderLevel: 200,
            unit: item.unit || 'kg',
            unitValuationBDT: Number(item.unitPrice || 500),
            batchNumber: `PO-LOT-${rmIdx}`,
            status: 'RECEIVED',
            createdAt: item.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 19),
            remarks: `Directly synced from PO #${item.poNumber || 'N/A'} (${item.vendorName || 'Supplier'}) QC pass.`
          });
        }
      }

      // Fetch Quarantine / Pending Raw Materials from Purchase Order Items
      const rawQuarantineRows: any[] = await this.dataSource.query(`
        SELECT itemName, SUM(quantity) as quarantineQty, MAX(poNumber) as poNumber, MAX(vendorName) as vendorName 
        FROM purchase_order_items 
        WHERE (materialCategory = 'RAW_MATERIAL' OR materialCategory IS NULL) 
          AND (qcStatus != 'PASSED' AND qcStatus != 'PASSED_GRN')
        GROUP BY LOWER(TRIM(itemName))
      `).catch(() => []);

      for (const q of rawQuarantineRows) {
        if (!q.itemName) continue;
        const nameKey = q.itemName.trim().toLowerCase();
        if (rawMaterialsMap.has(nameKey)) {
          const existing = rawMaterialsMap.get(nameKey);
          existing.quarantineQuantity = Number(q.quarantineQty || 0);
        } else {
          rawMaterialsMap.set(nameKey, {
            id: `rm-quar-${rmIdx++}`,
            warehouseType: 'RAW_MATERIALS',
            locationName: 'Birulia Central Raw Material Store',
            itemCode: `RM-${1000 + rmIdx}`,
            itemName: q.itemName,
            category: 'API',
            availableQuantity: 0,
            quarantineQuantity: Number(q.quarantineQty || 0),
            reorderLevel: 200,
            unit: 'kg',
            unitValuationBDT: 500,
            batchNumber: `QUARANTINE-${rmIdx}`,
            status: 'IN_QUARANTINE',
            createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            remarks: `Pending QC inspection from PO #${q.poNumber || 'N/A'} (${q.vendorName || 'Supplier'}).`
          });
        }
      }

      // Sort raw materials so the newest/most recent purchase order & QC passes appear at the top
      const rawMaterials = Array.from(rawMaterialsMap.values()).sort((a: any, b: any) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      // 2. Fetch Packaging Materials & Lots
      const packLots = await this.dataSource.query(`
        SELECT materialName, SUM(receivedQuantity) as totalQty, unit, MAX(lotNumber) as lotNumber, 
               MAX(COALESCE(unitPrice, 50)) as unitPrice, MAX(receivedDate) as receivedDate,
               MAX(poNumber) as poNumber, MAX(vendorName) as vendorName
        FROM inventory_packaging_material_lots
        WHERE qcStatus = 'PASSED' OR qcStatus IS NULL
        GROUP BY materialName, unit
      `).catch(() => []);

      const packLotsMap = new Map();
      for (const lot of packLots) {
        if (lot.materialName) {
          const key = this.normalizeName(lot.materialName);
          const existing = packLotsMap.get(key);
          if (existing) {
            existing.totalQty = Number(existing.totalQty) + Number(lot.totalQty || 0);
          } else {
            packLotsMap.set(key, { ...lot });
          }
        }
      }

      const packQuarantineRows = await this.dataSource.query(`
        SELECT itemName, SUM(quantity) as quarantineQty 
        FROM purchase_order_items 
        WHERE materialCategory = 'PACKAGING_MATERIAL' 
          AND (qcStatus != 'PASSED' AND qcStatus != 'PASSED_GRN')
        GROUP BY itemName
      `).catch(() => []);

      const packQuarantineMap = new Map();
      for (const q of packQuarantineRows) {
        if (q.itemName) {
          packQuarantineMap.set(this.normalizeName(q.itemName), Number(q.quarantineQty || 0));
        }
      }

      const packagingRaw: any[] = await this.dataSource.query(`
        SELECT "Material Code" as itemCode, "Material Name" as itemName, "Type" as category, "Unit" as unit, "Reorder Level" as reorderLevel 
        FROM packing_materials_master
      `).catch(() => []);

      const matchedPackMasterKeys = new Set<string>();

      const packagingFromMaster = (packagingRaw || []).map((item: any, idx: number) => {
        const normKey = this.normalizeName(item.itemName);
        matchedPackMasterKeys.add(normKey);
        
        const liveLot = packLotsMap.get(normKey);
        const quarantineQty = packQuarantineMap.get(normKey) || 0;

        const availableQty = liveLot ? Number(liveLot.totalQty) : 0;
        const batchNo = liveLot ? liveLot.lotNumber : `PACK-LOT-${100 + idx}`;
        const unitPrice = liveLot ? Number(liveLot.unitPrice || 50) : 50;
        const remarks = liveLot 
          ? `Active lot ${liveLot.lotNumber} received from PO ${liveLot.poNumber || 'N/A'}.` 
          : 'Awaiting procurement and QC inspection.';

        return {
          id: `pm-${idx}`,
          warehouseType: 'PACKAGING_MATERIALS',
          locationName: 'Birulia Central Packaging Store',
          itemCode: item.itemCode || `PM-${2000 + idx}`,
          itemName: item.itemName || 'Unknown Packaging Item',
          category: item.category || 'CARTON',
          availableQuantity: availableQty,
          quarantineQuantity: Number(quarantineQty),
          reorderLevel: Number(item.reorderLevel) || 2000,
          unit: item.unit || liveLot?.unit || 'pcs',
          unitValuationBDT: unitPrice,
          batchNumber: batchNo,
          status: liveLot ? 'RECEIVED' : (quarantineQty > 0 ? 'IN_QUARANTINE' : 'PENDING'),
          createdAt: liveLot?.receivedDate || new Date().toISOString().replace('T', ' ').substring(0, 19),
          remarks: remarks
        };
      });

      const adHocPackaging: any[] = [];
      let adHocPmIdx = 1;
      packLotsMap.forEach((lot, normKey) => {
        if (!matchedPackMasterKeys.has(normKey)) {
          adHocPackaging.push({
            id: `pm-adhoc-${adHocPmIdx++}`,
            warehouseType: 'PACKAGING_MATERIALS',
            locationName: 'Birulia Central Packaging Store',
            itemCode: `PM-ADHOC-${100 + adHocPmIdx}`,
            itemName: lot.materialName,
            category: 'CARTON',
            availableQuantity: Number(lot.totalQty || 0),
            quarantineQuantity: 0,
            reorderLevel: 2000,
            unit: lot.unit || 'pcs',
            unitValuationBDT: Number(lot.unitPrice || 50),
            batchNumber: lot.lotNumber,
            status: 'RECEIVED',
            createdAt: lot.receivedDate || new Date().toISOString().replace('T', ' ').substring(0, 19),
            remarks: `QC-Passed lot ${lot.lotNumber} received from PO ${lot.poNumber || 'N/A'}.`
          });
        }
      });

      const packagingMaterials = [...packagingFromMaster, ...adHocPackaging];

      // 3. Fetch ONLY COMPLETED Production Batches for Finished Goods Tab
      const completedBatches = await this.dataSource.query(`
        SELECT * FROM production_batches 
        WHERE status = 'COMPLETED' 
           OR status = 'Completed' 
           OR UPPER(status) LIKE '%COMPLETE%' 
           OR bmr_stages_json LIKE '%COMPLETED%'
           OR bmr_stages_json LIKE '%\"status\":\"COMPLETED\"%'
        ORDER BY rowid DESC
      `).catch(() => []);

      const finishedGoodsFromProduction = completedBatches.map((b: any, index: number) => {
        const bNo = b.batch_number || b.batchNumber || b.batchId || `BMR-2026-00${index + 1}`;
        const pName = b.product_name || b.product || 'Finished Pharmaceutical Product';
        const pCode = b.product_code || b.productCode || 'PROD-001';

        let actualQty = Number(b.target_quantity || b.targetQuantity || 100000);
        let completionTimestamp = null;

        try {
          const stages = typeof b.bmr_stages_json === 'string' ? JSON.parse(b.bmr_stages_json) : (b.bmr_stages_json || []);
          if (Array.isArray(stages) && stages.length > 0) {
            const finalStage = stages[stages.length - 1];
            if (finalStage?.timestamp) {
              completionTimestamp = finalStage.timestamp;
            }
            for (let sIdx = stages.length - 1; sIdx >= 0; sIdx--) {
              const st = stages[sIdx];
              if (st?.outputQty !== undefined && !isNaN(Number(st.outputQty))) {
                actualQty = Number(st.outputQty);
                break;
              }
              if (st?.output !== undefined && !isNaN(Number(st.output))) {
                actualQty = Number(st.output);
                break;
              }
            }
          }
        } catch {}

        if (!completionTimestamp) {
          completionTimestamp = b.start_date || new Date().toISOString().replace('T', ' ').substring(0, 19);
        }

        let unitValuation = 450;
        try {
          let hash = 0;
          for (let c = 0; c < pCode.length; c++) {
            hash = pCode.charCodeAt(c) + ((hash << 5) - hash);
          }
          unitValuation = Math.abs(hash % 650) + 220;
        } catch {}

        return {
          id: `ID-FG-SYNC-${bNo}`,
          warehouseType: 'FINISHED_GOODS',
          locationName: 'Birulia Central Finished Goods Warehouse',
          itemCode: String(pCode),
          itemName: String(pName),
          category: b.category || b.type || 'FINISHED_GOOD',
          availableQuantity: Number(actualQty),
          quarantineQuantity: 0,
          reorderLevel: 1000,
          unit: 'box',
          unitValuationBDT: Number(unitValuation),
          batchNumber: String(bNo),
          rfid: `RFID-${bNo}`,
          qrPayload: b.qr_payload || b.qrPayload || '',
          status: 'RECEIVED',
          createdAt: String(completionTimestamp),
          remarks: `Successfully transferred from completed production batch ${bNo}.`
        };
      });

      // 4. Fetch warehouse stock entries for Depots
      const allWarehouseRows = await this.dataSource.query(`
        SELECT * FROM inventory_warehouse_stocks ORDER BY datetime(createdAt) DESC, rowid DESC
      `).catch(() => []);

      const warehouseStocks = (allWarehouseRows || []).map((s: any) => ({
        id: s.id,
        warehouseType: s.warehouseType || 'FINISHED_GOODS',
        locationName: s.locationName || (s.warehouseType === 'REGIONAL_DEPOT' ? 'Regional Depot Hub' : 'Birulia Central Finished Goods Warehouse'),
        itemCode: s.itemCode || 'PROD-001',
        itemName: s.itemName || 'Finished Pharmaceutical Product',
        category: s.category || 'FINISHED_GOOD',
        availableQuantity: Number(s.availableQuantity || 0),
        quarantineQuantity: Number(s.quarantineQuantity || 0),
        reorderLevel: Number(s.reorderLevel || 1000),
        unit: s.unit || 'box',
        unitValuationBDT: Number(s.unitValuationBDT || 450),
        batchNumber: s.batchNumber || 'BMR-2026-001',
        rfid: s.rfid || `RFID-${s.batchNumber}`,
        qrPayload: s.qrPayload || '',
        status: s.status || 'RECEIVED',
        createdAt: s.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 19),
        remarks: s.remarks || 'Warehouse stock record.'
      }));

      const finishedGoodsMap = new Map();
      [...finishedGoodsFromProduction, ...warehouseStocks].forEach(item => {
        if (
          (item.warehouseType === 'FINISHED_GOODS' || item.warehouseType === 'REGIONAL_DEPOT') &&
          item.warehouseType !== 'RAW_MATERIALS' &&
          item.warehouseType !== 'PACKAGING_MATERIALS' &&
          !String(item.locationName || '').includes('Raw Material')
        ) {
          finishedGoodsMap.set(item.id, item);
        }
      });

      const allFinishedGoodsAndDepots = Array.from(finishedGoodsMap.values()).sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      return [...rawMaterials, ...packagingMaterials, ...allFinishedGoodsAndDepots];
    } catch (err) {
      console.error('Error fetching inventory stocks:', err);
      return [];
    }
  }

  async receiveStockFromQC(dto: any) {
    const stockId = `ID-STK-${Math.floor(Date.now() / 1000)}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (dto.warehouseType === 'RAW_MATERIALS') {
      await this.dataSource.query(
        `INSERT INTO inventory_raw_material_lots (id, lotNumber, materialName, receivedQuantity, unit, unitPrice, qcStatus, poNumber, vendorName, receivedDate)
         VALUES (?, ?, ?, ?, ?, ?, 'PASSED', ?, ?, ?);`,
        [
          stockId,
          dto.batchNumber || `LOT-${Math.floor(1000 + Math.random() * 9000)}`,
          dto.itemName,
          Number(dto.quantity) || 0,
          dto.unit || 'kg',
          Number(dto.unitValuationBDT) || 500,
          dto.poNumber || 'PO-MANUAL',
          dto.vendorName || 'Direct Receipt',
          timestamp
        ]
      );
    } else {
      await this.dataSource.query(
        `INSERT OR REPLACE INTO inventory_warehouse_stocks 
         (id, warehouseType, locationName, itemCode, itemName, category, availableQuantity, unit, unitValuationBDT, batchNumber, rfid, qrPayload, status, createdAt, remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'RECEIVED', ?, ?);`,
        [
          stockId,
          dto.warehouseType || 'FINISHED_GOODS',
          dto.locationName || 'Birulia Central Finished Goods Warehouse',
          dto.itemCode || `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
          dto.itemName,
          dto.category || 'FINISHED_GOOD',
          Number(dto.quantity) || 0,
          dto.unit || 'box',
          Number(dto.unitValuationBDT) || 450,
          dto.batchNumber || 'BMR-2026-001',
          `RFID-${dto.batchNumber || '001'}`,
          dto.qrPayload || '',
          timestamp,
          dto.remarks || 'Manually received and verified by QA.'
        ]
      );
    }

    return { success: true, receivedItem: dto };
  }

  async transferToDepot(data: { itemCode: string; batchNumber: string; quantity: number; unit: string; destinationDepot: string; remarks?: string }) {
    const transferId = `TRF-${Math.floor(Date.now() / 1000)}`;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const centralStock = await this.dataSource.query(
      `SELECT * FROM inventory_warehouse_stocks WHERE batchNumber = ? AND warehouseType = 'FINISHED_GOODS' LIMIT 1`,
      [data.batchNumber]
    ).catch(() => []);

    if (!centralStock || centralStock.length === 0) {
      throw new Error(`Batch ${data.batchNumber} not found in central Finished Goods warehouse.`);
    }

    const availableQty = Number(centralStock[0].availableQuantity);
    const transferQty = Number(data.quantity);

    if (availableQty < transferQty) {
      throw new Error(`Insufficient central Finished Goods stock for batch ${data.batchNumber}. Available: ${availableQty}, Requested: ${transferQty}`);
    }

    await this.dataSource.query(
      `UPDATE inventory_warehouse_stocks SET availableQuantity = availableQuantity - ? WHERE id = ?`,
      [transferQty, centralStock[0].id]
    );

    const depotStockId = `ID-DEPOT-${data.destinationDepot.replace(/\s+/g, '-')}-${data.batchNumber}`;
    await this.dataSource.query(
      `INSERT INTO inventory_warehouse_stocks 
       (id, warehouseType, locationName, itemCode, itemName, category, availableQuantity, unit, unitValuationBDT, batchNumber, status, createdAt, remarks)
       VALUES (?, 'REGIONAL_DEPOT', ?, ?, ?, ?, ?, ?, ?, ?, 'IN_TRANSIT', ?, ?)
       ON CONFLICT(id) DO UPDATE SET 
         availableQuantity = availableQuantity + excluded.availableQuantity,
         status = 'IN_TRANSIT',
         remarks = excluded.remarks;`,
      [
        depotStockId,
        data.destinationDepot,
        centralStock[0].itemCode,
        centralStock[0].itemName,
        centralStock[0].category,
        transferQty,
        data.unit || centralStock[0].unit || 'box',
        centralStock[0].unitValuationBDT,
        data.batchNumber,
        timestamp,
        data.remarks || `Transferred from Central FG Warehouse to ${data.destinationDepot}`
      ]
    );

    return { 
      success: true, 
      transferId, 
      destinationDepot: data.destinationDepot, 
      transferredQuantity: transferQty,
      remainingCentralStock: availableQty - transferQty 
    };
  }

  async transferDepotToDepot(data: { sourceDepot: string; destinationDepot: string; batchNumber: string; quantity: number; unit: string; remarks?: string }) {
    const transferId = `TRF-D2D-${Math.floor(Date.now() / 1000)}`;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const sourceDepotStock = await this.dataSource.query(
      `SELECT * FROM inventory_warehouse_stocks WHERE batchNumber = ? AND locationName = ? AND warehouseType = 'REGIONAL_DEPOT' LIMIT 1`,
      [data.batchNumber, data.sourceDepot]
    ).catch(() => []);

    if (!sourceDepotStock || sourceDepotStock.length === 0) {
      throw new Error(`Batch ${data.batchNumber} not found in source depot (${data.sourceDepot}).`);
    }

    const sourceQty = Number(sourceDepotStock[0].availableQuantity);
    const transferQty = Number(data.quantity);

    if (sourceQty < transferQty) {
      throw new Error(`Insufficient stock in ${data.sourceDepot} for batch ${data.batchNumber}. Available: ${sourceQty}, Requested: ${transferQty}`);
    }

    await this.dataSource.query(
      `UPDATE inventory_warehouse_stocks SET availableQuantity = availableQuantity - ? WHERE id = ?`,
      [transferQty, sourceDepotStock[0].id]
    );

    const destDepotStockId = `ID-DEPOT-${data.destinationDepot.replace(/\s+/g, '-')}-${data.batchNumber}`;
    await this.dataSource.query(
      `INSERT INTO inventory_warehouse_stocks 
       (id, warehouseType, locationName, itemCode, itemName, category, availableQuantity, unit, unitValuationBDT, batchNumber, status, createdAt, remarks)
       VALUES (?, 'REGIONAL_DEPOT', ?, ?, ?, ?, ?, ?, ?, ?, 'RECEIVED', ?, ?)
       ON CONFLICT(id) DO UPDATE SET 
         availableQuantity = availableQuantity + excluded.availableQuantity,
         status = 'RECEIVED',
         remarks = excluded.remarks;`,
      [
        destDepotStockId,
        data.destinationDepot,
        sourceDepotStock[0].itemCode,
        sourceDepotStock[0].itemName,
        sourceDepotStock[0].category,
        transferQty,
        data.unit || sourceDepotStock[0].unit || 'box',
        sourceDepotStock[0].unitValuationBDT,
        data.batchNumber,
        timestamp,
        data.remarks || `Depot-to-Depot transfer from ${data.sourceDepot} to ${data.destinationDepot}`
      ]
    );

    return {
      success: true,
      transferId,
      sourceDepot: data.sourceDepot,
      destinationDepot: data.destinationDepot,
      transferredQuantity: transferQty,
      remainingSourceStock: sourceQty - transferQty
    };
  }

  async confirmDepotReceipt(id: string) {
    await this.dataSource.query(
      `UPDATE inventory_warehouse_stocks SET status = 'RECEIVED', remarks = remarks || ' [Received & Confirmed at Regional Depot Hub]' WHERE id = ?`,
      [id]
    );
    return { success: true, id, status: 'RECEIVED' };
  }

  async getAllRequisitions() {
    return [];
  }

  async createRequisition(dto: any) {
    return { id: 1, ...dto, status: 'PENDING' };
  }

  async updateRequisitionStatus(id: number, status: string) {
    return { id, status, updated: true };
  }
}