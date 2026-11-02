// backend/src/quality/quality.controller.ts
import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { QualityService } from './quality.service';
import { QualityInspection } from './quality.entity';

@Controller('quality')
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Get()
  async findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<QualityInspection[]> {
    return this.qualityService.findAll(startDate, endDate);
  }

  @Post()
  async create(@Body() data: Partial<QualityInspection>): Promise<QualityInspection> {
    return this.qualityService.create(data);
  }
}