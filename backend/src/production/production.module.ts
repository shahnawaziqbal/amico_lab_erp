import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { QrGeneratorService } from './qr-generator.service'; // <--- 1. Import it here
import { RecipeBomMaster } from './entities/recipe-bom-master.entity';
import { ProductionBatchMaster } from './entities/production-batch-master.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecipeBomMaster, ProductionBatchMaster]),
  ],
  controllers: [ProductionController],
  providers: [
    ProductionService,
    QrGeneratorService, // <--- 2. Register it in providers
  ],
  exports: [ProductionService, QrGeneratorService],
})
export class ProductionModule {}