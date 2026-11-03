import { UsersModule } from '../users/users.module';
import { RbacService } from '../users/permissions/rbac.service';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiAnalyticsController } from './ai-analytics.controller';
import { AiAnalyticsService } from './ai-analytics.service';
import { AiModelMetric } from './ai-analytics.entity';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([AiModelMetric])],
  controllers: [AiAnalyticsController],
  providers: [PermissionsGuard, RbacService, AiAnalyticsService],
  exports: [AiAnalyticsService],
})
export class AiAnalyticsModule {}