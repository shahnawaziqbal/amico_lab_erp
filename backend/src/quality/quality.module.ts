import { UsersModule } from '../users/users.module';
import { RbacService } from '../users/permissions/rbac.service';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualityController } from './quality.controller';
import { QualityService } from './quality.service';
import { QualityInspection } from './quality.entity';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([QualityInspection])],
  controllers: [QualityController],
  providers: [PermissionsGuard, RbacService, QualityService],
  exports: [QualityService],
})
export class QualityModule {}