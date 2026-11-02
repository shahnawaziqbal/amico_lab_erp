import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { Asset } from './entities/asset.entity';
import { WorkOrder } from './entities/work-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Asset, WorkOrder])],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}