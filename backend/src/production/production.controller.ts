import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { ProductionService } from './production.service';
import { CreateBomDto } from './dto/create-bom.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchStatusDto } from './dto/update-batch-status.dto';

@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get('boms')
  async getAllBoms() {
    return await this.productionService.findAllBoms();
  }

  @Post('boms')
  async createBom(@Body() dto: CreateBomDto) {
    return await this.productionService.createBom(dto);
  }

  @Get('batches')
  async getAllBatches() {
    return await this.productionService.findAllBatches();
  }

  @Post('batches')
  async createBatch(@Body() dto: CreateBatchDto) {
    return await this.productionService.createBatch(dto);
  }

  @Patch('batches/:id/status')
  async updateBatchStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBatchStatusDto,
  ) {
    return await this.productionService.updateBatchStatus(
      +id,
      dto.status,
      dto.bmrStagesJson,
    );
  }
}