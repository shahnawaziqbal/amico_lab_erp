import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { RequirePermissions } from '../users/guards/require-permissions.decorator';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { AiAnalyticsService } from './ai-analytics.service';
import { AiModelMetric } from './ai-analytics.entity';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('ai-analytics')
export class AiAnalyticsController {
  constructor(private readonly aiService: AiAnalyticsService) {}

  @RequirePermissions('analytics.view')
  @Get()
  async getAllMetrics(): Promise<AiModelMetric[]> {
    return await this.aiService.findAll();
  }

  @RequirePermissions()
  @Post()
  async createMetric(@Body() metricData: Partial<AiModelMetric>): Promise<AiModelMetric> {
    return await this.aiService.createMetric(metricData);
  }
}