import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Asset } from './asset.entity';

export enum MaintenanceFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BI_WEEKLY = 'BI_WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  BI_ANNUAL = 'BI_ANNUAL',
  ANNUAL = 'ANNUAL',
}

export enum ScheduleStatus {
  SCHEDULED = 'SCHEDULED',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
}

@Entity('pm_maintenance_schedules')
export class MaintenanceSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  scheduleNumber: string; // e.g., 'PM-2026-001'

  @Column('text')
  taskDescription: string; // e.g., 'Lubricate drive gears, inspect water spray nozzles & sanitize manifold lines'

  @Column({
    type: 'enum',
    enum: MaintenanceFrequency,
    default: MaintenanceFrequency.MONTHLY,
  })
  frequency: MaintenanceFrequency;

  @Column({ type: 'date', nullable: true })
  lastServiceDate: Date;

  @Column({ type: 'date' })
  nextDueDate: Date;

  @Column({
    type: 'enum',
    enum: ScheduleStatus,
    default: ScheduleStatus.SCHEDULED,
  })
  status: ScheduleStatus;

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