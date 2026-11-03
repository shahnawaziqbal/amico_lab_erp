import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('office_requisitions') // Creates a clean dedicated table avoiding schema conflicts
export class Requisition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  reqNumber: string;

  @Column({ nullable: true })
  locationType: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  requestDate: string;

  @Column({ nullable: true })
  purposeRemarks: string;

  @Column('text', { nullable: true })
  items: string; // JSON stringified array of items

  @Column({ default: 'PENDING' })
  status: string;

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}