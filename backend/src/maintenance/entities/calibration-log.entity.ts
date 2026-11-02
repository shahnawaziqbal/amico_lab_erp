import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Asset } from './asset.entity';

@Entity('pm_calibration_logs')
export class CalibrationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  certificateNumber: string; // e.g., 'CAL-2026-0806'

  @Column({ type: 'date' })
  calibrationDate: Date;

  @Column({ type: 'date' })
  nextDueDate: Date;

  @Column()
  performedBy: string; // Certified Agency / Technician Name

  @Column({ default: true })
  isPassed: boolean;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @ManyToOne(() => Asset, (asset) => asset.calibrationLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  @Column()
  assetId: string;

  @CreateDateColumn()
  createdAt: Date;
}