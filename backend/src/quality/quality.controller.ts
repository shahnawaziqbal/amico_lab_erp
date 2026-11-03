import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { RequirePermissions } from '../users/guards/require-permissions.decorator';
// backend/src/quality/quality.controller.ts
import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { QualityService } from './quality.service';
import { QualityInspection } from './quality.entity';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('quality')
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @RequirePermissions('quality.view')
  @Get()
  async findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<QualityInspection[]> {
    return this.qualityService.findAll(startDate, endDate);
  }

  @RequirePermissions('quality.create')
  @Post()
  async create(@Body() data: Partial<QualityInspection>): Promise<QualityInspection> {
    return this.qualityService.create(data);
  }
}