// hrm.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('hrm_employees')
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  employeeCode: string; // e.g., 'AMICO-2084'

  @Column()
  fullName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ name: 'designation' })
  role: string; // Designation

  @Column()
  department: string;

  @Column({ default: 'Head Office - Corporate' })
  facility: string;

  @Column({ default: 'Salaried' })
  payrollType: string; // 'Salaried' or 'Hourly Wage'

  @Column({ name: 'salary', type: 'decimal', precision: 12, scale: 2 })
  baseSalary: number; // Base Wage

  @Column({ type: 'date', nullable: true })
  joiningDate: string;

  @Column({ type: 'date', nullable: true })
  probationEndDate: string;

  @Column({ default: true })
  hasProvidentFund: boolean;

  @Column({ default: 10 })
  providentFundRate: number; // Percentage e.g., 10%

  @Column({ default: true })
  hasGratuity: boolean;

  @Column({ default: false })
  usesCompanyCar: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  carOverheadCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxDeductionTds: number; // Monthly NBR TDS deduction

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  bankAccountNumber: string;

  @Column({ default: 'Active' })
  employmentStatus: string; // 'Active', 'On Leave', 'Terminated'

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('hrm_attendance_logs')
export class AttendanceLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  employeeCode: string;

  @Column()
  facility: string;

  @Column()
  checkInTime: string;

  @Column({ nullable: true })
  checkOutTime: string;

  @Column({ default: 'Present' })
  status: string; // 'Present', 'Late', 'Absent', 'Field Duty'

  @CreateDateColumn()
  logDate: Date;
}

@Entity('hrm_payroll_dispatches')
export class PayrollDispatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  dispatchMonth: string; // e.g., 'October 2026'

  @Column('decimal', { precision: 14, scale: 2 })
  totalGrossPayout: number;

  @Column('decimal', { precision: 14, scale: 2 })
  totalTdsDeductions: number;

  @Column('decimal', { precision: 14, scale: 2 })
  totalPfDeductions: number;

  @Column('decimal', { precision: 14, scale: 2 })
  netPayableDisbursement: number;

  @Column({ default: 'POSTED_TO_FINANCE' })
  ledgerStatus: string;

  @CreateDateColumn()
  dispatchedAt: Date;
}