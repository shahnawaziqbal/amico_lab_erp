import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('compliance_records')
export class ComplianceRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  regulationName: string; // e.g., 'ISO 14001', 'OSHA Safety Standard'

  @Column()
  department: string; // e.g., 'Production', 'Maintenance', 'Warehouse'

  @Column({ default: 'Compliant' })
  status: string; // Compliant, Under Review, Non-Compliant

  @Column({ nullable: true })
  auditor: string;

  @CreateDateColumn()
  auditDate: Date;
}