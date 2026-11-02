import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiAnalyticsController } from './ai-analytics.controller';
import { AiAnalyticsService } from './ai-analytics.service';
import { AiModelMetric } from './ai-analytics.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AiModelMetric])],
  controllers: [AiAnalyticsController],
  providers: [AiAnalyticsService],
  exports: [AiAnalyticsService],
})
export class AiAnalyticsModule {}