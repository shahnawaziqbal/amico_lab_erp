// backend/src/procurement/procurement.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Requisition } from './entities/requisition.entity';
import { Rfq } from './entities/rfq.entity';
import { SupplierQuotation } from './entities/supplier-quotation.entity';
import { PurchaseOrder, PurchaseOrderItem } from './entities/purchase-order.entity';
import { QuarantineItem } from './entities/quarantine-item.entity';

import { RequisitionController } from './controllers/requisition.controller';
import { RfqController } from './controllers/rfq.controller';
import { SupplierQuotationController } from './controllers/supplier-quotation.controller';
import { PurchaseOrderController } from './controllers/purchase-order.controller';
import { QcQuarantineController } from './controllers/qc-quarantine.controller';

import { RequisitionService } from './services/requisition.service';
import { RfqService } from './services/rfq.service';
import { PurchaseOrderService } from './services/purchase-order.service';
import { QcQuarantineService } from './services/qc-quarantine.service';

import { ChartOfAccounts } from '../finance/entities/chart-of-accounts.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Requisition,
      Rfq,
      SupplierQuotation,
      PurchaseOrder,
      PurchaseOrderItem,
      QuarantineItem,
      ChartOfAccounts,
    ]),
  ],
  controllers: [
    RequisitionController,
    RfqController,
    SupplierQuotationController,
    PurchaseOrderController,
    QcQuarantineController,
  ],
  providers: [
    RequisitionService,
    RfqService,
    PurchaseOrderService,
    QcQuarantineService,
  ],
  exports: [
    PurchaseOrderService,
    QcQuarantineService,
    TypeOrmModule,
  ],
})
export class ProcurementModule {}