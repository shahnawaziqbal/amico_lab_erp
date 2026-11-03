import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { RequirePermissions } from '../users/guards/require-permissions.decorator';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceRecord } from './compliance.entity';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @RequirePermissions('compliance.view')
  @Get()
  async getAllRecords(): Promise<ComplianceRecord[]> {
    return await this.complianceService.findAll();
  }

  @RequirePermissions('compliance.create')
  @Post()
  async createRecord(@Body() recordData: Partial<ComplianceRecord>): Promise<ComplianceRecord> {
    return await this.complianceService.createRecord(recordData);
  }
}