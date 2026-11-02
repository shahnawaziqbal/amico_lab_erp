import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('sales_orders')
export class SalesOrder {
  @PrimaryColumn({ type: 'text' })
  orderId!: string;

  @Column({ type: 'text' })
  fieldOfficer!: string;

  @Column({ type: 'text' })
  depot!: string;

  @Column({ type: 'text' })
  client!: string;

  @Column({ type: 'text' })
  product!: string;

  @Column({ type: 'text' })
  qty!: string;

  @Column({ type: 'text' })
  amount!: string;

  @Column({ type: 'text', default: 'BDT 0' })
  dueAmount!: string;

  @Column({ type: 'text' })
  paymentStatus!: string;

  @Column({ type: 'text', nullable: true })
  voucherRef!: string;

  @Column({ type: 'text', default: 'Field Order Submitted to Depot' })
  workflowStep!: string;

  @Column({ type: 'text' })
  dispatchDate!: string;

  @Column({ type: 'text' })
  systemDate!: string;

  @CreateDateColumn({ type: 'text' })
  createdAt!: string;
}