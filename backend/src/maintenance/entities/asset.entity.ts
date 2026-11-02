import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { WorkOrder } from './work-order.entity';
import { CalibrationLog } from './calibration-log.entity';

export enum AssetCriticality {
  CLASS_A = 'CRITICAL',      // e.g., HPLC, Compression M/C, Sterilizer
  CLASS_B = 'IMPORTANT',     // e.g., Packaging conveyors, Labeling M/C
  CLASS_C = 'GENERAL',       // e.g., Standard storage tanks
}

export enum AssetStatus {
  OPERATIONAL = 'OPERATIONAL',
  MAINTENANCE_DUE = 'MAINTENANCE_DUE',
  CALIBRATION_EXPIRED = 'CALIBRATION_EXPIRED',
  UNDER_REPAIR = 'UNDER_REPAIR',
  DECOMMISSIONED = 'DECOMMISSIONED',
}

@Entity('pm_assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  assetTag: string; // e.g., 'GPB-MFG-101-LBW-001' or 'EQ QC 001'

  @Column()
  name: string; // e.g., 'Liquid Bottle Washing M/C-01'

  @Column({ nullable: true })
  manufacturer: string; // e.g., 'Litco Machinery'

  @Column({ nullable: true })
  countryOfOrigin: string; // e.g., 'India'

  @Column()
  building: string; // e.g., 'General Production Building (GPB)', 'QC Lab'

  @Column({ nullable: true })
  floor: string; // e.g., 'Ground Floor', '1st Floor'

  @Column()
  roomLocation: string; // e.g., 'Bottle Washing Room', 'HPLC Lab'

  @Column({
    type: 'simple-enum',
    enum: AssetCriticality,
    default: AssetCriticality.CLASS_B,
  })
  criticality: AssetCriticality;

  @Column({
    type: 'simple-enum',
    enum: AssetStatus,
    default: AssetStatus.OPERATIONAL,
  })
  status: AssetStatus;

  @Column({ default: false })
  requiresCalibration: boolean;

  @Column({ type: 'date', nullable: true })
  lastCalibrationDate: Date;

  @Column({ type: 'date', nullable: true })
  nextCalibrationDueDate: Date;

  @OneToMany(() => WorkOrder, (workOrder) => workOrder.asset)
  workOrders: WorkOrder[];

  @OneToMany(() => CalibrationLog, (log) => log.asset)
  calibrationLogs: CalibrationLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}