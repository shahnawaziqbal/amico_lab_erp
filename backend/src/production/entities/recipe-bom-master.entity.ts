import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('recipes_bom')
export class RecipeBomMaster {
  @PrimaryColumn()
  id: number;

  @Column({ nullable: true })
  product_code: string;

  @Column({ nullable: true })
  product_name: string;

  @Column({ nullable: true })
  batch_size: string;

  @Column({ nullable: true })
  dosage_form: string;

  @Column({ type: 'text', nullable: true })
  ingredients_json: string;

  @Column({ nullable: true, default: 'ACTIVE' })
  status: string;
}