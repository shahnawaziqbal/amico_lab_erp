import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('inventory_raw_material_lots')
export class RawMaterialLot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  lotNumber: string;

  @Column()
  materialName: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  receivedQuantity: number;

  @Column()
  unit: string;

  @Column({ default: 'QUARANTINE' })
  qcStatus: string; // 'QUARANTINE', 'PASSED', 'REJECTED'

  @CreateDateColumn()
  receivedDate: Date;
}