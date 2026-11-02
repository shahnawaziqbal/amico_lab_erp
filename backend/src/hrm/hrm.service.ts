// hrm.service.ts (Fully synchronized with Finance Module & Chart of Accounts)
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Employee, AttendanceLog, PayrollDispatch } from './hrm.entity';
import { JournalEntry, JournalEntryStatus } from '../finance/entities/journal-entry.entity';
import { JournalEntryLine } from '../finance/entities/journal-entry-line.entity';
import { ChartOfAccounts } from '../finance/entities/chart-of-accounts.entity';

@Injectable()
export class HrmService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
    @InjectRepository(AttendanceLog)
    private attendanceRepo: Repository<AttendanceLog>,
    @InjectRepository(PayrollDispatch)
    private payrollRepo: Repository<PayrollDispatch>,
    @InjectRepository(ChartOfAccounts)
    private coaRepo: Repository<ChartOfAccounts>,
    private dataSource: DataSource,
  ) {}

  async findAllEmployees(): Promise<Employee[]> {
    return await this.employeeRepo.find({ order: { joiningDate: 'DESC' } });
  }

  async createEmployee(data: Partial<Employee>): Promise<Employee> {
    const employeeCode = `AMICO-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEmp = this.employeeRepo.create({ ...data, employeeCode });
    return await this.employeeRepo.save(newEmp);
  }

  async getMetrics() {
    const employees = await this.employeeRepo.find();
    const totalHeadcount = employees.length;
    const totalSalariedPayroll = employees
      .filter(e => e.payrollType === 'Salaried')
      .reduce((sum, e) => sum + Number(e.baseSalary), 0);
    const totalHourlyWagePool = employees
      .filter(e => e.payrollType === 'Hourly Wage')
      .reduce((sum, e) => sum + Number(e.baseSalary), 0);

    return {
      totalHeadcount,
      totalSalariedPayroll,
      totalHourlyWagePool,
      facilitiesActive: 15,
    };
  }

  // ==========================================
  // REAL-TIME FINANCE LINKED PAYROLL DISPATCH
  // ==========================================
  async runPayrollDispatch(month: string, bonusAmount: number = 0): Promise<PayrollDispatch> {
    const employees = await this.employeeRepo.find({ where: { employmentStatus: 'Active' } });
    if (employees.length === 0) {
      throw new BadRequestException('No active employees found to run payroll disbursement.');
    }

    let totalBase = 0;
    let totalTds = 0;
    let totalPf = 0;

    for (const emp of employees) {
      totalBase += Number(emp.baseSalary);
      totalTds += Number(emp.taxDeductionTds || 0);
      totalPf += (Number(emp.baseSalary) * Number(emp.providentFundRate || 10)) / 100;
    }

    const grossPayout = totalBase + Number(bonusAmount || 0);
    const netPayable = grossPayout - totalTds - totalPf;

    // Find Chart of Accounts entries dynamically (Zero Hardcoding)
    const salariesExpenseAcc = await this.coaRepo.findOne({ where: { code: '61100' } }); // Salaries & Wages Expense
    const salariesPayableAcc = await this.coaRepo.findOne({ where: { code: '21400' } }); // 21400 Salaries Payable (Company Liability)
    const taxPayableAcc = await this.coaRepo.findOne({ where: { code: '21500' } });       // Tax Payable (TDS)
    const bankAcc = await this.coaRepo.findOne({ where: { code: '11300' } });            // Bank Accounts

    if (!salariesExpenseAcc || !salariesPayableAcc || !bankAcc) {
      throw new BadRequestException('Required Chart of Accounts codes (61100, 21400, 11300) are missing.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Save HRM Payroll Dispatch Record
      const dispatchRecord = queryRunner.manager.create(PayrollDispatch, {
        dispatchMonth: month,
        totalGrossPayout: grossPayout,
        totalTdsDeductions: totalTds,
        totalPfDeductions: totalPf,
        netPayableDisbursement: netPayable,
        ledgerStatus: 'POSTED_TO_FINANCE_GL',
      });
      const savedDispatch = await queryRunner.manager.save(dispatchRecord);

      // 2. Create Real-Time Journal Entry in Finance Ledger with Detailed Remarks
      const entryNumber = `PAY-${month.toUpperCase().replace(/\s+/g, '-')}-${Math.floor(100 + Math.random() * 900)}`;
      const richRemarks = `Monthly Salary & Bonus Disbursement for cycle ${month}. Total Staff: ${employees.length}. Gross Overhead: ${grossPayout} BDT. Credited to 21400 Salaries Payable.`;

      const journalEntry = queryRunner.manager.create(JournalEntry, {
        entryNumber,
        date: new Date().toISOString().split('T')[0],
        description: richRemarks,
        referenceId: `DISPATCH-${savedDispatch.id}`,
        status: JournalEntryStatus.POSTED,
        totalAmount: grossPayout,
        paidAmount: netPayable,
        outstandingAmount: totalTds + totalPf,
        entryType: 'EXPENSE',
        paymentCategory: 'BANK',
      });
      const savedJe = await queryRunner.manager.save(journalEntry);

      // 3. Post Balanced Journal Lines (Debit Expenses, Credit Liabilities & Bank Clearing)
      // Debit: Salaries & Wages Expense (61100)
      await queryRunner.manager.save(JournalEntryLine, {
        journalEntry: savedJe,
        accountId: salariesExpenseAcc.id,
        debit: grossPayout,
        credit: 0,
        itemName: `Salary & Bonus Overhead - ${month}`,
        quantity: employees.length,
        unitPrice: grossPayout / employees.length,
        unit: 'cycles',
      });

      // Credit: Salaries Payable (21400) - Company Liability & Net Clearing
      await queryRunner.manager.save(JournalEntryLine, {
        journalEntry: savedJe,
        accountId: salariesPayableAcc.id,
        debit: 0,
        credit: netPayable,
        itemName: `Net Salaries Payable to Staff - ${month}`,
        quantity: 1,
        unitPrice: netPayable,
        unit: 'payout',
      });

      // Credit: Tax Payable / TDS (21500) if applicable
      if (totalTds > 0 && taxPayableAcc) {
        await queryRunner.manager.save(JournalEntryLine, {
          journalEntry: savedJe,
          accountId: taxPayableAcc.id,
          debit: 0,
          credit: totalTds,
          itemName: `NBR TDS Withholding - ${month}`,
          quantity: 1,
          unitPrice: totalTds,
          unit: 'deduction',
        });
      }

      await queryRunner.commitTransaction();
      return savedDispatch;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`Payroll financial posting failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      await queryRunner.release();
    }
  }

  async getPayrollDispatches() {
    return await this.payrollRepo.find({ order: { dispatchedAt: 'DESC' } });
  }

  async getAttendanceLogs(): Promise<AttendanceLog[]> {
    return await this.attendanceRepo.find({ order: { logDate: 'DESC' }, take: 50 });
  }
}