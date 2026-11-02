import { Injectable, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ChartOfAccounts, AccountType } from './entities/chart-of-accounts.entity';
import { Party } from './entities/party.entity';
import { CostCenter, CostCenterType } from './entities/cost-center.entity';
import { JournalEntry, JournalEntryStatus } from './entities/journal-entry.entity';
import { JournalEntryLine } from './entities/journal-entry-line.entity';
import { OverheadSalary } from './entities/overhead-salary.entity';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { CreatePartyDto } from './dto/create-party.dto';
import { OverheadInputDto } from './dto/overhead-input.dto';

@Injectable()
export class FinanceService implements OnModuleInit {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(ChartOfAccounts) private coaRepo: Repository<ChartOfAccounts>,
    @InjectRepository(Party) private partyRepo: Repository<Party>,
    @InjectRepository(CostCenter) private costCenterRepo: Repository<CostCenter>,
    @InjectRepository(JournalEntry) private jeRepo: Repository<JournalEntry>,
    @InjectRepository(JournalEntryLine) private jelRepo: Repository<JournalEntryLine>,
    @InjectRepository(OverheadSalary) private overheadRepo: Repository<OverheadSalary>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultCostCenters();
    await this.seedDefaultChartOfAccounts();
  }

  private async seedDefaultCostCenters() {
    const count = await this.costCenterRepo.count();
    if (count === 0) {
      const defaultCenters = [
        { code: 'CC-HO', name: 'Head Office - Dhaka', type: CostCenterType.HEAD_OFFICE, isActive: true },
        { code: 'CC-PLANT', name: 'Birulia Manufacturing Plant', type: CostCenterType.PLANT, isActive: true },
        { code: 'CC-DHAKA', name: 'Depot - Dhaka', type: CostCenterType.DEPOT, isActive: true },
        { code: 'CC-MYM', name: 'Depot - Mymensingh', type: CostCenterType.DEPOT, isActive: true },
        { code: 'CC-DIN', name: 'Depot - Dinajpur', type: CostCenterType.DEPOT, isActive: true },
        { code: 'CC-RAJ', name: 'Depot - Rajshahi', type: CostCenterType.DEPOT, isActive: true },
        { code: 'CC-BOG', name: 'Depot - Bogura', type: CostCenterType.DEPOT, isActive: true },
        { code: 'CC-CTG', name: 'Depot - Chittagong', type: CostCenterType.DEPOT, isActive: true },
        { code: 'CC-COM', name: 'Depot - Comilla', type: CostCenterType.DEPOT, isActive: true },
        { code: 'CC-NOA', name: 'Depot - Noakhali', type: CostCenterType.DEPOT, isActive: true },
        { code: 'CC-SYL', name: 'Depot - Sylhet', type: CostCenterType.DEPOT, isActive: true },
        { code: 'CC-BAR', name: 'Depot - Barisal', type: CostCenterType.DEPOT, isActive: true },
        { code: 'CC-FAR', name: 'Depot - Faridpur', type: CostCenterType.DEPOT, isActive: true },
        { code: 'CC-JES', name: 'Depot - Jessore', type: CostCenterType.DEPOT, isActive: true },
        { code: 'CC-KUS', name: 'Depot - Kushtia', type: CostCenterType.DEPOT, isActive: true },
      ];

      for (const center of defaultCenters) {
        const exists = await this.costCenterRepo.findOne({ where: { code: center.code } });
        if (!exists) {
          await this.costCenterRepo.save(this.costCenterRepo.create(center));
        }
      }
      console.log('✅ Seeded Head Office, Plant, and 13 Sales Depots.');
    }
  }

  private async seedDefaultChartOfAccounts() {
    const count = await this.coaRepo.count();
    if (count === 0) {
      const defaultAccounts = [
        { code: '11100', name: 'Cash in Hand', type: AccountType.ASSET, groupName: 'Assets' },
        { code: '11200', name: 'Petty Cash', type: AccountType.ASSET, groupName: 'Assets' },
        { code: '11300', name: 'Bank Accounts', type: AccountType.ASSET, groupName: 'Assets' },
        { code: '11400', name: 'Mobile / Digital Wallet', type: AccountType.ASSET, groupName: 'Assets' },
        { code: '11500', name: 'Accounts Receivable', type: AccountType.ASSET, groupName: 'Assets' },
        { code: '11600', name: 'Employee Receivables', type: AccountType.ASSET, groupName: 'Assets' },
        { code: '11700', name: 'Advances to Suppliers', type: AccountType.ASSET, groupName: 'Assets' },
        { code: '11800', name: 'Inventory', type: AccountType.ASSET, groupName: 'Assets' },
        { code: '11900', name: 'Prepaid Expenses', type: AccountType.ASSET, groupName: 'Assets' },
        { code: '12100', name: 'Land', type: AccountType.ASSET, groupName: 'Assets' },
        { code: '12200', name: 'Buildings', type: AccountType.ASSET, groupName: 'Assets' },
        { code: '12300', name: 'Furniture & Fixtures', type: AccountType.ASSET, groupName: 'Assets' },
        { code: '12400', name: 'Computers & IT Equipment', type: AccountType.ASSET, groupName: 'Assets' },
        { code: '12500', name: 'Vehicles', type: AccountType.ASSET, groupName: 'Assets' },
        { code: '12600', name: 'Machinery', type: AccountType.ASSET, groupName: 'Assets' },
        { code: '12700', name: 'Accumulated Depreciation', type: AccountType.ASSET, groupName: 'Assets' },
        { code: '13100', name: 'Security Deposits', type: AccountType.ASSET, groupName: 'Assets' },
        { code: '13200', name: 'Long-term Investments', type: AccountType.ASSET, groupName: 'Assets' },
        { code: '13300', name: 'Intangible Assets', type: AccountType.ASSET, groupName: 'Assets' },
        { code: '21100', name: 'Accounts Payable', type: AccountType.LIABILITY, groupName: 'Liabilities' },
        { code: '21200', name: 'Supplier Advances', type: AccountType.LIABILITY, groupName: 'Liabilities' },
        { code: '21300', name: 'Accrued Expenses', type: AccountType.LIABILITY, groupName: 'Liabilities' },
        { code: '21400', name: 'Salaries Payable', type: AccountType.LIABILITY, groupName: 'Liabilities' },
        { code: '21500', name: 'Tax Payable', type: AccountType.LIABILITY, groupName: 'Liabilities' },
        { code: '21600', name: 'VAT / Sales Tax Payable', type: AccountType.LIABILITY, groupName: 'Liabilities' },
        { code: '21700', name: 'Customer Advances', type: AccountType.LIABILITY, groupName: 'Liabilities' },
        { code: '21800', name: 'Short-term Loans', type: AccountType.LIABILITY, groupName: 'Liabilities' },
        { code: '22100', name: 'Bank Loans', type: AccountType.LIABILITY, groupName: 'Liabilities' },
        { code: '22200', name: 'Lease Liabilities', type: AccountType.LIABILITY, groupName: 'Liabilities' },
        { code: '22300', name: 'Other Long-term Liabilities', type: AccountType.LIABILITY, groupName: 'Liabilities' },
        { code: '31100', name: 'Paid-up Capital', type: AccountType.EQUITY, groupName: 'Equity' },
        { code: '31200', name: 'Additional Capital', type: AccountType.EQUITY, groupName: 'Equity' },
        { code: '32100', name: 'Current Year Profit/Loss', type: AccountType.EQUITY, groupName: 'Equity' },
        { code: '32200', name: 'Previous Year Retained Earnings', type: AccountType.EQUITY, groupName: 'Equity' },
        { code: '33100', name: 'General Reserve', type: AccountType.EQUITY, groupName: 'Equity' },
        { code: '33200', name: 'Other Reserves', type: AccountType.EQUITY, groupName: 'Equity' },
        { code: '34100', name: 'Owner Drawings', type: AccountType.EQUITY, groupName: 'Equity' },
        { code: '34200', name: 'Dividends Paid', type: AccountType.EQUITY, groupName: 'Equity' },
        { code: '41100', name: 'Product Sales', type: AccountType.REVENUE, groupName: 'Revenue' },
        { code: '41200', name: 'Service Revenue', type: AccountType.REVENUE, groupName: 'Revenue' },
        { code: '41300', name: 'Project Revenue', type: AccountType.REVENUE, groupName: 'Revenue' },
        { code: '41400', name: 'Subscription Revenue', type: AccountType.REVENUE, groupName: 'Revenue' },
        { code: '42100', name: 'Delivery Income', type: AccountType.REVENUE, groupName: 'Revenue' },
        { code: '42200', name: 'Installation Income', type: AccountType.REVENUE, groupName: 'Revenue' },
        { code: '42300', name: 'Maintenance Income', type: AccountType.REVENUE, groupName: 'Revenue' },
        { code: '43100', name: 'Sales Returns', type: AccountType.REVENUE, groupName: 'Revenue' },
        { code: '43200', name: 'Sales Discounts', type: AccountType.REVENUE, groupName: 'Revenue' },
        { code: '51100', name: 'Cost of Goods Sold', type: AccountType.EXPENSE, groupName: 'Cost of Sales' },
        { code: '51200', name: 'Purchase Cost', type: AccountType.EXPENSE, groupName: 'Cost of Sales' },
        { code: '51300', name: 'Freight Inward', type: AccountType.EXPENSE, groupName: 'Cost of Sales' },
        { code: '51400', name: 'Import / Customs Cost', type: AccountType.EXPENSE, groupName: 'Cost of Sales' },
        { code: '52100', name: 'Raw Materials', type: AccountType.EXPENSE, groupName: 'Cost of Sales' },
        { code: '52200', name: 'Direct Labour', type: AccountType.EXPENSE, groupName: 'Cost of Sales' },
        { code: '52300', name: 'Factory Overhead', type: AccountType.EXPENSE, groupName: 'Cost of Sales' },
        { code: '61100', name: 'Salaries & Wages', type: AccountType.EXPENSE, groupName: 'Operating Expenses' },
        { code: '62100', name: 'Office Rent', type: AccountType.EXPENSE, groupName: 'Operating Expenses' },
        { code: '62200', name: 'Electricity', type: AccountType.EXPENSE, groupName: 'Operating Expenses' },
        { code: '62300', name: 'Internet & Telephone', type: AccountType.EXPENSE, groupName: 'Operating Expenses' },
      ];

      for (const acc of defaultAccounts) {
        const exists = await this.coaRepo.findOne({ where: { code: acc.code } });
        if (!exists) {
          await this.coaRepo.save(this.coaRepo.create(acc));
        }
      }
      console.log('✅ Seeded Chart of Accounts.');
    }
  }

  async getChartOfAccounts() {
    return this.coaRepo.find({ order: { code: 'ASC' } });
  }

  async createAccount(dto: any) {
    const account = this.coaRepo.create(dto);
    return this.coaRepo.save(account);
  }

  async getParties() {
    return this.partyRepo.find();
  }

  async createParty(dto: CreatePartyDto) {
    const party = this.partyRepo.create({
      ...dto,
      currentBalance: dto.openingBalance || 0,
    });
    return this.partyRepo.save(party);
  }

  async getCostCenters() {
    return this.costCenterRepo.find();
  }

  async createJournalEntry(dto: CreateJournalEntryDto) {
    const totalDebit = dto.lines.reduce((sum: number, line: any) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = dto.lines.reduce((sum: number, line: any) => sum + (Number(line.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(`Journal entry is unbalanced. Debits (${totalDebit}) must equal Credits (${totalCredit}).`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const vatVal = Number(dto.vatAmount) || 0;
      const grossVal = totalDebit + vatVal;
      const settledVal = Number(dto.settledAmount) || 0;
      const outVal = Number(dto.outstandingAmount) ?? Math.max(0, grossVal - settledVal);

      const journalEntry = queryRunner.manager.create(JournalEntry, {
        entryNumber: dto.entryNumber,
        date: dto.date,
        description: dto.description,
        referenceId: dto.referenceId,
        status: JournalEntryStatus.POSTED,
        partyId: dto.partyId || undefined,
        totalAmount: grossVal,
        paidAmount: settledVal,
        outstandingAmount: outVal,
        vatAmount: vatVal,
        entryType: dto.entryType || 'RECEIVABLE',
        paymentCategory: dto.paymentCategory || 'CASH',
      });
      const savedJe = await queryRunner.manager.save(journalEntry);

      for (const lineDto of dto.lines) {
        const line = queryRunner.manager.create(JournalEntryLine, {
          journalEntry: savedJe,
          accountId: lineDto.accountId,
          partyId: lineDto.partyId || dto.partyId || null,
          costCenterId: lineDto.costCenterId || null,
          debit: Number(lineDto.debit) || 0,
          credit: Number(lineDto.credit) || 0,
          itemName: lineDto.itemName || 'General Entry Line',
          item_name: lineDto.itemName || 'General Entry Line',
          quantity: Number(lineDto.quantity) || 0,
          unitPrice: Number(lineDto.unitPrice) || 0,
          unit_price: Number(lineDto.unitPrice) || 0,
          unit: lineDto.unit || 'pieces',
        } as any);
        await queryRunner.manager.save(line);

        if (lineDto.partyId || dto.partyId) {
          const party = await queryRunner.manager.findOne(Party, { 
            where: { id: lineDto.partyId || dto.partyId } 
          });
          if (party) {
            const netChange = (Number(lineDto.debit) || 0) - (Number(lineDto.credit) || 0);
            party.currentBalance = Number(party.currentBalance) + netChange;
            await queryRunner.manager.save(party);
          }
        }
      }

      await queryRunner.commitTransaction();
      return savedJe;
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(`Failed to post journal entry: ${errorMessage}`);
    } finally {
      await queryRunner.release();
    }
  }

  // ==========================================
  // DIRECT SALES ORDER & LEDGER SYNC ENGINE
  // ==========================================
  async createSalesOrderWithLedger(dto: {
    entryNumber: string;
    date: string;
    referenceId: string;
    description: string;
    clientName: string;
    clientPhone?: string;
    clientEmail?: string;
    clientAddress?: string;
    depotCode: string;
    depotName: string;
    fieldOfficer?: string;
    paymentTerms?: string;
    grandTotal?: number;
    lines: Array<{
      accountId: string;
      itemName: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      debit: number;
      credit: number;
    }>;
  }) {
    const totalDebit = dto.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = dto.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(`Sales voucher unbalanced. Total Debit (${totalDebit}) must equal Total Credit (${totalCredit}).`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Auto-register or find Client in parties table
      let party = await queryRunner.manager.findOne(Party, { where: { name: dto.clientName } });
      if (!party) {
        party = queryRunner.manager.create(Party, {
          id: crypto.randomUUID(),
          name: dto.clientName,
          type: 'CLIENT' as any,
          openingBalance: 0,
          currentBalance: 0,
          creditLimit: 100000,
          phone: dto.clientPhone || '',
          email: dto.clientEmail || '',
          address: dto.clientAddress || '',
          isActive: true,
        });
        await queryRunner.manager.save(party);
      }

      const totalVal = Number(dto.grandTotal) || totalDebit;
      const isPaid = (dto.paymentTerms || '').toLowerCase().includes('paid') || (dto.paymentTerms || '').toLowerCase().includes('cash') || (dto.paymentTerms || '').toLowerCase().includes('cheque');
      const paidVal = isPaid ? totalVal : 0;
      const outVal = totalVal - paidVal;

      // 2. Build Rich Structured Description for Seamless Pipeline Parsing
      const richDescription = `Client: ${dto.clientName} | Depot: ${dto.depotName || dto.depotCode} | Field Officer: ${dto.fieldOfficer || 'Assigned Field Officer'} | Terms: ${dto.paymentTerms || 'Unpaid'} | Total: ${totalVal} BDT | ${dto.description || ''}`;

      // 3. Create Journal Entry Header with Full Financial Properties
      const journalEntry = queryRunner.manager.create(JournalEntry, {
        entryNumber: dto.entryNumber,
        date: dto.date,
        description: richDescription,
        referenceId: dto.referenceId,
        status: JournalEntryStatus.POSTED,
        partyId: party.id,
        party: party,
        totalAmount: totalVal,
        paidAmount: paidVal,
        outstandingAmount: outVal,
        entryType: 'RECEIVABLE',
        paymentCategory: isPaid ? 'CASH' : 'CREDIT',
      });
      const savedJe = await queryRunner.manager.save(journalEntry);

      // 4. Post Multi-line Itemization & Update Party Balance
      let netPartyChange = 0;
      for (const lineDto of dto.lines) {
        const line = queryRunner.manager.create(JournalEntryLine, {
          journalEntry: savedJe,
          accountId: lineDto.accountId,
          partyId: party.id,
          debit: Number(lineDto.debit) || 0,
          credit: Number(lineDto.credit) || 0,
          itemName: lineDto.itemName,
          item_name: lineDto.itemName,
          quantity: Number(lineDto.quantity) || 0,
          unitPrice: Number(lineDto.unitPrice) || 0,
          unit_price: Number(lineDto.unitPrice) || 0,
          unit: lineDto.unit || 'pieces',
        } as any);
        await queryRunner.manager.save(line);

        netPartyChange += (Number(lineDto.debit) || 0) - (Number(lineDto.credit) || 0);
      }

      party.currentBalance = Number(party.currentBalance) + netPartyChange;
      await queryRunner.manager.save(party);

      await queryRunner.commitTransaction();
      return savedJe;
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(`Failed to post sales order ledger: ${errorMessage}`);
    } finally {
      await queryRunner.release();
    }
  }

  async getJournalEntries() {
    return this.jeRepo.find({
      relations: { lines: { account: true, party: true, costCenter: true }, party: true },
      order: { date: 'DESC' },
    });
  }

  async getJournals() {
    return this.jeRepo.find({
      relations: {
        lines: {
          account: true,
          party: true,
          costCenter: true,
        },
        party: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getJournalEntryById(id: string) {
    const je = await this.jeRepo.findOne({
      where: { id },
      relations: { lines: { account: true, party: true, costCenter: true }, party: true },
    });
    if (!je) throw new NotFoundException('Journal voucher not found.');
    return je;
  }

  async upsertOverhead(dto: OverheadInputDto) {
    let overhead = await this.overheadRepo.findOne({
      where: { costCenterId: dto.costCenterId, period: dto.period },
    });

    const totalOverhead = (dto.employeeSalary || 0) + (dto.laborSalary || 0) + (dto.utilities || 0) + (dto.capex || 0) + (dto.opex || 0);

    if (overhead) {
      overhead.employeeSalary = dto.employeeSalary || 0;
      overhead.laborSalary = dto.laborSalary || 0;
      overhead.utilities = dto.utilities || 0;
      overhead.capex = dto.capex || 0;
      overhead.opex = dto.opex || 0;
      overhead.totalOverhead = totalOverhead;
      overhead.remarks = dto.remarks;
    } else {
      overhead = this.overheadRepo.create({
        costCenterId: dto.costCenterId,
        period: dto.period,
        employeeSalary: dto.employeeSalary || 0,
        laborSalary: dto.laborSalary || 0,
        utilities: dto.utilities || 0,
        capex: dto.capex || 0,
        opex: dto.opex || 0,
        totalOverhead,
        remarks: dto.remarks,
      });
    }

    return this.overheadRepo.save(overhead);
  }

  async generateFinancialReport(type: 'P_L' | 'BALANCE_SHEET' | 'TRIAL_BALANCE', startDate: string, endDate: string, costCenterId?: string) {
    const query = this.jelRepo.createQueryBuilder('jel')
      .leftJoinAndSelect('jel.account', 'account')
      .leftJoin('jel.journalEntry', 'je')
      .where('je.date >= :startDate', { startDate })
      .andWhere('je.date <= :endDate', { endDate });

    if (costCenterId) {
      query.andWhere('jel.costCenterId = :costCenterId', { costCenterId });
    }

    if (type === 'P_L') {
      query.andWhere('account.type IN (:...types)', { types: [AccountType.REVENUE, AccountType.EXPENSE] });
    } else if (type === 'BALANCE_SHEET') {
      query.andWhere('account.type IN (:...types)', { types: [AccountType.ASSET, AccountType.LIABILITY, AccountType.EQUITY] });
    }

    query.select('account.id', 'accountId')
      .addSelect('account.code', 'code')
      .addSelect('account.name', 'accountName')
      .addSelect('account.type', 'accountType')
      .addSelect('SUM(jel.debit)', 'totalDebit')
      .addSelect('SUM(jel.credit)', 'totalCredit')
      .groupBy('account.id')
      .addGroupBy('account.code')
      .addGroupBy('account.name')
      .addGroupBy('account.type');

    const rawData = await query.getRawMany();

    return {
      reportType: type,
      period: { startDate, endDate },
      costCenterId: costCenterId || 'CONSOLIDATED',
      data: rawData,
    };
  }
}