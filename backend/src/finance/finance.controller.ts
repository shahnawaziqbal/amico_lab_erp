import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { RequirePermissions } from '../users/guards/require-permissions.decorator';
import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { CreatePartyDto } from './dto/create-party.dto';
import { OverheadInputDto } from './dto/overhead-input.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ==========================================
  // CHART OF ACCOUNTS
  // ==========================================
  @RequirePermissions('finance.view')
  @Get('accounts')
  async getChartOfAccounts() {
    return this.financeService.getChartOfAccounts();
  }

  @RequirePermissions('finance.create')
  @Post('accounts')
  async createAccount(@Body() dto: any) {
    return this.financeService.createAccount(dto);
  }

  // ==========================================
  // PARTIES & VENDORS (AUTO-REGISTER CLIENTS)
  // ==========================================
  @RequirePermissions('finance.view')
  @Get('parties')
  async getParties() {
    return this.financeService.getParties();
  }

  @RequirePermissions('finance.create')
  @Post('parties')
  async createParty(@Body() dto: CreatePartyDto) {
    return this.financeService.createParty(dto);
  }

  // ==========================================
  // COST CENTERS & DEPOT ATTRIBUTION
  // ==========================================
  @RequirePermissions('finance.view')
  @Get('cost-centers')
  async getCostCenters() {
    return this.financeService.getCostCenters();
  }

  // ==========================================
  // JOURNAL ENTRIES & LEDGER VOUCHERS
  // ==========================================
  @RequirePermissions('finance.view')
  @Get('journals')
  async getJournalEntries() {
    return this.financeService.getJournalEntries();
  }

  @RequirePermissions('finance.view')
  @Get('journals/:id')
  async getJournalEntryById(@Param('id') id: string) {
    return this.financeService.getJournalEntryById(id);
  }

  @RequirePermissions('finance.approve')
  @Post('journal-entries')
  async createJournalEntry(@Body() dto: CreateJournalEntryDto) {
    return this.financeService.createJournalEntry(dto);
  }

  // NOTE: POST 'sales-orders' has been removed here because it is 
  // fully handled in SalesController to ensure proper itemized 
  // journal_entry_lines synchronization and data fidelity.

  // ==========================================
  // PLANT OVERHEADS & FINANCIAL REPORTS
  // ==========================================
  @RequirePermissions('finance.update')
  @Post('overheads')
  async upsertOverhead(@Body() dto: OverheadInputDto) {
    return this.financeService.upsertOverhead(dto);
  }

  @RequirePermissions('finance.view')
  @Get('reports')
  async generateReport(
    @Query('type') type: 'P_L' | 'BALANCE_SHEET' | 'TRIAL_BALANCE',
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('costCenterId') costCenterId?: string,
  ) {
    return this.financeService.generateFinancialReport(type, startDate, endDate, costCenterId);
  }
}