// backend/src/procurement/models/supplier-quotation.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('procurement_supplier_quotations')
export class SupplierQuotation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  rfqId: string;

  @Column()
  vendorName: string;

  @Column('decimal', { precision: 12, scale: 2 })
  quotedUnitPrice: number;

  @Column('decimal', { precision: 12, scale: 2 })
  totalQuotedAmount: number;

  @Column({ default: 'SUBMITTED' })
  status: string; // 'SUBMITTED', 'SELECTED', 'REJECTED'

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;
}
