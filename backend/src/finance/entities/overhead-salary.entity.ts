import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CostCenter } from './cost-center.entity';

@Entity('overhead_salaries')
export class OverheadSalary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cost_center_id' })
  costCenterId: string;

  @ManyToOne(() => CostCenter, (costCenter) => costCenter.overheads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cost_center_id' })
  costCenter: CostCenter;

  @Column({ type: 'varchar', length: 7 })
  period: string; // Format: YYYY-MM

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'employee_salary' })
  employeeSalary: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'labor_salary' })
  laborSalary: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  utilities: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  capex: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  opex: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'total_overhead' })
  totalOverhead: number;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}