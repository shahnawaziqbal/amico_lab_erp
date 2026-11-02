import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('inventory_internal_requisitions')
export class InternalRequisition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  requisitionNumber: string; // e.g., 'REQ-2026-884'

  @Column()
  requestingDepartment: string; // 'FACTORY_PRODUCTION', 'HEAD_OFFICE_ADMIN', 'DEPOT_LOGISTICS', 'PLANT_MAINTENANCE'

  @Column({ default: 'PENDING' })
  status: string; // 'PENDING', 'APPROVED', 'DISPATCHED', 'REJECTED'

  @Column({ type: 'date' })
  requestDate: string;

  @Column({ nullable: true })
  purposeRemarks: string;

  @Column('simple-json', { nullable: true })
  items: Array<{
    itemCode: string;
    itemName: string;
    requestedQty: number;
    unit: string;
    category: string;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}