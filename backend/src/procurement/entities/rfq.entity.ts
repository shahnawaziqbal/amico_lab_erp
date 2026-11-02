// backend/src/procurement/entities/rfq.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('procurement_rfqs')
export class Rfq {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  rfqNumber: string;

  @Column({ nullable: true })
  requisitionId: string;

  @Column()
  targetVendors: string;

  @Column({ nullable: true })
  issuanceDate: string;

  @Column({ nullable: true })
  closingDate: string; // Matches the database column

  @Column({ default: 'OPEN' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}