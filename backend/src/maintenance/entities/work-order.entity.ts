import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Asset } from './asset.entity';

export enum WorkOrderType {
  BREAKDOWN = 'BREAKDOWN',
  PREVENTIVE = 'PREVENTIVE',
  CALIBRATION = 'CALIBRATION',
  UTILITY_INSPECTION = 'UTILITY_INSPECTION',
}

export enum WorkOrderPriority {
  EMERGENCY = 'EMERGENCY', // e.g., Line stopped, Cleanroom HVAC failure
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum WorkOrderStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_PARTS = 'PENDING_PARTS',
  COMPLETED = 'COMPLETED',
  VERIFIED = 'VERIFIED',
}

@Entity('pm_work_orders')
export class WorkOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  workOrderNumber: string; // e.g., 'WO-2026-0806-001'

  @Column({
    type: 'simple-enum',
    enum: WorkOrderType,
    default: WorkOrderType.BREAKDOWN,
  })
  type: WorkOrderType;

  @Column({
    type: 'simple-enum',
    enum: WorkOrderPriority,
    default: WorkOrderPriority.MEDIUM,
  })
  priority: WorkOrderPriority;

  @Column({
    type: 'simple-enum',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.OPEN,
  })
  status: WorkOrderStatus;

  @Column('text')
  description: string; // Breakdown symptom reported by operator

  @Column({ nullable: true })
  assignedTechnician: string; // e.g., 'Eng. Rahim'

  @Column({ type: 'text', nullable: true })
  rootCauseAnalysis: string; // Mandatory 5-Why / Ishikawa notes before closure

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

  @ManyToOne(() => Asset, (asset) => asset.workOrders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  @Column()
  assetId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}