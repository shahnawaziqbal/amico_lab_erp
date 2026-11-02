import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JournalEntry } from './journal-entry.entity';
import { ChartOfAccounts } from './chart-of-accounts.entity';
import { Party } from './party.entity';
import { CostCenter } from './cost-center.entity';

@Entity('journal_entry_lines')
export class JournalEntryLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'journal_entry_id' })
  journalEntryId: string;

  @ManyToOne(() => JournalEntry, (je) => je.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'journal_entry_id' })
  journalEntry: JournalEntry;

  @Column({ name: 'item_name', nullable: true })
  itemName?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  quantity?: number;

  // backend/src/finance/entities/journal-entry-line.entity.ts
@Column({ name: 'unit', nullable: true })
unit?: string; // e.g. 'kg', 'pieces', 'ltr'

  @Column({ name: 'unit_price', type: 'decimal', precision: 15, scale: 2, nullable: true })
  unitPrice?: number;

  @Column({ name: 'account_id' })
  accountId: string;

  @ManyToOne(() => ChartOfAccounts, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'account_id' })
  account: ChartOfAccounts;

  @Column({ name: 'party_id', nullable: true })
  partyId?: string;

  @ManyToOne(() => Party, (party) => party.journalEntryLines, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'party_id' })
  party?: Party;

  @Column({ name: 'cost_center_id', nullable: true })
  costCenterId?: string;

  @ManyToOne(() => CostCenter, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cost_center_id' })
  costCenter?: CostCenter;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  debit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  credit: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}