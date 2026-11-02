import { Controller, Get, Post, Body } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceRecord } from './compliance.entity';

@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get()
  async getAllRecords(): Promise<ComplianceRecord[]> {
    return await this.complianceService.findAll();
  }

  @Post()
  async createRecord(@Body() recordData: Partial<ComplianceRecord>): Promise<ComplianceRecord> {
    return await this.complianceService.createRecord(recordData);
  }
}