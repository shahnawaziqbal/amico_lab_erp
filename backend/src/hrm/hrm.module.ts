// hrm.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrmController } from './hrm.controller';
import { HrmService } from './hrm.service';
import { Employee, AttendanceLog, PayrollDispatch } from './hrm.entity';
import { ChartOfAccounts } from '../finance/entities/chart-of-accounts.entity'; // Adjust relative import path as needed

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      AttendanceLog,
      PayrollDispatch,
      ChartOfAccounts, // <--- Add this entity here!
    ]),
  ],
  controllers: [HrmController],
  providers: [HrmService],
  exports: [HrmService],
})
export class HrmModule {}