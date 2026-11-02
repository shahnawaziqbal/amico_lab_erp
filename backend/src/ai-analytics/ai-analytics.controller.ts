import { Controller, Get, Post, Body } from '@nestjs/common';
import { AiAnalyticsService } from './ai-analytics.service';
import { AiModelMetric } from './ai-analytics.entity';

@Controller('ai-analytics')
export class AiAnalyticsController {
  constructor(private readonly aiService: AiAnalyticsService) {}

  @Get()
  async getAllMetrics(): Promise<AiModelMetric[]> {
    return await this.aiService.findAll();
  }

  @Post()
  async createMetric(@Body() metricData: Partial<AiModelMetric>): Promise<AiModelMetric> {
    return await this.aiService.createMetric(metricData);
  }
}