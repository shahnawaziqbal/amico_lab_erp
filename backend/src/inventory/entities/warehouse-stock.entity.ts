import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum WarehouseType {
  RAW_MATERIALS = 'RAW_MATERIALS',
  PACKAGING_MATERIALS = 'PACKAGING_MATERIALS',
  FINISHED_GOODS = 'FINISHED_GOODS',
  REGIONAL_DEPOT = 'REGIONAL_DEPOT',
  OFFICE_SUPPLIES = 'OFFICE_SUPPLIES',
}

@Entity('inventory_warehouse_stocks')
export class WarehouseStock {
  @PrimaryColumn('text')
  id: string;

  @Column({ type: 'varchar', default: WarehouseType.RAW_MATERIALS })
  warehouseType: WarehouseType;

  @Column({ default: 'Birulia Plant Central Store' })
  locationName: string;

  @Column({ nullable: true })
  itemCode: string;

  @Column({ nullable: true })
  itemName: string;

  @Column({ default: 'GENERAL' })
  category: string; // 'API', 'EXCIPIENT', 'ALUMINIUM_FOIL', 'CARTON', 'FINISHED_GOOD', 'STATIONERY'

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  availableQuantity: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  quarantineQuantity: number;

  @Column('decimal', { precision: 12, scale: 2, default: 100 })
  reorderLevel: number;

  @Column({ default: 'box' })
  unit: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  unitValuationBDT: number;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ type: 'date', nullable: true })
  expiryDate: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  lastUpdated: Date;
}