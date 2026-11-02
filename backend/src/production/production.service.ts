// production.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RecipeBomMaster } from './entities/recipe-bom-master.entity';
import { ProductionBatchMaster } from './entities/production-batch-master.entity';
import { QrGeneratorService } from './qr-generator.service'; 

@Injectable()
export class ProductionService implements OnModuleInit {
  constructor(
    @InjectRepository(RecipeBomMaster)
    private readonly bomRepository: Repository<RecipeBomMaster>,
    @InjectRepository(ProductionBatchMaster)
    private readonly batchRepository: Repository<ProductionBatchMaster>,
    private readonly dataSource: DataSource,
    private readonly qrGeneratorService: QrGeneratorService,
  ) {}

  async onModuleInit() {
    await this.ensureTableSchema();
  }

  private async ensureTableSchema() {
    try {
      const batchTableInfo = await this.dataSource.query(`PRAGMA table_info(production_batches);`).catch(() => []);
      const existingBatchCols = new Set<string>(batchTableInfo.map((col: any) => String(col.name)));

      const requiredBatchColumns = [
        { name: 'batchId', type: 'TEXT' },
        { name: 'eqId', type: 'TEXT DEFAULT "EQ-01"' },
        { name: 'operator', type: 'TEXT DEFAULT "System Operator"' },
        { name: 'ipqcStatus', type: 'TEXT DEFAULT "PASS"' },
        { name: 'qcStatus', type: 'TEXT DEFAULT "PASS"' },
        { name: 'qaRelease', type: 'TEXT DEFAULT "RELEASED"' },
        { name: 'batch_number', type: 'TEXT' },
        { name: 'product_code', type: 'TEXT' },
        { name: 'product_name', type: 'TEXT' },
        { name: 'product', type: 'TEXT' },
        { name: 'type', type: 'TEXT DEFAULT "Tablet"' },
        { name: 'category', type: 'TEXT DEFAULT "Pharmaceuticals"' },
        { name: 'client', type: 'TEXT DEFAULT "Internal Pharma"' },
        { name: 'batchSize', type: 'TEXT DEFAULT "100,000 Units"' },
        { name: 'batch_size', type: 'TEXT DEFAULT "100,000 Units"' },
        { name: 'stage', type: 'TEXT DEFAULT "Finished Goods Release"' },
        { name: 'target_quantity', type: 'REAL' },
        { name: 'line_reference', type: 'TEXT' },
        { name: 'status', type: 'TEXT DEFAULT "Completed"' },
        { name: 'bmr_stages_json', type: 'TEXT' },
        { name: 'start_date', type: 'TEXT' },
        { name: 'qr_payload', type: 'TEXT' },
        { name: 'dispensing_matrix_json', type: 'TEXT' },
      ];

      for (const col of requiredBatchColumns) {
        if (!existingBatchCols.has(col.name)) {
          try {
            await this.dataSource.query(`ALTER TABLE production_batches ADD COLUMN ${col.name} ${col.type};`);
          } catch {}
        }
      }

      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS inventory_raw_material_lots (
          id TEXT PRIMARY KEY,
          materialName TEXT,
          lotNumber TEXT,
          qcRefNo TEXT DEFAULT 'QC-PASS-091',
          assayPercent REAL DEFAULT 100,
          receivedQuantity REAL DEFAULT 0,
          unit TEXT DEFAULT 'kg',
          unitPrice REAL DEFAULT 0,
          qcStatus TEXT DEFAULT 'PASSED',
          receivedDate DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `).catch(() => {});

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
          expiryDate DATE,
          status TEXT DEFAULT 'RECEIVED',
          remarks TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `).catch(() => {});

      const stockTableInfo = await this.dataSource.query(`PRAGMA table_info(inventory_warehouse_stocks);`).catch(() => []);
      const existingStockCols = new Set<string>(stockTableInfo.map((col: any) => String(col.name)));

      if (!existingStockCols.has('status')) {
        await this.dataSource.query(`ALTER TABLE inventory_warehouse_stocks ADD COLUMN status TEXT DEFAULT 'RECEIVED';`).catch(() => {});
      }
      if (!existingStockCols.has('remarks')) {
        await this.dataSource.query(`ALTER TABLE inventory_warehouse_stocks ADD COLUMN remarks TEXT;`).catch(() => {});
      }
      if (!existingStockCols.has('createdAt')) {
        await this.dataSource.query(`ALTER TABLE inventory_warehouse_stocks ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP;`).catch(() => {});
      }

      // Force normalize all existing production batches to 'Completed' status strictly
      await this.dataSource.query(`
        UPDATE production_batches SET status = 'Completed';
      `).catch(() => {});

      // Auto-sync all batches into Finished Goods inventory
      const allBatches = await this.dataSource.query(`
        SELECT * FROM production_batches 
      `).catch(() => []);

      for (let i = 0; i < allBatches.length; i++) {
        const b = allBatches[i];
        const bNo = b.batch_number || b.batchNumber || b.batchId || `BMR-2026-00${i+1}`;
        const pName = b.product_name || b.product || 'Pharmaceutical Tablet';
        const pCode = b.product_code || b.productCode || `PROD-00${i+1}`;
        const qty = Number(b.target_quantity || b.targetQuantity || 100000);
        const stockId = `ID-FG-SYNC-${bNo}`;
        const batchDate = b.start_date || new Date().toISOString().replace('T', ' ').substring(0, 19);

        await this.dataSource.query(`
          INSERT OR IGNORE INTO inventory_warehouse_stocks 
          (id, warehouseType, locationName, itemCode, itemName, category, availableQuantity, unit, unitValuationBDT, batchNumber, status, createdAt, remarks)
          VALUES (?, 'FINISHED_GOODS', 'Birulia Central Finished Goods Warehouse', ?, ?, 'FINISHED_GOOD', ?, 'box', 500, ?, 'RECEIVED', ?, 'Auto-synced from production batch completion.');
        `, [stockId, pCode, pName, qty, bNo, batchDate]).catch(() => {});
      }
      
    } catch (err) {
      console.error('Error auto-bootstrapping schema in ProductionService:', err);
    }
  }

  public detectDosageForm(productName: string, rawForm?: string): string {
    const upper = (productName || '').toUpperCase();
    if (upper.includes('CAPSULE') || upper.includes('CAP')) return 'Capsule';
    if (upper.includes('DRY SYRUP')) return 'Dry Syrup';
    if (upper.includes('SYRUP') || upper.includes('SUSPENSION') || upper.includes('SOLUTION') || upper.includes('EMULSION') || upper.includes('100 ML') || upper.includes('60 ML')) return 'Syrup';
    if (upper.includes('ORS') || upper.includes('ORSALINE') || upper.includes('SACHET')) return 'ORS';
    if (upper.includes('CREAM') || upper.includes('OINTMENT') || upper.includes('DERMA') || upper.includes('GEL')) return 'Derma';
    if (upper.includes('LOTION')) return 'Lotion';
    if (upper.includes('PFS') || upper.includes('PREFILLED')) return 'PFS';
    return rawForm || 'Tablet';
  }

  public getPipelineStepsForProductType(productType: string) {
    const type = (productType || '').toUpperCase();
    
    let baseSteps = [];
    if (type.includes('CAPSULE')) {
      baseSteps = [
        { step: 1, name: '1. Dispensing & Formulations Order Sheet', status: 'COMPLETED', qcRequired: true, logs: [] },
        { step: 2, name: '2. Blending & Granulation Reconciliation', status: 'COMPLETED', qcRequired: true, logs: [] },
        { step: 3, name: '3. Encapsulation & Pellet Reconciliation', status: 'COMPLETED', qcRequired: true, logs: [] },
        { step: 4, name: '4. Blistering & Primary Packaging', status: 'COMPLETED', qcRequired: true, logs: [] },
        { step: 5, name: '5. Finished Goods (FG) Batch Release & Warehouse Transfer', status: 'COMPLETED', qcRequired: true, logs: [] },
      ];
    } else if (type.includes('DRY SYRUP') || type.includes('CREAM') || type.includes('OINTMENT') || type.includes('DERMA')) {
      baseSteps = [
        { step: 1, name: '1. Dispensing & Formulations Order Sheet', status: 'COMPLETED', qcRequired: true, logs: [] },
        { step: 2, name: '2. Homogenization & Blending', status: 'COMPLETED', qcRequired: true, logs: [] },
        { step: 3, name: '3. Container / Bottle / Tube Filling & Sealing', status: 'COMPLETED', qcRequired: true, logs: [] },
        { step: 4, name: '4. Finished Goods (FG) Batch Release & Warehouse Transfer', status: 'COMPLETED', qcRequired: true, logs: [] },
      ];
    } else if (type.includes('SYRUP') || type.includes('SOLUTION') || type.includes('EMULSION') || type.includes('SUSPENSION') || type.includes('LIQUID')) {
      baseSteps = [
        { step: 1, name: '1. Dispensing & Formulations Order Sheet', status: 'COMPLETED', qcRequired: true, logs: [] },
        { step: 2, name: '2. Sugar Base & Compounding', status: 'COMPLETED', qcRequired: true, logs: [] },
        { step: 3, name: '3. Liquid Filling & Labelling', status: 'COMPLETED', qcRequired: true, logs: [] },
        { step: 4, name: '4. Finished Goods (FG) Batch Release & Warehouse Transfer', status: 'COMPLETED', qcRequired: true, logs: [] },
      ];
    } else if (type.includes('ORS') || type.includes('SACHET')) {
      baseSteps = [
        { step: 1, name: '1. Dispensing & Formulations Order Sheet', status: 'COMPLETED', qcRequired: true, logs: [] },
        { step: 2, name: '2. Dry Powder Mixing & Blending', status: 'COMPLETED', qcRequired: true, logs: [] },
        { step: 3, name: '3. Automatic Sachet Filling & Sealing', status: 'COMPLETED', qcRequired: true, logs: [] },
        { step: 4, name: '4. Finished Goods (FG) Batch Release & Warehouse Transfer', status: 'COMPLETED', qcRequired: true, logs: [] },
      ];
    } else if (type.includes('PFS')) {
      baseSteps = [
        { step: 1, name: '1. Dispensing & Formulations Order Sheet', status: 'COMPLETED', qcRequired: true, logs: [] },
        { step: 2, name: '2. Sterile Compounding & Filtration', status: 'COMPLETED', qcRequired: true, logs: [] },
        { step: 3, name: '3. Aseptic Syringe Filling & Stoppering', status: 'COMPLETED', qcRequired: true, logs: [] },
        { step: 4, name: '4. Finished Goods (FG) Batch Release & Warehouse Transfer', status: 'COMPLETED', qcRequired: true, logs: [] },
      ];
    } else {
      // Default: Tablet Pipeline (6 Stages ending with Finished Goods Warehouse Transfer)
      baseSteps = [
        { step: 1, name: '1. Dispensing & Formulations Order Sheet', status: 'COMPLETED', qcRequired: true, logs: [] },
        { step: 2, name: '2. Granulation & Blending Reconciliation', status: 'COMPLETED', qcRequired: true, logs: [] },
        { step: 3, name: '3. Compression & Core Tablet Reconciliation', status: 'COMPLETED', qcRequired: true, logs: [] },
        { step: 4, name: '4. Coating Reconciliation', status: 'COMPLETED', qcRequired: true, logs: [] },
        { step: 5, name: '5. Primary Blister Packaging Reconciliation', status: 'COMPLETED', qcRequired: true, logs: [] },
        { step: 6, name: '6. Finished Goods (FG) Batch Release & Warehouse Transfer', status: 'COMPLETED', qcRequired: true, logs: [] },
      ];
    }
    return baseSteps;
  }

  async findAllBoms(): Promise<any[]> {
    try {
      const rows: any[] = await this.dataSource.query(`SELECT * FROM recipes_bom;`).catch(() => []);
      if (rows && rows.length > 0) {
        const groupedMap = new Map();
        rows.forEach((r, idx) => {
          const pName = r.product_name || r.productName || r.productname || `Product-${idx}`;
          const pCode = r.product_code || r.productCode || `SKU-${idx}`;
          const rawForm = r.dosage_form || r.dosageForm;
          const dForm = this.detectDosageForm(pName, rawForm);
          const bSize = r.batch_size || r.batchSize || '100,000 Units';

          if (!groupedMap.has(pName)) {
            groupedMap.set(pName, {
              id: r.id || idx + 1,
              productCode: String(pCode),
              productName: String(pName),
              dosageForm: dForm,
              batchSize: String(bSize),
              ingredientsJson: [],
              status: r.status || 'ACTIVE'
            });
          }

          if (r.ingredients_json) {
            try {
              const parsed = JSON.parse(r.ingredients_json);
              groupedMap.get(pName).ingredientsJson = parsed;
            } catch {}
          } else {
            groupedMap.get(pName).ingredientsJson.push({
              materialCode: r.material_code || r.materialCode || 'RM-001',
              materialName: r.material_name || r.materialName || 'Raw Material',
              reqPerTabMg: r.req_per_tab_mg || r.qty_per_unit || 10,
              stdQtyKg: r.theoretical_qty || 10,
              potency: r.potency || 100,
              overagePercent: r.overage || 0
            });
          }
        });
        return Array.from(groupedMap.values());
      }
      return [];
    } catch (err) {
      console.error('Error fetching BOMs from database:', err);
      return [];
    }
  }

  /**
   * Returns all batches strictly normalized to 'Completed' status.
   */
  async findAllBatches(): Promise<any[]> {
    try {
      const rows: any[] = await this.dataSource.query(
        `SELECT * FROM production_batches ORDER BY datetime(start_date) DESC, rowid DESC;`
      ).catch(() => []);

      if (rows && rows.length > 0) {
        return rows.map((b: any, index: number) => {
          const pName = b.product || b.product_name || b.productName || `Product-${index + 1}`;
          const bNo = b.batch_number || b.batchNumber || b.batchId || `B-00${index + 1}`;
          const tQty = b.target_quantity || b.targetQuantity || 1000;
          const startDate = b.start_date || b.startDate || new Date().toISOString().replace('T', ' ').substring(0, 19);

          let stages = this.getPipelineStepsForProductType(b.type || pName);
          try {
            const parsed = typeof b.bmr_stages_json === 'string'
              ? JSON.parse(b.bmr_stages_json)
              : (b.bmr_stages_json || b.bmrStagesJson || []);
            if (Array.isArray(parsed) && parsed.length > 0) {
              stages = parsed.map((st: any) => ({ ...st, status: 'COMPLETED' }));
            }
          } catch {}

          let dispensingMatrix = [];
          try {
            dispensingMatrix = typeof b.dispensing_matrix_json === 'string'
              ? JSON.parse(b.dispensing_matrix_json)
              : (b.dispensing_matrix_json || []);
          } catch {}

          return {
            id: b.id || b.batchId || b.rowid || index + 1,
            batchNumber: String(bNo),
            productCode: String(b.product_code || b.productCode || 'PRD-001'),
            productName: String(pName),
            targetQuantity: Number(tQty),
            lineReference: b.line_reference || b.lineReference || 'Main Line 01',
            type: b.type || this.detectDosageForm(pName),
            status: 'Completed', // Strictly forced to Completed status
            bmrStagesJson: stages,
            dispensingMatrixJson: dispensingMatrix,
            startDate: String(startDate),
            qr_payload: b.qr_payload || b.qrPayload,
          };
        });
      }
      return [];
    } catch (err) {
      console.error('Error fetching batches from database:', err);
      return [];
    }
  }

  /**
   * Initiates a production batch, deducts raw material lots accurately, locks status to 'Completed',
   * generates 100% offline scannable QR payload, and instantly transfers output to Finished Goods inventory.
   */
  async createBatch(data: any): Promise<any> {
    const uniqueId = `ID-${Math.floor(Date.now() / 1000)}`;
    const batchIdStr = `BCH-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const pCode = data.productCode || 'PRD001';
    const pName = data.productName || 'Pharmaceutical Product';
    const targetQty = Number(data.targetQuantity) || 100000;
    const lineRef = data.lineReference || 'Solid Oral Suite B / Line 01';
    const productType = data.productType || this.detectDosageForm(pName);

    const countResult = await this.dataSource.query(`SELECT COUNT(*) as cnt FROM production_batches`);
    const nextSeq = (countResult[0]?.cnt || 0) + 1;
    const batchNo = this.qrGeneratorService.generateStructuredBatchNumber(pCode, nextSeq);
    
    const bomRows = await this.dataSource.query(
      `SELECT * FROM recipes_bom WHERE product_name = ? OR product_code = ?`,
      [pName, pCode]
    ).catch(() => []);

    let rawIngredients: any[] = [];
    if (bomRows.length > 0 && bomRows[0].ingredients_json) {
      try {
        rawIngredients = JSON.parse(bomRows[0].ingredients_json);
      } catch {}
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const calculatedDispensingMatrix: any[] = [];
      let totalApiExtraWeightKg = 0;
      let adjustmentExcipientIndex = -1;

      for (let idx = 0; idx < rawIngredients.length; idx++) {
        const ing = rawIngredients[idx];
        const matName = ing.materialName || ing.name || 'Raw Material';
        const matCode = ing.materialCode || `RM-${1000 + idx}`;
        
        const reqPerUnitMg = Number(ing.reqPerTabMg || ing.reqPerUnitMg || ing.qtyPerUnit || 10);
        const overagePercent = Number(ing.overagePercent || ing.overage || 0);

        const stdQtyKg = Number(((reqPerUnitMg * targetQty * (1 + overagePercent / 100)) / 1000000).toFixed(3));

        const availableLots = await queryRunner.query(
          `SELECT id, lotNumber, 
                  COALESCE(qcRefNo, 'QC-PASS-091') as qcRefNo, 
                  COALESCE(assayPercent, 100) as assayPercent, 
                  COALESCE(receivedQuantity, 0) as receivedQuantity, 
                  COALESCE(unitPrice, 0) as unitPrice 
           FROM inventory_raw_material_lots 
           WHERE LOWER(TRIM(materialName)) = LOWER(TRIM(?)) 
             AND (qcStatus = 'PASSED' OR qcStatus IS NULL OR qcStatus = '') 
             AND COALESCE(receivedQuantity, 0) > 0 
           ORDER BY receivedDate ASC`,
          [matName]
        ).catch(() => []);

        let activeLotNo = 'LOT-2026-01';
        let activeQcRef = 'QC-PASS-091';
        let assayPercent = Number(ing.potency || ing.assayPercent || 100);
        let availableStock = 0;

        if (availableLots && availableLots.length > 0) {
          activeLotNo = availableLots[0].lotNumber || activeLotNo;
          activeQcRef = availableLots[0].qcRefNo || activeQcRef;
          assayPercent = Number(availableLots[0].assayPercent || assayPercent);
          availableStock = availableLots.reduce((acc: number, l: any) => acc + Number(l.receivedQuantity || 0), 0);
        }

        let potencyAdjustedQtyKg = stdQtyKg;
        if (assayPercent > 0 && assayPercent < 100) {
          potencyAdjustedQtyKg = Number(((stdQtyKg * 100) / assayPercent).toFixed(4));
          totalApiExtraWeightKg += (potencyAdjustedQtyKg - stdQtyKg);
        }

        const isAdjustmentExcipient = matName.toLowerCase().includes('adjustment') || matName.toLowerCase().includes('starch') || matName.toLowerCase().includes('lactose');
        if (isAdjustmentExcipient && adjustmentExcipientIndex === -1) {
          adjustmentExcipientIndex = idx;
        }

        calculatedDispensingMatrix.push({
          materialCode: matCode,
          materialName: matName,
          lotNo: activeLotNo,
          qcRefNo: activeQcRef,
          unit: 'mg',
          overagePercent,
          reqPerTabMg: reqPerUnitMg,
          stdQtyKg,
          assayPercent,
          potencyAdjustedQtyKg,
          multilotCal: potencyAdjustedQtyKg,
          inventoryAvailableKg: availableStock,
          isShortage: availableStock < potencyAdjustedQtyKg,
          shortageAmountKg: availableStock < potencyAdjustedQtyKg ? Number((potencyAdjustedQtyKg - availableStock).toFixed(3)) : 0
        });
      }

      if (adjustmentExcipientIndex >= 0 && totalApiExtraWeightKg > 0) {
        const adjItem = calculatedDispensingMatrix[adjustmentExcipientIndex];
        const newAdjustedQty = Math.max(0, Number((adjItem.potencyAdjustedQtyKg - totalApiExtraWeightKg).toFixed(3)));
        calculatedDispensingMatrix[adjustmentExcipientIndex].potencyAdjustedQtyKg = newAdjustedQty;
        calculatedDispensingMatrix[adjustmentExcipientIndex].multilotCal = newAdjustedQty;
      }

      for (const item of calculatedDispensingMatrix) {
        let remainingToDeduct = item.potencyAdjustedQtyKg;
        const lotRows = await queryRunner.query(
          `SELECT id, COALESCE(receivedQuantity, 0) as receivedQuantity FROM inventory_raw_material_lots 
           WHERE LOWER(TRIM(materialName)) = LOWER(TRIM(?)) AND (qcStatus = 'PASSED' OR qcStatus IS NULL OR qcStatus = '') AND COALESCE(receivedQuantity, 0) > 0 
           ORDER BY receivedDate ASC`,
          [item.materialName]
        ).catch(() => []);

        for (const lot of lotRows) {
          if (remainingToDeduct <= 0) break;
          const lotQty = Number(lot.receivedQuantity);
          if (lotQty >= remainingToDeduct) {
            await queryRunner.query(
              `UPDATE inventory_raw_material_lots SET receivedQuantity = receivedQuantity - ? WHERE id = ?`,
              [remainingToDeduct, lot.id]
            );
            remainingToDeduct = 0;
          } else {
            remainingToDeduct -= lotQty;
            await queryRunner.query(
              `UPDATE inventory_raw_material_lots SET receivedQuantity = 0 WHERE id = ?`,
              [lot.id]
            );
          }
        }
      }

      // 100% scannable offline QR payload format (scannable anywhere in the world offline)
      const startDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const offlineQrPayload = `AMICO-ERP|BATCH:${batchNo}|SKU:${pCode}|NAME:${pName}|QTY:${targetQty}|LINE:${lineRef}|DATE:${startDate}`;

      const clientName = data.client || 'Internal Pharma';
      const categoryName = data.category || productType;
      const batchSizeVal = data.batchSize || `${targetQty} Units`;
      const stageVal = 'Finished Goods Release';
      const eqIdVal = data.eqId || 'EQ-01';
      const operatorVal = data.operator || 'System Operator';
      
      const pipelineSteps = this.getPipelineStepsForProductType(productType);
      const stagesJson = JSON.stringify(pipelineSteps);
      const matrixJson = JSON.stringify(calculatedDispensingMatrix);

      // Insert batch with strictly 'Completed' status
      await queryRunner.query(
        `INSERT INTO production_batches 
         (id, batchId, eqId, operator, ipqcStatus, qcStatus, qaRelease, status, batch_number, product_code, product_name, product, type, category, client, batchSize, stage, target_quantity, line_reference, bmr_stages_json, start_date, qr_payload, dispensing_matrix_json) 
         VALUES (?, ?, ?, ?, 'PASS', 'PASS', 'RELEASED', 'Completed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uniqueId, batchIdStr, eqIdVal, operatorVal,
          batchNo, pCode, pName, pName, productType, categoryName, clientName, batchSizeVal, stageVal,
          targetQty, lineRef, stagesJson, startDate, offlineQrPayload, matrixJson
        ]
      );

      // Instantly sync into Finished Goods central warehouse
      const stockId = `ID-FG-SYNC-${batchNo}`;
      await queryRunner.query(
        `INSERT INTO inventory_warehouse_stocks 
         (id, warehouseType, locationName, itemCode, itemName, category, availableQuantity, unit, unitValuationBDT, batchNumber, status, createdAt, remarks)
         VALUES (?, 'FINISHED_GOODS', 'Birulia Central Finished Goods Warehouse', ?, ?, ?, ?, 'box', 500, ?, 'RECEIVED', ?, ?)`,
        [stockId, pCode, pName, categoryName, targetQty, batchNo, startDate, `Instantly synced upon batch completion.`]
      );

      await queryRunner.commitTransaction();
      return { 
        success: true, 
        batchNumber: batchNo, 
        productName: pName, 
        productCode: pCode,
        status: 'Completed',
        dispensingMatrix: calculatedDispensingMatrix,
        qrPayload: offlineQrPayload 
      };
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Failed to create batch and execute inventory sync: ${err?.message || err}`);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Forces status updates to remain strictly 'Completed' and transfers output yield to Finished Goods warehouse.
   */
  async updateBatchStatus(id: any, status: string, bmrStagesJson?: string): Promise<any> {
    try {
      let stages = [];
      if (bmrStagesJson) {
        try {
          stages = typeof bmrStagesJson === 'string' ? JSON.parse(bmrStagesJson) : bmrStagesJson;
        } catch {}
      }

      const stagesToSave = Array.isArray(stages) && stages.length > 0 
        ? stages.map((st: any) => ({ ...st, status: 'COMPLETED' }))
        : this.getPipelineStepsForProductType('Tablet');

      const stagesString = JSON.stringify(stagesToSave);

      // Force main status to always be 'Completed'
      await this.dataSource.query(
        `UPDATE production_batches SET status = 'Completed', bmr_stages_json = ? WHERE id = ? OR batchId = ? OR batch_number = ?`,
        [stagesString, id, id, id]
      );

      const batchRows = await this.dataSource.query(
        `SELECT * FROM production_batches WHERE id = ? OR batchId = ? OR batch_number = ?`,
        [id, id, id]
      );

      if (batchRows && batchRows.length > 0) {
        const b = batchRows[0];
        const prodName = b.product_name || b.product || 'Finished Product';
        const prodCode = b.product_code || b.productCode || 'PROD-001';
        const batchNo = b.batch_number || b.batchNumber || b.batchId || 'BMR-2026-001';
        const releasedQty = Number(b.target_quantity || b.targetQuantity || 100000);
        const stockId = `ID-FG-SYNC-${batchNo}`;
        const exactTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

        await this.dataSource.query(
          `INSERT INTO inventory_warehouse_stocks 
           (id, warehouseType, locationName, itemCode, itemName, category, availableQuantity, unit, unitValuationBDT, batchNumber, status, createdAt, remarks)
           VALUES (?, 'FINISHED_GOODS', 'Birulia Central Finished Goods Warehouse', ?, ?, ?, ?, 'box', 500, ?, 'RECEIVED', ?, ?)
           ON CONFLICT(id) DO UPDATE SET 
             availableQuantity = excluded.availableQuantity,
             status = 'RECEIVED',
             remarks = excluded.remarks;`,
          [
            stockId,
            prodCode,
            prodName,
            b.category || 'FINISHED_GOOD',
            releasedQty,
            batchNo,
            exactTimestamp,
            `Successfully transferred from completed production batch ${batchNo}.`
          ]
        );
      }
    } catch (err) {
      console.error('Error updating batch status & transferring to Finished Goods:', err);
      throw err;
    }
    return { success: true, id, status: 'Completed' };
  }

  /**
   * Precise transfer of finished goods from central warehouse to regional depots.
   * Regional depots hold only finished goods. Validates central stock availability and deducts accurately.
   */
  async transferToDepot(data: { itemCode: string; batchNumber: string; quantity: number; unit: string; destinationDepot: string; remarks?: string }): Promise<any> {
    const transferId = `TRF-${Math.floor(Date.now() / 1000)}`;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    const centralStock = await this.dataSource.query(
      `SELECT * FROM inventory_warehouse_stocks WHERE batchNumber = ? AND warehouseType = 'FINISHED_GOODS' LIMIT 1`,
      [data.batchNumber]
    ).catch(() => []);

    if (!centralStock || centralStock.length === 0) {
      throw new Error(`Batch ${data.batchNumber} not found in central Finished Goods warehouse.`);
    }

    const currentQty = Number(centralStock[0].availableQuantity);
    const transferQty = Number(data.quantity);

    if (currentQty < transferQty) {
      throw new Error(`Insufficient central Finished Goods stock for batch ${data.batchNumber}. Available: ${currentQty}, Requested: ${transferQty}`);
    }

    await this.dataSource.query(
      `UPDATE inventory_warehouse_stocks SET availableQuantity = availableQuantity - ? WHERE id = ?`,
      [transferQty, centralStock[0].id]
    );

    const depotStockId = `ID-DEPOT-${data.destinationDepot.replace(/\s+/g, '-')}-${data.batchNumber}`;
    await this.dataSource.query(
      `INSERT INTO inventory_warehouse_stocks 
       (id, warehouseType, locationName, itemCode, itemName, category, availableQuantity, unit, unitValuationBDT, batchNumber, status, createdAt, remarks)
       VALUES (?, 'REGIONAL_DEPOT', ?, ?, ?, ?, ?, ?, ?, ?, 'RECEIVED', ?, ?)
       ON CONFLICT(id) DO UPDATE SET 
         availableQuantity = availableQuantity + excluded.availableQuantity,
         status = 'RECEIVED',
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
      batchNumber: data.batchNumber, 
      transferredQuantity: transferQty,
      remainingCentralStock: currentQty - transferQty 
    };
  }

  async createBom(data: any): Promise<any> {
    const newBom = this.bomRepository.create({
      product_name: data.productName,
      product_code: data.productCode,
      batch_size: data.batchSize,
      dosage_form: data.dosageForm, 
      ingredients_json: typeof data.ingredientsJson === 'string' ? data.ingredientsJson : JSON.stringify(data.ingredientsJson),
      status: 'ACTIVE',
    });
    return await this.bomRepository.save(newBom);
  }
}