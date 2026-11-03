import { UsersModule } from '../users/users.module';
import { RbacService } from '../users/permissions/rbac.service';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { Asset } from './entities/asset.entity';
import { WorkOrder } from './entities/work-order.entity';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([Asset, WorkOrder])],
  controllers: [MaintenanceController],
  providers: [PermissionsGuard, RbacService, MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}