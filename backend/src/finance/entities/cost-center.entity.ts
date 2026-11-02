import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OverheadSalary } from './overhead-salary.entity';
import { JournalEntryLine } from './journal-entry-line.entity';

export enum CostCenterType {
  HEAD_OFFICE = 'HEAD_OFFICE',
  PLANT = 'PLANT',
  DEPOT = 'DEPOT',
}

@Entity('cost_centers')
export class CostCenter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'code', unique: true })
  code: string;

  @Column({ name: 'name' })
  name: string;

  @Column({
    type: 'varchar',
    length: 30,
    default: CostCenterType.DEPOT,
  })
  type: CostCenterType;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => OverheadSalary, (overhead) => overhead.costCenter)
  overheads: OverheadSalary[];

  @OneToMany(() => JournalEntryLine, (line) => line.costCenter)
  journalEntryLines: JournalEntryLine[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}