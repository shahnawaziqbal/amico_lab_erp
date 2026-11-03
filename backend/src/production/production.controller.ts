import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { RequirePermissions } from '../users/guards/require-permissions.decorator';
import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { ProductionService } from './production.service';
import { CreateBomDto } from './dto/create-bom.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchStatusDto } from './dto/update-batch-status.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @RequirePermissions('production.view')
  @Get('boms')
  async getAllBoms() {
    return await this.productionService.findAllBoms();
  }

  @RequirePermissions('production.create')
  @Post('boms')
  async createBom(@Body() dto: CreateBomDto) {
    return await this.productionService.createBom(dto);
  }

  @RequirePermissions('production.view')
  @Get('batches')
  async getAllBatches() {
    return await this.productionService.findAllBatches();
  }

  @RequirePermissions('production.create')
  @Post('batches')
  async createBatch(@Body() dto: CreateBatchDto) {
    return await this.productionService.createBatch(dto);
  }

  @RequirePermissions('production.approve')
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