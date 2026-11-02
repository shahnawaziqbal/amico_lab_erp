import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JournalEntryLine } from './journal-entry-line.entity';
import { Party } from './party.entity';

export enum JournalEntryStatus {
  POSTED = 'POSTED',
  DRAFT = 'DRAFT',
  VOID = 'VOID',
}

@Entity('journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entry_number', unique: true })
  entryNumber: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'reference_id', nullable: true })
  referenceId?: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: JournalEntryStatus.POSTED,
  })
  status: JournalEntryStatus;

  @Column({ name: 'party_id', nullable: true })
  partyId?: string;

  @ManyToOne(() => Party, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'party_id' })
  party?: Party;

  @Column({ name: 'total_amount', type: 'real', default: 0 })
  totalAmount: number;

  @Column({ name: 'paid_amount', type: 'real', default: 0 })
  paidAmount: number;

  @Column({ name: 'outstanding_amount', type: 'real', default: 0 })
  outstandingAmount: number;

  @Column({ name: 'vat_input', type: 'real', default: 0 })
  vatAmount: number;

  @Column({ name: 'entry_type', type: 'varchar', length: 20, default: 'RECEIVABLE' })
  entryType: string;

  @Column({ name: 'payment_category', type: 'varchar', length: 30, default: 'CASH' })
  paymentCategory: string;

  @OneToMany(() => JournalEntryLine, (line) => line.journalEntry, {
    cascade: true,
  })
  lines: JournalEntryLine[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}