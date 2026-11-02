// qc-quarantine.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { QuarantineItem } from '../entities/quarantine-item.entity';
import { PurchaseOrderItem, PurchaseOrder } from '../entities/purchase-order.entity';

@Injectable()
export class QcQuarantineService {
  constructor(
    @InjectRepository(QuarantineItem) private quarantineRepo: Repository<QuarantineItem>,
    @InjectRepository(PurchaseOrderItem) private itemRepo: Repository<PurchaseOrderItem>,
    private dataSource: DataSource,
  ) {}

  async findAllQuarantine(): Promise<QuarantineItem[]> {
    return this.quarantineRepo.find({ order: { inspectedAt: 'DESC' } });
  }

  async updateQcStatus(itemId: string, qcStatus: string, remarks: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Fixed TypeORM relation syntax using object notation
      const item = await queryRunner.manager.findOne(PurchaseOrderItem, { 
        where: { id: itemId },
        relations: { purchaseOrder: true }
      });
      if (!item) throw new NotFoundException('Procurement item not found.');

      if (item.qcStatus === 'PASSED' && qcStatus.toUpperCase() === 'PASSED') {
        await queryRunner.commitTransaction();
        return item;
      }

      item.qcStatus = qcStatus;
      item.qcRemarks = remarks || (qcStatus === 'PASSED' ? 'Passed QA & GRN Issued for Production' : 'Failed QA - Return to Vendor');
      await queryRunner.manager.save(PurchaseOrderItem, item);

      // If QC Passed, generate precise timestamp-based unique lot number and sync to respective inventory tab
      if (qcStatus.toUpperCase() === 'PASSED') {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
        const uniqueLotNumber = `LOT-${dateStr}-${timeStr}-${Math.floor(100 + Math.random() * 900)}`;
        const exactTimestamp = now.toISOString().replace('T', ' ').substring(0, 19);

        const poNumber = item.purchaseOrder?.poNumber || 'PO-GEN-001';
        const vendorName = item.purchaseOrder?.vendorName || 'General Supplier';
        const category = (item.materialCategory || '').toUpperCase();

        if (category.includes('PACKAGING')) {
          await queryRunner.manager.query(`
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

          await queryRunner.manager.query(
            `INSERT INTO inventory_packaging_material_lots (id, lotNumber, materialName, receivedQuantity, unit, unitPrice, qcStatus, poNumber, vendorName, receivedDate)
             VALUES (?, ?, ?, ?, ?, ?, 'PASSED', ?, ?, ?)`,
            [
              crypto.randomUUID(),
              uniqueLotNumber,
              item.itemName,
              item.quantity,
              item.unit || 'pcs',
              item.unitPrice || 0,
              poNumber,
              vendorName,
              exactTimestamp
            ]
          );
        } else {
          await queryRunner.manager.query(`
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

          await queryRunner.manager.query(
            `INSERT INTO inventory_raw_material_lots (id, lotNumber, materialName, receivedQuantity, unit, unitPrice, qcStatus, poNumber, vendorName, receivedDate)
             VALUES (?, ?, ?, ?, ?, ?, 'PASSED', ?, ?, ?)`,
            [
              crypto.randomUUID(),
              uniqueLotNumber,
              item.itemName,
              item.quantity,
              item.unit || 'kg',
              item.unitPrice || 0,
              poNumber,
              vendorName,
              exactTimestamp
            ]
          );
        }
      }

      await queryRunner.commitTransaction();
      return item;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}