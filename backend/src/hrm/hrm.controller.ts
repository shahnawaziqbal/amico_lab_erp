import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { RequirePermissions } from '../users/guards/require-permissions.decorator';
// hrm.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { HrmService } from './hrm.service';
import { Employee, AttendanceLog, PayrollDispatch } from './hrm.entity';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('hrm')
export class HrmController {
  constructor(private readonly hrmService: HrmService) {}

  @RequirePermissions('hrm.view')
  @Get('employees')
  async getEmployees(): Promise<Employee[]> {
    return await this.hrmService.findAllEmployees();
  }

  @RequirePermissions('hrm.create')
  @Post('employees')
  async createEmployee(@Body() data: Partial<Employee>): Promise<Employee> {
    return await this.hrmService.createEmployee(data);
  }

  @RequirePermissions('hrm.view')
  @Get('metrics')
  async getMetrics() {
    return await this.hrmService.getMetrics();
  }

  @RequirePermissions('hrm.approve')
  @Post('payroll/dispatch')
  async runPayroll(@Body('month') month: string): Promise<PayrollDispatch> {
    return await this.hrmService.runPayrollDispatch(month || 'October 2026');
  }

  @RequirePermissions('hrm.view')
  @Get('attendance')
  async getAttendance(): Promise<AttendanceLog[]> {
    return await this.hrmService.getAttendanceLogs();
  }
}