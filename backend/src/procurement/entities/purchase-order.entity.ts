// backend/src/procurement/models/purchase-order.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

@Entity('procurement_purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  poNumber: string; // e.g., 'AMICO-PO-2026-001'

  @Column()
  vendorName: string;

  @Column({ default: 'LOCAL' })
  vendorType: string; // 'LOCAL' or 'IMPORT'

  @Column({ type: 'date' })
  orderDate: string;

  @Column({ type: 'date' })
  expectedDeliveryDate: string;

  @Column({ default: 'IN_QUARANTINE' })
  status: string; // 'IN_QUARANTINE', 'QC_PASSED_GRN', 'VENDOR_RETURN'

  @Column('decimal', { precision: 14, scale: 2 })
  grandTotal: number;

  @Column({ default: 'POSTED_TO_AP_21100' })
  ledgerStatus: string;

  @OneToMany(() => PurchaseOrderItem, item => item.purchaseOrder, { cascade: true })
  items: PurchaseOrderItem[];

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('procurement_purchase_order_items')
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PurchaseOrder, po => po.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder: PurchaseOrder;

  @Column()
  purchaseOrderId: string;

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

  @Column('decimal', { precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ default: 'QUARANTINE_PENDING' })
  qcStatus: string; // 'QUARANTINE_PENDING', 'PASSED', 'FAILED_RETURNED'

  @Column({ nullable: true })
  qcRemarks: string;
}