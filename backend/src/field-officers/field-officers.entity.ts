import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('field_officers')
export class FieldOfficer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  teriCode: string;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  depotCode: string;

  @Column({ nullable: true })
  depotName: string;

  @Column({ nullable: true })
  joinDate: string;

  @Column({ nullable: true })
  tenureMonths: number;

  @Column({ nullable: true })
  tenureBand: string;

  @Column({ type: 'float', nullable: true })
  currentSales: number;

  @Column({ type: 'float', nullable: true })
  threeMonthAvg: number;

  @Column({ type: 'float', nullable: true })
  compositeScore: number;

  @Column({ nullable: true })
  rank: string;

  @Column({ nullable: true, default: 'C – Developing' })
  tier: string;

  @CreateDateColumn()
  createdAt: Date;
}