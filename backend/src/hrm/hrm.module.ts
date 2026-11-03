import { UsersModule } from '../users/users.module';
import { RbacService } from '../users/permissions/rbac.service';
import { PermissionsGuard } from '../users/guards/permissions.guard';
// hrm.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrmController } from './hrm.controller';
import { HrmService } from './hrm.service';
import { Employee, AttendanceLog, PayrollDispatch } from './hrm.entity';
import { ChartOfAccounts } from '../finance/entities/chart-of-accounts.entity'; // Adjust relative import path as needed

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([
      Employee,
      AttendanceLog,
      PayrollDispatch,
      ChartOfAccounts, // <--- Add this entity here!
    ]),
  ],
  controllers: [HrmController],
  providers: [PermissionsGuard, RbacService, HrmService],
  exports: [HrmService],
})
export class HrmModule {}