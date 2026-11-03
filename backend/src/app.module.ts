import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Import all entities
import { User } from './users/user.entity';
import { PurchaseOrder, PurchaseOrderItem } from './procurement/entities/purchase-order.entity';
import { Requisition } from './procurement/entities/requisition.entity';
import { Rfq } from './procurement/entities/rfq.entity';
import { SupplierQuotation } from './procurement/entities/supplier-quotation.entity';
import { QuarantineItem } from './procurement/entities/quarantine-item.entity';
import { DepotInventory } from './inventory/entities/depot-inventory.entity';
import { RawMaterialLot } from './inventory/entities/raw-material-lot.entity';
import { RecipeBomMaster } from './production/entities/recipe-bom-master.entity';
import { ProductionBatchMaster } from './production/entities/production-batch-master.entity';
//import { ProductionBatch } from './production/production.entity';
import { QualityInspection } from './quality/quality.entity';
import { SalesOrder } from './sales/sales.entity';
import { CostCenter } from './finance/entities/cost-center.entity';
import { Party } from './finance/entities/party.entity';
import { Employee } from './hrm/hrm.entity';
import { ComplianceRecord } from './compliance/compliance.entity';
import { Customer } from './crm/crm.entity';
import { RmdProject } from './rmd/rmd.entity';
import { AiModelMetric } from './ai-analytics/ai-analytics.entity';
import { Asset } from './maintenance/entities/asset.entity';
import { WorkOrder } from './maintenance/entities/work-order.entity';
import { CalibrationLog } from './maintenance/entities/calibration-log.entity';
import { Product } from './products/products.entity';
import { FieldOfficer } from './field-officers/field-officers.entity';

// Import all modules
import { UsersModule } from './users/users.module';
import { ProcurementModule } from './procurement/procurement.module';
import { InventoryModule } from './inventory/inventory.module';
import { ProductionModule } from './production/production.module';
import { QualityModule } from './quality/quality.module';
import { SalesModule } from './sales/sales.module';
import { FinanceModule } from './finance/finance.module';
import { HrmModule } from './hrm/hrm.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { ComplianceModule } from './compliance/compliance.module';
import { CrmModule } from './crm/crm.module';
import { RmdModule } from './rmd/rmd.module';
import { AiAnalyticsModule } from './ai-analytics/ai-analytics.module';
import { ProductsModule } from './products/products.module';
import { FieldOfficersModule } from './field-officers/field-officers.module';
import { RequisitionsModule } from './requisitions/requisitions.module';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      autoLoadEntities: true,
      database: join(__dirname, '../../database/amico_erp.sqlite'),
      entities: [
        User,
        PurchaseOrder,
        PurchaseOrderItem,
        Requisition,
        Rfq,
        SupplierQuotation,
        QuarantineItem,
        DepotInventory,
        RawMaterialLot,
        ProductionModule,
        // ProductionBatch,
        ProductionBatchMaster,
        RecipeBomMaster,
        QualityInspection,
        SalesOrder,
        Employee,
        Asset,
        WorkOrder,
        CalibrationLog,
        ComplianceRecord,
        Customer,
        RmdProject,
        AiModelMetric,
        CostCenter,
        Party,
        Product,
        FieldOfficer,
      ],
      synchronize: true, // Critical: set to false to protect your seeded SQLite data
    }),
    UsersModule,
    ProcurementModule,
    InventoryModule,
    ProductionModule,
    QualityModule,
    SalesModule,
    FinanceModule,
    HrmModule,
    MaintenanceModule,
    ComplianceModule,
    CrmModule,
    RmdModule,
    AiAnalyticsModule,
    ProductsModule,
    FieldOfficersModule,
    RequisitionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}