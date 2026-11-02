// hrm.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { HrmService } from './hrm.service';
import { Employee, AttendanceLog, PayrollDispatch } from './hrm.entity';

@Controller('hrm')
export class HrmController {
  constructor(private readonly hrmService: HrmService) {}

  @Get('employees')
  async getEmployees(): Promise<Employee[]> {
    return await this.hrmService.findAllEmployees();
  }

  @Post('employees')
  async createEmployee(@Body() data: Partial<Employee>): Promise<Employee> {
    return await this.hrmService.createEmployee(data);
  }

  @Get('metrics')
  async getMetrics() {
    return await this.hrmService.getMetrics();
  }

  @Post('payroll/dispatch')
  async runPayroll(@Body('month') month: string): Promise<PayrollDispatch> {
    return await this.hrmService.runPayrollDispatch(month || 'October 2026');
  }

  @Get('attendance')
  async getAttendance(): Promise<AttendanceLog[]> {
    return await this.hrmService.getAttendanceLogs();
  }
}