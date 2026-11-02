import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('crm_customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  companyName: string; // e.g., 'Apex Distributors Ltd.'

  @Column()
  contactPerson: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ default: 'Active Lead' })
  status: string; // Active Lead, Partner, Key Account, Inactive

  @CreateDateColumn()
  createdAt: Date;
}