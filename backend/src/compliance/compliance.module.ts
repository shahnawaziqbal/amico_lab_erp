import { UsersModule } from '../users/users.module';
import { RbacService } from '../users/permissions/rbac.service';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { ComplianceRecord } from './compliance.entity';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([ComplianceRecord])],
  controllers: [ComplianceController],
  providers: [PermissionsGuard, RbacService, ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}