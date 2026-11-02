import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('inventory_depot_stocks')
export class DepotInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  depotName: string; // e.g., 'Chittagong Regional Depot', 'Sylhet Depot'

  @Column()
  productCode: string;

  @Column()
  productName: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  stockQuantity: number;

  @Column()
  unit: string;

  @UpdateDateColumn()
  lastUpdated: Date;
}