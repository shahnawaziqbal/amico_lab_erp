import { UsersModule } from '../users/users.module';
import { RbacService } from '../users/permissions/rbac.service';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { ChartOfAccounts } from './entities/chart-of-accounts.entity';
import { Party } from './entities/party.entity';
import { CostCenter } from './entities/cost-center.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalEntryLine } from './entities/journal-entry-line.entity';
import { OverheadSalary } from './entities/overhead-salary.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([
      ChartOfAccounts,
      Party,
      CostCenter,
      JournalEntry,
      JournalEntryLine,
      OverheadSalary,
    ]),
  ],
  controllers: [FinanceController],
  providers: [PermissionsGuard, RbacService, FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}