import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiModelMetric } from './ai-analytics.entity';

@Injectable()
export class AiAnalyticsService {
  constructor(
    @InjectRepository(AiModelMetric)
    private aiRepo: Repository<AiModelMetric>,
  ) {}

  async findAll(): Promise<AiModelMetric[]> {
    const metrics = await this.aiRepo.find();
    if (metrics.length === 0) {
      // Seed initial enterprise predictive engine state if empty
      const defaultModel = this.aiRepo.create({
        modelName: 'CLTV Catalyst Regressor v2',
        metricType: 'Customer Lifetime Value & Demand Forecasting',
        accuracyScore: 0.984,
        status: 'Active',
      });
      await this.aiRepo.save(defaultModel);
      return [defaultModel];
    }
    return metrics;
  }

  async createMetric(metricData: Partial<AiModelMetric>): Promise<AiModelMetric> {
    const newMetric = this.aiRepo.create(metricData);
    return await this.aiRepo.save(newMetric);
  }
}