import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { WarehouseStock } from './entities/warehouse-stock.entity';
import { InternalRequisition } from './entities/internal-requisition.entity';
import { DepotInventory } from './entities/depot-inventory.entity';
import { RawMaterialLot } from './entities/raw-material-lot.entity';

// Controllers
import { InventoryController } from './controllers/inventory.controller';
import { InternalReqController } from './controllers/internal-req.controller';

// Services
import { InventoryService } from './services/inventory.service';
import { InternalReqService } from './services/internal-req.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WarehouseStock,
      InternalRequisition,
      DepotInventory,
      RawMaterialLot,
    ]),
  ],
  controllers: [
    InventoryController,
    InternalReqController,
  ],
  providers: [
    InventoryService,
    InternalReqService,
  ],
  exports: [
    InventoryService,
    InternalReqService,
  ],
})
export class InventoryModule {}