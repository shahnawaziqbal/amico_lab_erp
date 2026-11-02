// backend/src/procurement/models/quarantine-item.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('procurement_quarantine_items')
export class QuarantineItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  poNumber: string;

  @Column()
  itemName: string;

  @Column()
  materialSubtype: string; // 'ALUMINIUM_FOIL', 'PLASTIC_BOTTLE', 'API', etc.

  @Column('decimal', { precision: 12, scale: 2 })
  receivedQuantity: number;

  @Column()
  unit: string;

  @Column({ default: 'PENDING_TESTING' })
  testingStatus: string; // 'PENDING_TESTING', 'PASSED_GRN_ISSUED', 'FAILED_VENDOR_RETURN'

  @Column({ nullable: true })
  inspectorName: string; // e.g., QA Pharmacist Dr. Farhana Yasmin

  @Column({ nullable: true })
  testReportRemarks: string;

  @CreateDateColumn()
  inspectedAt: Date;
}