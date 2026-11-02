import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('production_batches')
export class ProductionBatchMaster {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar', nullable: true })
  batchId: string;

  @Column({ type: 'varchar', nullable: true })
  batch_number: string;

  @Column({ type: 'varchar', nullable: true })
  product_code: string;

  @Column({ type: 'varchar', nullable: true })
  product_name: string;

  @Column({ type: 'varchar', nullable: true })
  product: string;

  @Column({ type: 'varchar', nullable: true, default: 'Tablet' })
  type: string;

  @Column({ type: 'varchar', nullable: true, default: 'Pharmaceuticals' })
  category: string;

  @Column({ type: 'real', nullable: true, default: 100000 })
  target_quantity: number;

  @Column({ type: 'varchar', nullable: true })
  line_reference: string;

  @Column({ type: 'varchar', nullable: true, default: 'Scheduled' })
  status: string;

  @Column({ type: 'text', nullable: true })
  bmr_stages_json: string;

  @Column({ type: 'text', nullable: true })
  dispensing_matrix_json: string;

  @Column({ type: 'varchar', nullable: true })
  start_date: string;

  @Column({ type: 'text', nullable: true })
  qr_payload: string;
}