import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JournalEntryLine } from './journal-entry-line.entity';

export enum PartyType {
  CLIENT = 'CLIENT',
  VENDOR = 'VENDOR',
  BOTH = 'BOTH',
}

@Entity('parties')
export class Party {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: PartyType.CLIENT,
  })
  type: PartyType;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'opening_balance' })
  openingBalance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'current_balance' })
  currentBalance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'credit_limit' })
  creditLimit: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => JournalEntryLine, (line) => line.party)
  journalEntryLines: JournalEntryLine[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}