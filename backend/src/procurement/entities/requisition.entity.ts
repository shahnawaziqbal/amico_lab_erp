// backend/src/procurement/models/requisition.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('procurement_requisitions')
export class Requisition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  reqNumber: string; // e.g., 'REQ-2026-001'

  @Column()
  department: string; // e.g., 'Plant Operations', 'Quality Assurance'

  @Column()
  requestedBy: string;

  @Column({ type: 'date' })
  requiredDate: string;

  @Column({ default: 'PENDING_APPROVAL' })
  status: string; // 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CONVERTED_TO_RFQ'

  @Column()
  materialCategory: string; // 'RAW_MATERIAL' or 'PACKAGING_MATERIAL'

  @Column()
  materialSubtype: string; // 'API', 'EXCIPIENT', 'ALUMINIUM_FOIL', 'PLASTIC_BOTTLE', 'GLASS_BOTTLE', 'BOTTLE_HEAD', 'CARTON'

  @Column()
  itemName: string;

  @Column('decimal', { precision: 12, scale: 2 })
  quantity: number;

  @Column()
  unit: string; // 'kg', 'pcs', 'rolls'

  @CreateDateColumn()
  createdAt: Date;
}